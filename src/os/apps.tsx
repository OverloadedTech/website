import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { webSearch, type SearchHit } from "@/lib/search.functions";
import { SERVICES, closeWindow, getState, setState, updateWindow, useOs, type WinState } from "./store";

/* ---------------- doom ---------------- */

export function DoomApp() {
  const [go, setGo] = useState(false);
  const frame = useRef<HTMLIFrameElement | null>(null);

  const capture = () => {
    const el = frame.current;
    if (!el) return;
    el.focus();
    el.contentWindow?.focus();
  };

  if (!go)
    return (
      <div className="app-pad">
        <p>DOOM (shareware, 1993). Runs in a DOS emulator inside this window.</p>
        <p className="small">arrows move · ctrl fire · space use · esc menu</p>
        <button className="mini-btn" onClick={() => setGo(true)}>
          start doom
        </button>
      </div>
    );

  return (
    <iframe
      ref={frame}
      title="doom"
      src="https://archive.org/embed/DoomsharewareEpisode"
      allow="autoplay; fullscreen; gamepad; keyboard-map; pointer-lock"
      tabIndex={0}
      onLoad={capture}
      onPointerEnter={capture}
      onPointerDown={capture}
      style={{ display: "block", width: "100%", height: "100%", border: 0, background: "#000" }}
    />
  );
}

/* ---------------- manual ---------------- */

const MANUAL: { title: string; body: string[] }[] = [
  {
    title: "what this is",
    body: [
      "lucazani.com is a normal personal site with a second layer hidden behind it: a small desktop environment that runs entirely in your browser. Nothing is installed, nothing leaves your machine.",
      "The site itself is served by a fictional unit called lucazani.service. While that unit is active you see the site. Stop it and the desktop underneath becomes visible.",
    ],
  },
  {
    title: "getting in and out",
    body: [
      "The duck in the footer is the escape hatch: it opens a terminal over the site.",
      "In the terminal, `systemctl stop lucazani.service` drops you to the desktop. `systemctl start lucazani.service` puts the site back and stashes your open windows behind it - they return the next time you stop the unit.",
      "`logout` ends the guest session and erases everything that was saved.",
    ],
  },
  {
    title: "the desktop",
    body: [
      "Double click an icon to open an app. Drag icons to rearrange them; positions are remembered.",
      "The taskbar at the bottom toggles windows; middle click a task to close it.",
      "The menu at the top left lists every app plus any files you saved in mousepad.",
    ],
  },
  {
    title: "windows",
    body: [
      "Drag the title bar to move, drag an edge or corner to resize.",
      "Double click the title bar to maximize or restore.",
      "Drag a window to a screen edge to snap it: top edge maximizes, just below it snaps to the top half, sides give you halves, corners give you quarters. Drag a snapped window away to tear it off again.",
      "Ten windows is the limit. Ask for an eleventh and the machine will say something about it.",
    ],
  },
  {
    title: "apps",
    body: [
      "terminal - the whole machine is driven from here. Type `help`.",
      "Kiosk - lucazani.com in a window. The ⛶ button next to minimize reloads the whole browser into kiosk mode. The escape hatch does not nest: try it in there and a duck flies over to say so.",
      "browser - tabbed, with history and an address bar. Some sites refuse to be framed; that is them, not this.",
      "mousepad - a text editor. Saved files appear on the desktop.",
      "paint - open it from the desktop or the start menu. Canvas with pencil, brush, eraser, shapes, fill, spray, text and an eyedropper. Import by file, drag-and-drop or paste; export PNG or JPG; `set as desktop` hangs your drawing on the wall until the page reloads.",
      "geometry.gl - spin, colour and deform solids. Drag to rotate, scroll to zoom, double click to reset.",
      "doom - shareware DOOM in a DOS emulator. Click it and play.",
      "task manager - running units and windows, killable.",
    ],
  },
  {
    title: "themes",
    body: [
      "`theme <name>` switches between default, green, red, cyan, light and aero.",
      "`theme custom bg=#111 fg=#ccc accent=#e8c87a panel=#181818` sets any subset of colours; flags like `--bg #111` work too.",
    ],
  },
  {
    title: "how not to go crazy",
    body: [
      "Nothing here can break your computer, and nothing here is a real system. Crashes, blue screens and angry ducks are part of the furniture.",
      "If a state gets stuck, `logout` in the terminal resets everything to a clean guest session.",
    ],
  },
];

