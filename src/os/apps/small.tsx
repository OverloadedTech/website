import { useState } from "preact/hooks";
import { UNITS, closeWindow, get, set, updateWindow, useOs, type State, type Win } from "../state";

export const embed = (url: string) => url + (url.includes("?") ? "&" : "?") + "embed=1";

export function Kiosk({ win }: { win: Win }) {
  return <iframe title="Kiosk" class="fill" src={embed(win.url ?? "/")} />;
}

export function Doom() {
  const [on, setOn] = useState(false);
  if (!on) {
    return (
      <div class="pad">
        <p>DOOM (shareware, 1993). Runs in a DOS emulator inside this window.</p>
        <p class="small">arrows move · ctrl fire · space use · esc menu</p>
        <button class="btn" onClick={() => setOn(true)}>
          start doom
        </button>
      </div>
    );
  }
  // the emulator only gets keys while its frame has focus
  const focus = (e: Event) => (e.currentTarget as HTMLIFrameElement).contentWindow?.focus();
  return (
    <iframe
      title="doom"
      class="fill black"
      src="https://archive.org/embed/DoomsharewareEpisode"
      allow="autoplay; fullscreen; gamepad; keyboard-map; pointer-lock"
      onLoad={focus}
      onPointerEnter={focus}
    />
  );
}

export function Mousepad({ win }: { win: Win }) {
  const storage = useOs((s) => s.units["storage.service"]);
  const [name, setName] = useState(win.file ?? "untitled.txt");
  const [text, setText] = useState(() => (win.file ? (get().files[win.file] ?? "") : ""));
  const [note, setNote] = useState("");

  const save = () => {
    if (!storage) {
      setNote("storage.service is not running");
      return;
    }
    const file = name.trim() || "untitled.txt";
    set((s) => ({ files: { ...s.files, [file]: text } }));
    updateWindow(win.id, { file, title: `mousepad - ${file}` });
    setNote("saved");
    setTimeout(() => setNote(""), 1400);
  };

  return (
    <div class="mousepad">
      <div class="toolbar">
        <input
          value={name}
          onInput={(e) => setName(e.currentTarget.value)}
          spellcheck={false}
          aria-label="file name"
        />
        <button class="btn" onClick={save}>
          save
        </button>
        <span class="small">{note}</span>
      </div>
      <textarea
        value={text}
        onInput={(e) => setText(e.currentTarget.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault();
            save();
          }
        }}
        spellcheck={false}
        aria-label="text"
      />
    </div>
  );
}

