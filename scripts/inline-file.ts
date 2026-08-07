import { readdir, readFile, writeFile } from "fs/promises";
import { join, relative, dirname, normalize } from "path";

const dist = "dist/client";

async function walk(dir: string, files: string[] = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, e.name);
    if (e.isDirectory()) await walk(path, files);
    else files.push(path);
  }
  return files;
}

const resolveHref = (htmlRel: string, href: string) => {
  const clean = href.split("?")[0].split("#")[0];
  if (clean.startsWith("/")) return clean.slice(1);
  return normalize(join(dirname(htmlRel), clean)).replace(/\\/g, "/");
};

async function main() {
  const files = await walk(dist);
  const htmlFiles = files.filter((f) => f.endsWith(".html"));

  const mimes: Record<string, string> = {
    ".css": "text/css",
    ".js": "text/javascript",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
  };
  const assetUrls: Record<string, string> = {};
  for (const f of files.filter((f) => f.includes("assets") && !f.endsWith(".js"))) {
    const buf = await readFile(f);
    const ext = f.slice(f.lastIndexOf("."));
    const mime = mimes[ext] || "application/octet-stream";
    assetUrls[f.slice(f.lastIndexOf("/") + 1)] = `data:${mime};base64,${buf.toString("base64")}`;
  }

  for (const path of htmlFiles) {
    const htmlRel = relative(dist, path).replace(/\\/g, "/");
    let html = await readFile(path, "utf-8");

    // drop hints that point at files we are about to inline
    html = html.replace(/<link[^>]*rel="(modulepreload|preload|prefetch)"[^>]*>/gi, "");

    // <link rel="stylesheet" href="..."> -> <style>
    html = await replaceAsync(
      html,
      /<link[^>]*rel="stylesheet"[^>]*>/gi,
      async (tag: string) => {
        const m = tag.match(/href="([^"]+)"/i);
        if (!m || /^https?:/i.test(m[1])) return tag;
        const css = await safeRead(join(dist, resolveHref(htmlRel, m[1])));
        return css === null ? tag : `<style>${css}</style>`;
      },
    );

    // <script type="module" src="..."> -> inline module (single bundle, no imports)
    html = await replaceAsync(
      html,
      /<script([^>]*)\ssrc="([^"]+)"([^>]*)><\/script>/gi,
      async (tag: string, pre: string, src: string, post: string) => {
        if (/^https?:/i.test(src)) return tag;
        let js = await safeRead(join(dist, resolveHref(htmlRel, src)));
        if (js === null) return tag;
        // `new URL("asset.css", import.meta.url)` cannot resolve from an inline
        // module, so bake those assets in as data urls
        for (const [name, url] of Object.entries(assetUrls)) {
          js = js.split(`\`${name}\``).join(`\`${url}\``);
          js = js.split(`"${name}"`).join(`"${url}"`);
          js = js.split(`'${name}'`).join(`'${url}'`);
        }
        const safe = js.replace(/<\/script/gi, "<\\/script");
        return `<script${pre}${post}>${safe}</script>`;
      },
    );

    // favicon -> data url
    const icon = await safeReadBuf(join(dist, "favicon.png"));
    if (icon) {
      html = html.replace(
        /href="[^"]*favicon\.png"/gi,
        `href="data:image/png;base64,${icon.toString("base64")}"`,
      );
    }

    // the SSR manifest still names the bundle for preload/hydration; the code
    // is already inline, so point those leftovers at an empty module
    html = html.replace(/"\/(?:\.\/)?assets\/[^"]+\.js"/g, '"data:text/javascript,"');

    await writeFile(path, html, "utf-8");
    console.log("inlined", htmlRel);
  }

  console.log("Done. Every .html in dist/client opens standalone (double-click works).");
}

async function safeRead(p: string) {
  try {
    return await readFile(p, "utf-8");
  } catch {
    return null;
  }
}
async function safeReadBuf(p: string) {
  try {
    return await readFile(p);
  } catch {
    return null;
  }
}

async function replaceAsync(
  input: string,
  re: RegExp,
  fn: (...args: string[]) => Promise<string>,
) {
  const jobs: Promise<string>[] = [];
  input.replace(re, (...args) => {
    jobs.push(fn(...(args.slice(0, -2) as string[])));
    return "";
  });
  const done = await Promise.all(jobs);
  let i = 0;
  return input.replace(re, () => done[i++]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
