// Builds the site into dist/.
//
//   node build.mjs         one-off build
//   node build.mjs --dev   build, watch, serve on http://localhost:4321
//
// Pages live in site/pages as plain HTML, posts in site/blog as Markdown.
// Both start with a small "key: value" header between --- lines. Everything
// gets wrapped in site/layout.html. The JS and CSS go through esbuild.

import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { watch } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import * as esbuild from "esbuild";
import { marked } from "marked";

const OUT = "dist";
const DEV = process.argv.includes("--dev");
const PORT = 4321;

const NAV = [
  ["projects", "/projects/"],
  ["blog", "/blog/"],
  ["likes", "/likes/"],
  ["contact", "/contact/"],
];

function frontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: src.slice(m[0].length) };
}

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const longDate = (iso) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

// fallback for no JS, the page recounts it
function ageToday() {
  const now = new Date();
  const had = now.getMonth() > 7 || (now.getMonth() === 7 && now.getDate() >= 18);
  return now.getFullYear() - 2008 - (had ? 0 : 1);
}

let assetVersion = "dev";

async function renderPage(layout, { path, title, description, body, type = "website" }) {
  const nav = NAV.map(([label, href]) => {
    const here = path === href || (href !== "/" && path.startsWith(href));
    return `<a href="${href}"${here ? ' aria-current="page"' : ""}>${label}</a>`;
  }).join("\n        ");

  const html = layout
    .replaceAll("{{title}}", esc(title))
    .replaceAll("{{description}}", esc(description ?? ""))
    .replaceAll("{{type}}", type)
    .replaceAll("{{v}}", assetVersion)
    .replaceAll("{{year}}", String(new Date().getFullYear()))
    .replace("{{home}}", path === "/" ? ' aria-current="page"' : "")
    .replace("{{nav}}", nav)
    .replace("{{content}}", body.trim().replaceAll("{{age}}", String(ageToday())));

  const file = path === "/404" ? join(OUT, "404.html") : join(OUT, path, "index.html");
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, html);
}

async function buildPages() {
  const layout = await readFile("site/layout.html", "utf8");

  for (const name of await readdir("site/pages")) {
    const { meta, body } = frontMatter(await readFile(join("site/pages", name), "utf8"));
    const slug = name.replace(/\.html$/, "");
    const path = slug === "index" ? "/" : slug === "404" ? "/404" : `/${slug}/`;
    await renderPage(layout, { path, title: meta.title, description: meta.description, body });
  }

  const posts = [];
  for (const name of await readdir("site/blog")) {
    if (!name.endsWith(".md")) continue;
    const { meta, body } = frontMatter(await readFile(join("site/blog", name), "utf8"));
    posts.push({ ...meta, slug: name.replace(/\.md$/, ""), html: marked.parse(body) });
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));

  for (const p of posts) {
    await renderPage(layout, {
      path: `/blog/${p.slug}/`,
      title: `${p.title} - Luca Zani`,
      description: p.summary,
      type: "article",
      body: `
<article>
  <p class="date"><time datetime="${p.date}">${longDate(p.date)}</time></p>
  <h1>${esc(p.title)}</h1>
  ${p.html}
</article>
<p class="back"><a href="/blog/">&larr; all posts</a></p>`,
    });
  }

  const list = posts
    .map(
      (p) => `
  <li>
    <time datetime="${p.date}">${p.date}</time>
    <a href="/blog/${p.slug}/">${esc(p.title)}</a>
    <p>${esc(p.summary)}</p>
  </li>`,
    )
    .join("");

  await renderPage(layout, {
    path: "/blog/",
    title: "Blog - Luca Zani",
    description: "Posts about BananaWiki, the duck, and whatever else I'm building.",
    body: `
<h1>Blog</h1>
<p>Things I felt like writing down.</p>
<ol class="posts">${list}
</ol>`,
  });

  return posts.length;
}

const esbuildOptions = {
  entryPoints: { main: "src/main.ts", style: "src/style.css" },
  outdir: join(OUT, "assets"),
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: !DEV,
  sourcemap: DEV,
  jsx: "automatic",
  jsxImportSource: "preact",
  logLevel: "warning",
};

async function fullBuild() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await cp("public", OUT, { recursive: true });

  await esbuild.build(esbuildOptions);
  const hash = createHash("sha1");
  for (const f of ["main.js", "style.css"]) hash.update(await readFile(join(OUT, "assets", f)));
  assetVersion = hash.digest("hex").slice(0, 8);

  const n = await buildPages();
  console.log(`built ${n} posts and the pages into ${OUT}/`);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".map": "application/json",
};

// Behaves roughly like GitHub Pages: /foo serves foo/index.html, unknown paths get 404.html.
function serve() {
  createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const tries = [path, join(path, "index.html")];
    for (const t of tries) {
      try {
        const body = await readFile(join(OUT, t));
        res.writeHead(200, { "content-type": TYPES[extname(t)] ?? "application/octet-stream" });
        return res.end(body);
      } catch {}
    }
    res.writeHead(404, { "content-type": TYPES[".html"] });
    res.end(await readFile(join(OUT, "404.html")).catch(() => "404"));
  }).listen(PORT, () => console.log(`http://localhost:${PORT}`));
}

await fullBuild();

if (DEV) {
  const ctx = await esbuild.context(esbuildOptions);
  await ctx.watch();
  let timer;
  watch("site", { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => buildPages().catch((e) => console.error(e.message)), 80);
  });
  serve();
}
