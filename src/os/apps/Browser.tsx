import { useEffect, useState } from "preact/hooks";
import { updateWindow, type Win } from "../state";
import { embed } from "./small";

type Tab = { id: number; urls: string[]; at: number; reloads: number };

const BLANK = "about:blank";
// searches aren't real urls, they're rendered by the browser itself
const SEARCH = "search:";

const BOOKMARKS: [string, string][] = [
  ["home", "/"],
  ["blog", "/blog/"],
  ["projects", "/projects/"],
  ["likes", "/likes/"],
  ["contact", "/contact/"],
  ["wikipedia", "https://en.m.wikipedia.org/"],
  ["bananawiki", "https://bananawiki.com/"],
];

const internal = (u: string) => u.startsWith("/");

function tabName(u: string) {
  if (u === BLANK) return "new tab";
  if (u.startsWith(SEARCH)) return "search: " + u.slice(SEARCH.length);
  if (internal(u)) return u === "/" ? "lucazani.com" : u.replace(/^\/|\/$/g, "");
  return u.replace(/^https?:\/\//, "").split("/")[0];
}

// "bananawiki.com" is an address, "how do ducks sleep" is a search
function normalise(input: string) {
  const s = input.trim();
  if (!s || s === BLANK || internal(s) || s.startsWith(SEARCH)) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (!/\s/.test(s) && /^[\w-]+(\.[\w-]+)+([/:?#]|$)/.test(s)) return "https://" + s;
  return SEARCH + s;
}

let tabIds = 0;
const newTab = (url = BLANK): Tab => ({ id: ++tabIds, urls: [url], at: 0, reloads: 0 });

export function Browser({ win }: { win: Win }) {
  const [tabs, setTabs] = useState(() => [newTab(win.url)]);
  const [active, setActive] = useState(0);
  const [dragged, setDragged] = useState<number | null>(null);
  const tab = tabs[Math.min(active, tabs.length - 1)];
  const url = tab.urls[tab.at];
  const [address, setAddress] = useState(url);

  useEffect(() => {
    setAddress(url === BLANK ? "" : url);
    updateWindow(win.id, { url, title: `browser - ${tabName(url)}` });
  }, [url, tab.id]);

  const change = (fn: (t: Tab) => Tab) =>
    setTabs((ts) => ts.map((t, i) => (i === active ? fn(t) : t)));

  const visit = (input: string) => {
    const next = normalise(input);
    if (next) change((t) => ({ ...t, urls: [...t.urls.slice(0, t.at + 1), next], at: t.at + 1 }));
  };

  const close = (i: number) => {
    if (tabs.length === 1) {
      setTabs([newTab()]);
      setActive(0);
      return;
    }
    setTabs((ts) => ts.filter((_, k) => k !== i));
    setActive((a) => (i < a ? a - 1 : Math.min(a, tabs.length - 2)));
  };

  const drop = (to: number) => {
    if (dragged === null || dragged === to) return;
    setTabs((ts) => {
      const next = [...ts];
      next.splice(to, 0, ...next.splice(dragged, 1));
      return next;
    });
    if (active === dragged) setActive(to);
    setDragged(null);
  };

  const key = `${tab.id}:${tab.at}:${tab.reloads}`;

  return (
    <div class="browser">
      <div class="tabs">
        {tabs.map((t, i) => (
          <div
            key={t.id}
            class={i === active ? "tab on" : "tab"}
            draggable
            title="drag to reorder, middle click to close"
            onDragStart={() => setDragged(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(i)}
            onDragEnd={() => setDragged(null)}
            onMouseDown={(e) => (e.button === 1 ? (e.preventDefault(), close(i)) : setActive(i))}
          >
            <span>{tabName(t.urls[t.at])}</span>
            <button aria-label="close tab" onClick={(e) => (e.stopPropagation(), close(i))}>
              x
            </button>
          </div>
        ))}
        <button
          class="plus"
          aria-label="new tab"
          onClick={() => (setTabs([...tabs, newTab()]), setActive(tabs.length))}
        >
          +
        </button>
      </div>

      <div class="toolbar">
        <button
          class="btn"
          aria-label="back"
          disabled={tab.at === 0}
          onClick={() => change((t) => ({ ...t, at: t.at - 1 }))}
        >
          &lt;
        </button>
        <button
          class="btn"
          aria-label="forward"
          disabled={tab.at === tab.urls.length - 1}
          onClick={() => change((t) => ({ ...t, at: t.at + 1 }))}
        >
          &gt;
        </button>
        <button
          class="btn"
          aria-label="reload"
          onClick={() => change((t) => ({ ...t, reloads: t.reloads + 1 }))}
        >
          r
        </button>
        <button class="btn" onClick={() => visit("/")}>
          home
        </button>
        <input
          value={address}
          placeholder="search, /blog, or https://..."
          spellcheck={false}
          aria-label="address"
          onInput={(e) => setAddress(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && visit(address)}
        />
        {/^https?:/.test(url) && (
          <a
            class="btn"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="open outside the frame"
          >
            ↗
          </a>
        )}
      </div>

      <div class="bookmarks">
        {BOOKMARKS.map(([label, href]) => (
          <button key={href} onClick={() => visit(href)}>
            {label}
          </button>
        ))}
      </div>

      {url === BLANK ? (
        <Start onSearch={(q) => visit(SEARCH + q)} />
      ) : url.startsWith(SEARCH) ? (
        <Results key={key} query={url.slice(SEARCH.length)} onOpen={visit} />
      ) : internal(url) ? (
        <iframe key={key} title="browser" class="fill" src={embed(url)} />
      ) : (
        // sites that refuse framing just stay blank
        <iframe
          key={key}
          title="browser"
          class="fill"
          src={url}
          referrerpolicy="no-referrer"
          sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        />
      )}
    </div>
  );
}

function Start({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState("");
  return (
    <div class="start-page">
      <h2>duck search</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) onSearch(q.trim());
        }}
      >
        <input
          autoFocus
          value={q}
          onInput={(e) => setQ(e.currentTarget.value)}
          placeholder="search wikipedia"
          aria-label="search"
        />
        <button class="btn">search</button>
      </form>
    </div>
  );
}

type Hit = { title: string; snippet: string };

// search engines refuse framing and there's no server, wikipedia's api allows cors
function Results({ query, onOpen }: { query: string; onOpen: (u: string) => void }) {
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    const api =
      "https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=20&srsearch=" +
      encodeURIComponent(query);
    fetch(api)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`wikipedia said ${r.status}`))))
      .then((data) => {
        if (!live) return;
        setHits(data.query?.search ?? []);
      })
      .catch((e: Error) => {
        if (!live) return;
        setError(e.message || "search failed");
        setHits([]);
      });
    return () => {
      live = false;
    };
  }, [query]);

  const strip = (html: string) =>
    new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
  const ddg = "https://duckduckgo.com/?q=" + encodeURIComponent(query);

  return (
    <div class="results">
      <p>
        <strong>{query}</strong>{" "}
        <span class="small">
          {hits === null
            ? "searching..."
            : error
              ? "search failed"
              : `${hits.length} results from wikipedia`}
        </span>
      </p>
      {hits === null ? null : hits.length === 0 ? (
        <p class="small">{error || "nothing found."}</p>
      ) : (
        <ol>
          {hits.map((h) => (
            <li key={h.title}>
              <button
                onClick={() =>
                  onOpen(
                    `https://en.m.wikipedia.org/wiki/${encodeURIComponent(h.title.replace(/ /g, "_"))}`,
                  )
                }
              >
                {h.title}
              </button>
              <p>{strip(h.snippet)}...</p>
            </li>
          ))}
        </ol>
      )}
      <p class="small">
        <a href={ddg} target="_blank" rel="noopener noreferrer">
          try this search on duckduckgo.com
        </a>
      </p>
    </div>
  );
}