export function TaskManager() {
  const units = useOs((s) => s.units);
  const wins = useOs((s) => s.wins);
  return (
    <div class="pad taskmgr">
      <table>
        <thead>
          <tr>
            <th>unit</th>
            <th>state</th>
          </tr>
        </thead>
        <tbody>
          {UNITS.map((u) => (
            <tr key={u}>
              <td>{u}</td>
              <td>
                <i class={units[u] ? "dot on" : "dot"} />
                {units[u] ? "active" : "inactive"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th>process</th>
            <th>pid</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {wins.map((w) => (
            <tr key={w.id}>
              <td>{w.title}</td>
              <td>{1000 + w.id}</td>
              <td>
                <button class="btn" onClick={() => closeWindow(w.id)}>
                  end task
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const LABELS: [keyof State["custom"], string][] = [
  ["bg", "background"],
  ["fg", "text"],
  ["accent", "accent"],
  ["panel", "windows"],
];

export function Colours() {
  const custom = useOs((s) => s.custom);
  return (
    <div class="pad colours">
      {LABELS.map(([key, label]) => (
        <label key={key}>
          <input
            type="color"
            value={custom[key]}
            onInput={(e) =>
              set((s) => ({
                theme: "custom",
                custom: { ...s.custom, [key]: e.currentTarget.value },
              }))
            }
          />
          {label} <code>{custom[key]}</code>
        </label>
      ))}
      <p class="small">or: theme custom bg=#111 fg=#ccc accent=#e8c87a panel=#181818</p>
    </div>
  );
}

const MANUAL: [string, string[]][] = [
  [
    "what this is",
    [
      "a normal personal site with a small desktop hiding behind it. it all runs in your browser, nothing gets installed or sent anywhere.",
      "the site is drawn by a made up unit called lucazani.service. stop it and you see what's underneath.",
    ],
  ],
  [
    "getting in and out",
    [
      "the duck in the top bar opens a terminal.",
      "`systemctl stop lucazani.service` gets you to the desktop, `systemctl start lucazani.service` brings the site back and hides your windows behind it until next time.",
      "`logout` or a reload wipes everything.",
    ],
  ],
  [
    "the desktop",
    [
      "double click an icon to open it. drag icons around, or drag on empty space to select a few.",
      "right click an icon or the desktop for more stuff.",
      "taskbar: click to hide/show a window, middle click to close it.",
      "the menu in the top left has every app and the files you saved.",
    ],
  ],
  [
    "windows",
    [
      "drag the title bar to move, edges and corners to resize, double click the title bar to maximize.",
      "drag a window against the edge of the screen to snap it. top edge is full screen, just below it is the top half, sides are halves, corners are quarters.",
      "10 windows max. try opening an 11th.",
    ],
  ],
  [
    "apps",
    [
      "terminal: everything is driven from here, type `help`.",
      "Kiosk: the site in a window. ⛶ puts it back full screen. the escape hatch doesn't work in there, a duck will tell you why.",
      "browser: tabs, history and an address bar. typing words searches wikipedia. some sites won't load in a frame, not my fault.",
      "mousepad: text editor. saved files show up on the desktop, as long as storage.service is running.",
      "paint: pencil, brush, eraser, shapes, fill, spray, text and a colour picker. import with the button, drag and drop or paste. `set as desktop` makes it the wallpaper until you reload.",
      "geometry.gl: drag to rotate, scroll to zoom, double click to reset.",
      "doom: shareware DOOM in a DOS emulator.",
      "task manager: units and open windows. you can kill the windows.",
    ],
  ],
  [
    "themes",
    [
      "`theme <name>` with default, green, red, cyan, light or aero.",
      "`theme custom` opens a colour picker. `theme custom bg=#111 fg=#ccc accent=#e8c87a panel=#181818` works too, so does `--bg #111`.",
    ],
  ],
  [
    "if something breaks",
    [
      "nothing here is a real system, it can't break your computer.",
      "stuck? `logout` in the terminal resets everything.",
    ],
  ],
];

const two = (n: number) => String(n + 1).padStart(2, "0");

export function Manual() {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const found = MANUAL.map((_, i) => i).filter(
    (i) => !q || MANUAL[i][0].includes(q) || MANUAL[i][1].some((p) => p.toLowerCase().includes(q)),
  );
  const at = found.includes(page) ? page : (found[0] ?? 0);
  const [title, body] = MANUAL[at];

  return (
    <div class="manual">
      <aside>
        <input
          value={query}
          onInput={(e) => setQuery(e.currentTarget.value)}
          placeholder="search"
          aria-label="search the manual"
        />
        <ul>
          {MANUAL.map(([t], i) => (
            <li key={t}>
              <button
                class={i === at ? "on" : ""}
                disabled={!found.includes(i)}
                onClick={() => setPage(i)}
              >
                <small>{two(i)}</small> {t}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div class="text">
        <p class="small">
          manual / {two(at)} {title}
        </p>
        <h2>{title}</h2>
        {body.map((p) => (
          <p key={p}>
            {p.split("`").map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))}
          </p>
        ))}
        <p class="pager">
          <button class="btn" disabled={at === 0} onClick={() => setPage(at - 1)}>
            prev
          </button>
          <span class="small">
            {at + 1} / {MANUAL.length}
          </span>
          <button class="btn" disabled={at === MANUAL.length - 1} onClick={() => setPage(at + 1)}>
            next
          </button>
        </p>
      </div>
    </div>
  );
}