export function ManualApp() {
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const matches = q
    ? MANUAL.map((_s, i) => i).filter((i) => {
        const sec = MANUAL[i]!;
        return (
          sec.title.toLowerCase().includes(q) ||
          sec.body.some((l) => l.toLowerCase().includes(q))
        );
      })
    : MANUAL.map((_, i) => i);

  const current = MANUAL[matches.includes(active) ? active : (matches[0] ?? 0)] ?? MANUAL[0]!;
  const currentIndex = MANUAL.indexOf(current);

  return (
    <div className="manual">
      <aside className="manual-nav">
        <input
          className="manual-search"
          value={query}
          spellCheck={false}
          placeholder="search"
          onChange={(e) => setQuery(e.target.value)}
          aria-label="search the manual"
        />
        <div className="manual-nav-label">chapters</div>
        <ul>
          {MANUAL.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                className={i === currentIndex ? "is-active" : ""}
                disabled={!matches.includes(i)}
                onClick={() => setActive(i)}
              >
                <span className="manual-nav-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="manual-body">
        <div className="manual-crumb">
          manual / {String(currentIndex + 1).padStart(2, "0")} {current.title}
        </div>
        <h2 className="manual-title">{current.title}</h2>
        {current.body.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <div className="manual-pager">
          <button
            type="button"
            className="mini-btn"
            disabled={currentIndex === 0}
            onClick={() => setActive(currentIndex - 1)}
          >
            prev
          </button>
          <span className="manual-count">
            {currentIndex + 1} / {MANUAL.length}
          </span>
          <button
            type="button"
            className="mini-btn"
            disabled={currentIndex === MANUAL.length - 1}
            onClick={() => setActive(currentIndex + 1)}
          >
            next
          </button>
        </div>
      </div>
    </div>
  );
}



/* ---------------- browser ---------------- */

const isInternal = (u: string) => u.startsWith("/");

/** Internal pages framed by the OS get a marker so they don't re-render the OS inside themselves. */
export const embedSrc = (u: string) => (u.includes("?") ? `${u}&embed=1` : `${u}?embed=1`);

type Tab = {
  id: string;
  hist: string[];
  pos: number;
  nonce: number;
};

const QUICK: { label: string; url: string }[] = [
  { label: "home", url: "/" },
  { label: "blog", url: "/blog" },
  { label: "projects", url: "/projects" },
  { label: "likes", url: "/likes" },
  { label: "contact", url: "/contact" },
  { label: "wikipedia", url: "https://en.m.wikipedia.org/" },
  { label: "bananawiki", url: "https://bananawiki.com/" },
];

/** Search runs through this machine, not through a frame: every engine refuses to be embedded. */
const SEARCH_SCHEME = "search:";
const SEARCH = (q: string) => `${SEARCH_SCHEME}${q}`;
const isSearch = (u: string) => u.startsWith(SEARCH_SCHEME);

const looksLikeUrl = (s: string) =>
  /^https?:\/\//i.test(s) || (!/\s/.test(s) && /^[\w-]+(\.[\w-]+)+(\/|$|[:?#])/.test(s));

const NEW_TAB = "about:blank";

const label = (u: string) =>
  u === NEW_TAB
    ? "new tab"
    : isSearch(u)
      ? `search: ${u.slice(SEARCH_SCHEME.length)}`
      : isInternal(u) ? (u === "/" ? "lucazani.com" : u.slice(1)) : u.replace(/^https?:\/\//, "").split("/")[0]!;

let tabSeq = 0;
const mkTab = (url: string): Tab => ({ id: `t${++tabSeq}`, hist: [url], pos: 0, nonce: 0 });

export function BrowserApp({ win }: { win: WinState }) {
  const [tabs, setTabs] = useState<Tab[]>(() => [mkTab(win.url ?? NEW_TAB)]);
  const [active, setActive] = useState(0);
  const tab = tabs[Math.min(active, tabs.length - 1)]!;
  const url = tab.hist[tab.pos]!;
  const [draft, setDraft] = useState(url);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  useEffect(() => setDraft(url === NEW_TAB ? "" : url), [url, tab.id]);

  useEffect(() => {
    updateWindow(win.id, { url, title: `browser - ${label(url)}` });
  }, [url, win.id]);

  const patch = (fn: (t: Tab) => Tab) =>
    setTabs((ts) => ts.map((t, i) => (i === active ? fn(t) : t)));

  const go = (raw: string) => {
    let u = raw.trim();
    if (!u) return;
    if (!isInternal(u) && u !== NEW_TAB && !isSearch(u)) {
      if (!looksLikeUrl(u)) u = SEARCH(u);
      else if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    }
    patch((t) => ({ ...t, hist: [...t.hist.slice(0, t.pos + 1), u], pos: t.pos + 1 }));
  };

  const back = () => patch((t) => ({ ...t, pos: Math.max(0, t.pos - 1) }));
  const fwd = () => patch((t) => ({ ...t, pos: Math.min(t.hist.length - 1, t.pos + 1) }));
  const reload = () => patch((t) => ({ ...t, nonce: t.nonce + 1 }));

  const newTab = () => {
    setTabs((ts) => [...ts, mkTab(NEW_TAB)]);
    setActive(tabs.length);
  };
  const closeTab = (i: number) => {
    if (tabs.length === 1) {
      setTabs([mkTab(NEW_TAB)]);
      setActive(0);
      return;
    }
    setTabs((ts) => ts.filter((_, k) => k !== i));
    setActive((a) => (i < a ? a - 1 : Math.min(a, tabs.length - 2)));
  };

  const moveTab = (from: number, to: number) => {
    if (from === to || to < 0 || to >= tabs.length) return;
    setTabs((ts) => {
      const next = [...ts];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m!);
      return next;
    });
    setActive((a) => (a === from ? to : a));
    setDrag(null);
    setOver(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div className="browser-tabs">
        {tabs.map((t, i) => (
          <div
            key={t.id}
            draggable
            className={`browser-tab${i === active ? " is-active" : ""}${over === i && drag !== null && drag !== i ? " is-drop" : ""}`}
            onDragStart={(e) => {
              setDrag(i);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(i);
            }}
            onDragLeave={() => setOver((o) => (o === i ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              if (drag !== null) moveTab(drag, i);
            }}
            onDragEnd={() => {
              setDrag(null);
              setOver(null);
            }}
            onMouseDown={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                closeTab(i);
              } else setActive(i);
            }}
            title="drag to reorder, middle click to close"
          >
            <span>{label(t.hist[t.pos]!)}</span>
            <button
              aria-label="close tab"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(i);
              }}
            >
              x
            </button>
          </div>
        ))}
        <button className="browser-newtab" onClick={newTab} aria-label="new tab">
          +
        </button>
      </div>


      <div className="browser-toolbar">
        <button className="mini-btn" onClick={back} disabled={tab.pos === 0} aria-label="back">
          {"<"}
        </button>
        <button
          className="mini-btn"
          onClick={fwd}
          disabled={tab.pos >= tab.hist.length - 1}
          aria-label="forward"
        >
          {">"}
        </button>
        <button className="mini-btn" onClick={reload} aria-label="reload">
          r
        </button>
        <button className="mini-btn" onClick={() => go("/")} aria-label="home">
          home
        </button>
        <input
          value={draft}
          spellCheck={false}
          placeholder="search, /blog, or https://..."
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go(draft)}
          aria-label="address"
        />
        {!isInternal(url) && url !== NEW_TAB && !isSearch(url) ? (
          <a
            className="mini-btn"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="open this page outside the frame"
          >
            {"\u2197"}
          </a>
        ) : null}
      </div>

      <div className="browser-bookmarks">
        {QUICK.map((q) => (
          <button key={q.url} onClick={() => go(q.url)}>
            {q.label}
          </button>
        ))}
      </div>

      {url === NEW_TAB ? (
        <SearchHome onSearch={(q) => go(SEARCH(q))} onOpen={go} />
      ) : isSearch(url) ? (
        <SearchResults
          key={`${tab.id}:${tab.pos}:${tab.nonce}`}
          query={url.slice(SEARCH_SCHEME.length)}
          onOpen={go}
        />
      ) : isInternal(url) ? (
        <iframe
          key={`${tab.id}:${tab.pos}:${tab.nonce}`}
          title="browser"
          src={embedSrc(url)}
          style={{ flex: 1, width: "100%", border: 0, background: "var(--bg)" }}
        />
      ) : (
        <ExternalFrame key={`${tab.id}:${tab.pos}:${tab.nonce}`} url={url} />
      )}
    </div>
  );
}

