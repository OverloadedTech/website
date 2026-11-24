import { useEffect, useRef, useState } from "preact/hooks";
import { DUCK } from "./duck";
import { Icon } from "./icons";
import {
  closeWindow,
  focusWindow,
  get,
  openWindow,
  set,
  updateWindow,
  useOs,
  type App,
} from "./state";

type Item = { key: string; label: string; icon: string; app: App; url?: string };

const APPS: Item[] = [
  { key: "terminal", label: "terminal", icon: "terminal", app: "terminal" },
  { key: "kiosk", label: "Kiosk", icon: "kiosk", app: "kiosk", url: "/" },
  { key: "browser", label: "browser", icon: "browser", app: "browser" },
  { key: "mousepad", label: "mousepad", icon: "mousepad", app: "mousepad" },
  { key: "doom", label: "doom", icon: "doom", app: "doom" },
  { key: "taskmgr", label: "task manager", icon: "taskmgr", app: "taskmgr" },
  { key: "paint", label: "paint", icon: "paint", app: "paint" },
  { key: "geometry", label: "geometry.gl", icon: "geometry", app: "geometry" },
  { key: "manual", label: "manual", icon: "manual", app: "manual" },
];

const COL = 100;
const ROW = 96;
const PER_COL = 6;

const fileItem = (name: string): Item => ({
  key: "file:" + name,
  label: name,
  icon: "file",
  app: "mousepad",
});

function launch(item: Item) {
  if (item.icon === "file")
    openWindow("mousepad", { file: item.label, title: `mousepad - ${item.label}` });
  else openWindow(item.app, item.url ? { url: item.url } : {});
}

function newFile() {
  const files = get().files;
  let name = "untitled.txt";
  for (let n = 2; name in files; n++) name = `untitled-${n}.txt`;
  set((s) => ({ files: { ...s.files, [name]: "" } }));
  openWindow("mousepad", { file: name, title: `mousepad - ${name}` });
}

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(t);
  }, []);
  return (
    <span class="clock">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
  );
}

type Menu = { x: number; y: number; item: Item | null };

