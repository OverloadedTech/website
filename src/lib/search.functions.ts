import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type SearchHit = { title: string; url: string; snippet: string };

const decode = (s: string) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** DuckDuckGo's "lite" endpoint returns plain HTML and does not require JS. */
function parse(html: string): SearchHit[] {
  const hits: SearchHit[] = [];
  const linkRe =
    /<a[^>]*href=["']([^"']+)["'][^>]*class=["'](?:result-link|result__a)["'][^>]*>([\s\S]*?)<\/a>/g;
  const altRe =
    /<a[^>]*class=["'](?:result-link|result__a)["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/g;
  const snipRe = /class=["'](?:result-snippet|result__snippet)["'][^>]*>([\s\S]*?)<\/(?:td|a)>/g;
  const snippets: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = snipRe.exec(html))) snippets.push(decode(m[1]!));
  let i = 0;
  const links: RegExpExecArray[] = [];
  while ((m = linkRe.exec(html))) links.push(m);
  while ((m = altRe.exec(html))) links.push(m);
  for (m of links) {
    let href = m[1]!.replace(/&amp;/g, "&");
    const redirect = href.match(/[?&]uddg=([^&]+)/);
    if (redirect) href = decodeURIComponent(redirect[1]!);
    if (href.startsWith("//")) href = `https:${href}`;
    const title = decode(m[2]!);
    if (!title || !/^https?:/.test(href)) {
      i++;
      continue;
    }
    hits.push({ title, url: href, snippet: snippets[i] ?? "" });
    i++;
  }
  return hits.slice(0, 20);
}

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const ENDPOINTS = [
  (q: string) => `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(q)}`,
  (q: string) => `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
];

export const webSearch = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ q: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }): Promise<{ hits: SearchHit[]; error?: string | undefined }> => {
    let last = "search failed";
    for (const build of ENDPOINTS) {
      try {
        const res = await fetch(build(data.q), {
          headers: { "user-agent": UA, accept: "text/html", "accept-language": "en-US,en;q=0.9" },
        });
        if (!res.ok) {
          last = `upstream returned ${res.status}`;
          continue;
        }
        const hits = parse(await res.text());
        if (hits.length) return { hits };
        last = "no results";
      } catch (e) {
        last = e instanceof Error ? e.message : "search failed";
      }
    }
    return { hits: [], error: last };
  });