/** External sites render for real. Nothing pretends otherwise: if a host refuses to be
 *  framed the frame simply stays empty, and the toolbar link opens it properly. */
function ExternalFrame({ url }: { url: string }) {
  return (
    <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex" }}>
      <iframe
        title="browser"
        src={url}
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        style={{ flex: 1, width: "100%", border: 0, background: "var(--bg)" }}
      />
    </div>
  );
}

/* ---------------- search home: the default page of this browser ---------------- */

function SearchHome({
  onSearch,
  onOpen,
}: {
  onSearch: (q: string) => void;
  onOpen: (u: string) => void;
}) {
  const [q, setQ] = useState("");
  return (
    <div className="search-home">
      <div className="search-home-mark">duck search</div>
      <form
        className="search-home-form"
        onSubmit={(e) => {
          e.preventDefault();
          const v = q.trim();
          if (v) onSearch(v);
        }}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search the web"
          aria-label="search the web"
        />
        <button type="submit" className="mini-btn">
          search
        </button>
      </form>
      <div className="browser-dial">
        {QUICK.map((item) => (
          <button key={item.url} onClick={() => onOpen(item.url)}>
            {item.label}
            <span>{item.url}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- search results, rendered by this machine ---------------- */

function SearchResults({ query, onOpen }: { query: string; onOpen: (u: string) => void }) {
  const search = useServerFn(webSearch);
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ms, setMs] = useState(0);

  useEffect(() => {
    let alive = true;
    const t0 = performance.now();
    setHits(null);
    setError(null);
    search({ data: { q: query } })
      .then((r) => {
        if (!alive) return;
        setMs(Math.round(performance.now() - t0));
        setHits(r.hits);
        setError(r.error ?? null);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "search failed");
        setHits([]);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="search-page">
      <div className="search-head">
        <strong>{query}</strong>
        <span className="small">
          {hits === null ? "searching..." : `${hits.length} results in ${ms} ms`}
        </span>
      </div>
      {hits === null ? (
        <div className="search-skel">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="search-skel-row" style={{ animationDelay: `${i * 0.08}s` }}>
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : hits.length === 0 ? (
        <div className="search-empty">
          <p className="small">{error ?? "nothing found."}</p>
          <button
            className="search-hit-title"
            onClick={() =>
              window.open(
                `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            open this search on duckduckgo.com
          </button>
        </div>
      ) : (
        <ol className="search-hits">
          {hits.map((h) => (
            <li key={h.url}>
              <button className="search-hit-title" onClick={() => onOpen(h.url)}>
                {h.title}
              </button>
              <span className="search-hit-url">{h.url.replace(/^https?:\/\//, "").slice(0, 90)}</span>
              {h.snippet ? <p>{h.snippet}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}


/* ---------------- editor ---------------- */

export function EditorApp({ win }: { win: WinState }) {
  const files = useOs((s) => s.files);
  const [name, setName] = useState(win.file ?? "untitled.txt");
  const [text, setText] = useState(win.draft ?? (win.file ? (files[win.file] ?? "") : ""));
  const [saved, setSaved] = useState(false);

  const save = () => {
    const fn = name.trim() || "untitled.txt";
    setState((s) => ({ files: { ...s.files, [fn]: text } }));
    updateWindow(win.id, { file: fn, draft: text, title: `mousepad - ${fn}` });
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="editor-toolbar">
        <input
          value={name}
          spellCheck={false}
          onChange={(e) => setName(e.target.value)}
          aria-label="file name"
        />
        <button className="mini-btn" onClick={save}>
          {saved ? "saved" : "save"}
        </button>
      </div>
      <textarea
        className="editor-area"
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          updateWindow(win.id, { draft: e.target.value });
        }}
        aria-label="text"
      />
    </div>
  );
}

/* ---------------- task manager ---------------- */

export function TaskManagerApp() {
  const services = useOs((s) => s.services);
  const windows = useOs((s) => s.windows);

  return (
    <div className="app-pad taskmgr">
      <table>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>unit</th>
            <th style={{ textAlign: "left" }}>state</th>
          </tr>
        </thead>
        <tbody>
          {SERVICES.map((u) => (
            <tr key={u}>
              <td>{u}</td>
              <td>
                <span className={`dot ${services[u] === "active" ? "on" : "off"}`} />
                {services[u]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table style={{ marginTop: 14 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>process</th>
            <th style={{ textAlign: "left" }}>pid</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {windows.map((w) => (
            <tr key={w.id}>
              <td>{w.title}</td>
              <td>{1000 + w.id}</td>
              <td>
                <button className="mini-btn" onClick={() => closeWindow(w.id)}>
                  end task
                </button>
              </td>
            </tr>
          ))}
          {windows.length === 0 && (
            <tr>
              <td colSpan={3}>no user processes.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- kiosk-in-a-window ---------------- */

export function KioskApp({ win }: { win: WinState }) {
  return (
    <iframe
      title="Kiosk"
      src={embedSrc(win.url ?? "/")}
      style={{ width: "100%", height: "100%", border: 0, background: "var(--bg)" }}
    />
  );
}

/* ---------------- webgl geometry lab ---------------- */

type Face = number[][]; // triangles, each [x,y,z] * 3 flattened per vertex triple
type Shape = { label: string; verts: number[][]; faces: number[][] };

type ShapeKey = "cube" | "tetra" | "octa" | "pyramid" | "prism";

const SHAPES: Record<ShapeKey, Shape> = {
  cube: {
    label: "cube",
    verts: [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ],
    faces: [
      [4, 5, 6, 7], // front
      [1, 0, 3, 2], // back
      [5, 1, 2, 6], // right
      [0, 4, 7, 3], // left
      [3, 7, 6, 2], // top
      [0, 1, 5, 4], // bottom
    ],
  },
  tetra: {
    label: "tetrahedron",
    verts: [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]],
    faces: [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]],
  },
  octa: {
    label: "octahedron",
    verts: [[1.3, 0, 0], [-1.3, 0, 0], [0, 1.3, 0], [0, -1.3, 0], [0, 0, 1.3], [0, 0, -1.3]],
    faces: [
      [0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4],
      [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5],
    ],
  },
  pyramid: {
    label: "pyramid",
    verts: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [0, 1.2, 0]],
    faces: [[0, 1, 2, 3], [3, 2, 4], [2, 1, 4], [1, 0, 4], [0, 3, 4]],
  },
  prism: {
    label: "prism",
    verts: [
      [-1, -1, -1], [1, -1, -1], [0, 1, -1],
      [-1, -1, 1], [1, -1, 1], [0, 1, 1],
    ],
    faces: [[3, 4, 5], [2, 1, 0], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]],
  },
};

const PALETTE = ["#e8c87a", "#7ad0e8", "#e87a9c", "#9ce87a", "#b07ae8", "#e8a67a", "#7ae8c0", "#d8d8d8"];

function faceTriangles(shape: Shape): Face[] {
  return shape.faces.map((f) => {
    const tris: number[][] = [];
    for (let i = 1; i < f.length - 1; i++) tris.push([...shape.verts[f[0]!]!, ...shape.verts[f[i]!]!, ...shape.verts[f[i + 1]!]!]);
    return tris;
  });
}

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export function GeoApp() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [shapeKey, setShapeKey] = useState<ShapeKey>("cube");
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(true);
  const [bg, setBg] = useState("#080808");
  const [faceColors, setFaceColors] = useState<string[]>(
    SHAPES.cube.faces.map((_, i) => PALETTE[i % PALETTE.length]!),
  );
  const [perFace, setPerFace] = useState(true);

  const shape = SHAPES[shapeKey];

  const pickShape = (k: ShapeKey) => {
    setShapeKey(k);
    setFaceColors(
      SHAPES[k].faces.map((_, i) => (perFace ? PALETTE[i % PALETTE.length]! : (faceColors[0] ?? "#e8c87a"))),
    );
  };

  const setAll = (c: string) => setFaceColors(shape.faces.map(() => c));

  // live refs so the render loop never restarts
  const live = useRef({ speed, running, bg, faceColors, shapeKey });
  live.current = { speed, running, bg, faceColors, shapeKey };

  // pointer orbit + wheel zoom, kept in refs so the render loop never restarts
  const orbit = useRef({ yaw: 0.6, pitch: 0.35, zoom: 1, dragging: false });

  const onCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
    orbit.current.dragging = true;
    let px = e.clientX;
    let py = e.clientY;
    // sensitivity relative to canvas size: a full drag across is ~one turn
    const k = (2 * Math.PI) / Math.max(200, el.clientWidth);
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      orbit.current.yaw -= (ev.clientX - px) * k;
      // pitch is clamped so the object never flips upside down mid-drag
      orbit.current.pitch = Math.max(-1.45, Math.min(1.45, orbit.current.pitch - (ev.clientY - py) * k));
      px = ev.clientX;
      py = ev.clientY;
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      orbit.current.dragging = false;
      el.style.cursor = "grab";
      el.releasePointerCapture?.(e.pointerId);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  // wheel needs a non-passive native listener, React's onWheel cannot preventDefault
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      orbit.current.zoom = Math.max(0.3, Math.min(3, orbit.current.zoom * Math.exp(-dy * 0.0015)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vs = `attribute vec3 p; attribute vec3 c; uniform mat4 m; varying vec3 vc;
      void main(){ vc=c; gl_Position = m * vec4(p,1.0); }`;
    const fs = `precision mediump float; varying vec3 vc;
      void main(){ gl_FragColor = vec4(vc,1.0); }`;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const pBuf = gl.createBuffer();
    const cBuf = gl.createBuffer();
    const pLoc = gl.getAttribLocation(prog, "p");
    const cLoc = gl.getAttribLocation(prog, "c");
    gl.enableVertexAttribArray(pLoc);
    gl.enableVertexAttribArray(cLoc);
    const mLoc = gl.getUniformLocation(prog, "m");
    gl.enable(gl.DEPTH_TEST);

    let count = 0;
    let builtFor = "";
    const build = () => {
      const s = SHAPES[live.current.shapeKey];
      const tris = faceTriangles(s);
      const pos: number[] = [];
      const col: number[] = [];
      tris.forEach((face, fi) => {
        const [r, g, b] = hexToRgb(live.current.faceColors[fi] ?? "#e8c87a");
        face.forEach((t) => {
          pos.push(...t);
          for (let k = 0; k < 3; k++) {
            // cheap face shading so edges read
            const shade = 0.72 + 0.28 * ((fi % 4) / 3);
            col.push(r * shade, g * shade, b * shade);
          }
        });
      });
      count = pos.length / 3;
      gl.bindBuffer(gl.ARRAY_BUFFER, pBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, cBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(col), gl.STATIC_DRAW);
      builtFor = live.current.shapeKey + live.current.faceColors.join(",");
    };
    build();

    let raf = 0;
    let t = 0;
    let last = performance.now();
    const draw = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (live.current.running && !orbit.current.dragging) t += dt * live.current.speed;

      if (builtFor !== live.current.shapeKey + live.current.faceColors.join(",")) build();

      const w = canvas.clientWidth || 300;
      const h = canvas.clientHeight || 300;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      const [br, bgc, bb] = hexToRgb(live.current.bg);
      gl.clearColor(br, bgc, bb, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const a = t * 0.8 + orbit.current.yaw;
      const b = orbit.current.pitch;
      const ca = Math.cos(a),
        sa = Math.sin(a),
        cb = Math.cos(b),
        sb = Math.sin(b);
      const sc = 0.42 * orbit.current.zoom;
      const asp = h / w;
      const m = [
        ca * sc * asp, sa * sb * sc, -sa * cb * sc, 0,
        0, cb * sc, sb * sc, 0,
        sa * sc * asp, -ca * sb * sc, ca * cb * sc, 0,
        0, 0, 0, 1,
      ];
      gl.uniformMatrix4fv(mLoc, false, new Float32Array(m));
      gl.bindBuffer(gl.ARRAY_BUFFER, pBuf);
      gl.vertexAttribPointer(pLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, cBuf);
      gl.vertexAttribPointer(cLoc, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, count);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <canvas
        ref={ref}
        onPointerDown={onCanvasPointerDown}
        onDoubleClick={() => {
          orbit.current.yaw = 0.6;
          orbit.current.pitch = 0.35;
          orbit.current.zoom = 1;
        }}
        title="drag to rotate · wheel to zoom · double click to reset"
        style={{ flex: 1, width: "100%", display: "block", minHeight: 0, cursor: "grab", touchAction: "none" }}
      />
      <div className="geo-controls">
        <div className="geo-row">
          {Object.entries(SHAPES).map(([k, s]) => (
            <button
              key={k}
              className="mini-btn"
              data-active={k === shapeKey ? "" : undefined}
              onClick={() => pickShape(k as ShapeKey)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="geo-row">
          <button className="mini-btn" onClick={() => setRunning((r) => !r)}>
            {running ? "stop" : "resume"}
          </button>
          <label className="small">
            speed
            <input
              type="range"
              min={0}
              max={4}
              step={0.05}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <span className="geo-val">{speed.toFixed(2)}x</span>
          </label>
        </div>
        <div className="geo-row">
          <label className="small">
            background
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
          </label>
          <label className="small">
            object
            <input type="color" value={faceColors[0] ?? "#e8c87a"} onChange={(e) => setAll(e.target.value)} />
          </label>
          <button className="mini-btn" onClick={() => setPerFace((p) => !p)}>
            {perFace ? "hide faces" : "per-face colors"}
          </button>
        </div>
        {perFace && (
          <div className="geo-row geo-faces">
            {shape.faces.map((_, i) => (
              <label key={i} className="small">
                {i + 1}
                <input
                  type="color"
                  value={faceColors[i] ?? "#e8c87a"}
                  onChange={(e) =>
                    setFaceColors((fc) => {
                      const next = shape.faces.map((__, j) => fc[j] ?? "#e8c87a");
                      next[i] = e.target.value;
                      return next;
                    })
                  }
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function appNeedsKiosk() {
  return getState().services["lucazani.service"] === "active";
}