export function Desktop() {
  const icons = useOs((s) => s.icons);
  const files = useOs((s) => s.files);
  const wins = useOs((s) => s.wins);
  const wallpaper = useOs((s) => s.wallpaper);
  const [start, setStart] = useState(false);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [props, setProps] = useState<Item | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [band, setBand] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [drag, setDrag] = useState<{ keys: string[]; dx: number; dy: number } | null>(null);
  const area = useRef<HTMLDivElement>(null);

  const items = [...APPS, ...Object.keys(files).map(fileItem)];
  const spot = (key: string) => {
    const i = items.findIndex((it) => it.key === key);
    return icons[key] ?? { col: Math.floor(i / PER_COL), row: i % PER_COL };
  };

  const onAreaDown = (e: PointerEvent) => {
    if (e.button !== 0 || (e.target as Element).closest(".dicon") || !area.current) return;
    const rect = area.current.getBoundingClientRect();
    const keep = e.shiftKey || e.ctrlKey || e.metaKey ? selected : [];
    setSelected(keep);
    const sx = e.clientX;
    const sy = e.clientY;

    const move = (ev: PointerEvent) => {
      if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 4) return;
      const l = Math.min(sx, ev.clientX);
      const t = Math.min(sy, ev.clientY);
      const r = Math.max(sx, ev.clientX);
      const b = Math.max(sy, ev.clientY);
      setBand({ x: l - rect.left, y: t - rect.top, w: r - l, h: b - t });
      const hit: string[] = [];
      area.current!.querySelectorAll<HTMLElement>(".dicon").forEach((el) => {
        const box = el.getBoundingClientRect();
        if (box.right > l && box.left < r && box.bottom > t && box.top < b)
          hit.push(el.dataset.key!);
      });
      setSelected([...new Set([...keep, ...hit])]);
    };
    const up = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
      setBand(null);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
  };

  // drags the whole selection
  const onIconDown = (key: string) => (e: PointerEvent) => {
    if (e.button !== 0) return;
    const add = e.shiftKey || e.ctrlKey || e.metaKey;
    let group = selected.includes(key) ? selected : [key];
    if (add)
      group = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
    setSelected(group);
    if (!group.includes(key)) return;

    const sx = e.clientX;
    const sy = e.clientY;
    let dx = 0;
    let dy = 0;
    let moved = false;
    const move = (ev: PointerEvent) => {
      dx = ev.clientX - sx;
      dy = ev.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) <= 6) return;
      moved = true;
      setDrag({ keys: group, dx, dy });
    };
    const up = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
      setDrag(null);
      const dc = Math.round(dx / COL);
      const dr = Math.round(dy / ROW);
      if (!moved || (!dc && !dr)) return;
      set((s) => {
        const next = { ...s.icons };
        for (const k of group) {
          const p = spot(k);
          next[k] = { col: Math.max(0, p.col + dc), row: Math.max(0, p.row + dr) };
        }
        return { icons: next };
      });
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
  };

  const openMenu = (item: Item | null) => (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item && !selected.includes(item.key)) setSelected([item.key]);
    if (!item) setSelected([]);
    setStart(false);
    setMenu({ x: e.clientX, y: e.clientY, item });
  };

  const act = (fn: () => void) => () => {
    fn();
    setMenu(null);
  };

  const forget = (key: string) =>
    set((s) => {
      const icons = { ...s.icons };
      delete icons[key];
      return { icons };
    });

  const remove = (item: Item) =>
    set((s) => {
      const files = { ...s.files };
      const icons = { ...s.icons };
      delete files[item.label];
      delete icons[item.key];
      return { files, icons };
    });

  return (
    <>
      <div
        class={wallpaper ? "desktop papered" : "desktop"}
        style={wallpaper ? { backgroundImage: `url(${wallpaper})` } : undefined}
      >
        <div class="icons" ref={area} onPointerDown={onAreaDown} onContextMenu={openMenu(null)}>
          {band && (
            <div
              class="band"
              style={{ left: band.x, top: band.y, width: band.w, height: band.h }}
            />
          )}
          {drag?.keys.map((k) => {
            const p = spot(k);
            const col = Math.max(0, p.col + Math.round(drag.dx / COL));
            const row = Math.max(0, p.row + Math.round(drag.dy / ROW));
            return (
              <div
                key={"ghost" + k}
                class="ghost"
                style={{ left: col * COL + 12, top: row * ROW + 10 }}
              />
            );
          })}
          {items.map((it) => {
            const p = spot(it.key);
            const moving = drag?.keys.includes(it.key);
            return (
              <button
                key={it.key}
                data-key={it.key}
                class={`dicon${selected.includes(it.key) ? " selected" : ""}${moving ? " moving" : ""}`}
                style={{
                  left: p.col * COL + 12,
                  top: p.row * ROW + 10,
                  transform: moving ? `translate(${drag!.dx}px, ${drag!.dy}px)` : undefined,
                }}
                onPointerDown={onIconDown(it.key)}
                onDblClick={() => launch(it)}
                onContextMenu={openMenu(it)}
              >
                <Icon name={it.icon} />
                <span>{it.label}</span>
              </button>
            );
          })}
          <pre class="desk-duck">{DUCK}</pre>
        </div>
      </div>

      <div class="topbar">
        <button
          class={start ? "start open" : "start"}
          onClick={() => setStart(!start)}
          aria-expanded={start}
        >
          menu
        </button>
        <Clock />
      </div>
      {start && (
        <>
          <div class="scrim" onClick={() => setStart(false)} />
          <div class="startmenu">
            {items.map((it) => (
              <button key={it.key} onClick={() => (setStart(false), launch(it))}>
                <Icon name={it.icon} />
                {it.label}
              </button>
            ))}
          </div>
        </>
      )}

      {menu && (
        <>
          <div
            class="scrim"
            onClick={() => setMenu(null)}
            onContextMenu={(e) => (e.preventDefault(), setMenu(null))}
          />
          <div
            class="ctx"
            style={{
              left: Math.min(menu.x, innerWidth - 190),
              top: Math.min(menu.y, innerHeight - 220),
            }}
          >
            {menu.item ? (
              <>
                <span class="label">{menu.item.label}</span>
                <button onClick={act(() => launch(menu.item!))}>open</button>
                {menu.item.icon === "file" ? (
                  <button onClick={act(() => remove(menu.item!))}>delete</button>
                ) : (
                  <button onClick={act(() => launch(menu.item!))}>open new instance</button>
                )}
                <button onClick={act(() => forget(menu.item!.key))}>reset position</button>
                <hr />
                <button onClick={act(() => setProps(menu.item))}>properties</button>
              </>
            ) : (
              <>
                <span class="label">desktop</span>
                <button onClick={act(newFile)}>new text file</button>
                <button onClick={act(() => openWindow("terminal"))}>open terminal</button>
                <button onClick={act(() => set({ icons: {} }))}>tidy icons</button>
                <hr />
                <button onClick={act(() => set({ wallpaper: null }))}>clear wallpaper</button>
                <button onClick={act(() => openWindow("taskmgr"))}>task manager</button>
              </>
            )}
          </div>
        </>
      )}

      {props && <Properties item={props} where={icons[props.key]} onClose={() => setProps(null)} />}

      <div class="taskbar">
        {wins.length === 0 && <span class="hint">double click an icon.</span>}
        {wins.map((w) => (
          <button
            key={w.id}
            class={w.min ? "" : "on"}
            title="click to toggle, middle click to close"
            onClick={() => (w.min ? focusWindow(w.id) : updateWindow(w.id, { min: true }))}
            onAuxClick={(e) => e.button === 1 && closeWindow(w.id)}
          >
            {w.title}
          </button>
        ))}
      </div>
    </>
  );
}

function Properties({
  item,
  where,
  onClose,
}: {
  item: Item;
  where?: { col: number; row: number };
  onClose: () => void;
}) {
  const text = get().files[item.label] ?? "";
  const position = where ? `col ${where.col}, row ${where.row}` : "auto";
  const rows: [string, string][] =
    item.icon === "file"
      ? [
          ["name", item.label],
          ["type", "text/plain"],
          ["size", `${new Blob([text]).size} bytes`],
          ["lines", String(text.split("\n").length)],
          ["opens with", "mousepad"],
          ["position", position],
        ]
      : [
          ["name", item.label],
          ["type", "application"],
          ["unit", `${item.app}.app`],
          ["exec", `/usr/bin/${item.app}`],
          ["position", position],
        ];

  const [pos, setPos] = useState({ x: innerWidth / 2 - 190, y: innerHeight / 2 - 160 });
  const grab = (e: PointerEvent) => {
    if ((e.target as Element).closest("button")) return;
    const ox = e.clientX - pos.x;
    const oy = e.clientY - pos.y;
    const move = (ev: PointerEvent) =>
      setPos({ x: ev.clientX - ox, y: Math.max(0, ev.clientY - oy) });
    const up = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
  };

  return (
    <div class="props" style={{ left: pos.x, top: pos.y }}>
      <div class="bar" onPointerDown={grab}>
        <span>{item.label} - properties</span>
        <button onClick={onClose}>x</button>
      </div>
      <dl>
        {rows.map(([k, v]) => (
          <>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </>
        ))}
      </dl>
    </div>
  );
}
