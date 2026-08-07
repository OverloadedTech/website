import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DUCK_ASCII } from "@/lib/site";
import { AppGlyph } from "./AppIcons";
// The desktop never rotates (it lives outside the spin stage), so pointer
// coordinates are already in layout space - no un-rotation needed.
const pt = (e: { clientX: number; clientY: number }) => ({ x: e.clientX, y: e.clientY });
const unspinDelta = (dx: number, dy: number) => ({ x: dx, y: dy });
const layoutBox = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

import {
  closeWindow,
  focusWindow,
  openWindow,
  setState,
  updateWindow,
  useOs,
  type AppId,
} from "./store";

type IconDef = {
  key: string;
  label: string;
  /** icon name resolved by AppGlyph */
  glyph: string;
  app: AppId;
  url?: string;
};

const ICONS: IconDef[] = [
  { key: "terminal", label: "terminal", glyph: "terminal", app: "terminal" },
  { key: "site", label: "Kiosk", glyph: "kiosk", app: "kiosk", url: "/" },
  { key: "browser", label: "browser", glyph: "browser", app: "browser" },
  { key: "editor", label: "mousepad", glyph: "editor", app: "editor" },
  { key: "doom", label: "doom", glyph: "doom", app: "doom" },
  { key: "taskmgr", label: "task manager", glyph: "taskmgr", app: "taskmgr" },
  { key: "paint", label: "paint", glyph: "paint", app: "paint" },
  { key: "cube", label: "geometry.gl", glyph: "cube3d", app: "cube3d" },
  { key: "manual", label: "manual", glyph: "manual", app: "manual" },
];


const COL = 100;
const ROW = 96;

type Ctx = { x: number; y: number; icon: IconDef | null };
type Props = { icon: IconDef; body: [string, string][] };

export function Desktop() {
  const icons = useOs((s) => s.icons);
  const windows = useOs((s) => s.windows);
  const files = useOs((s) => s.files);
  const [menu, setMenu] = useState(false);
  const [offset, setOffset] = useState<{ keys: string[]; dx: number; dy: number } | null>(null);

  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [props, setProps] = useState<Props | null>(null);
  const area = useRef<HTMLDivElement | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [band, setBand] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const wallpaper = useOs((s) => s.wallpaper);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const t = setInterval(tick, 20000);
    return () => clearInterval(t);
  }, []);

  const fileIcons: IconDef[] = Object.keys(files).map((f) => ({
    key: `file:${f}`,
    label: f,
    glyph: "file",
    app: "editor",
  }));
  const all = [...ICONS, ...fileIcons];

  const posOf = (key: string, i: number) =>
    icons[key] ?? { col: Math.floor(i / 6), row: i % 6 };

  const launch = (icon: IconDef) => {
    if (icon.key.startsWith("file:")) {
      const f = icon.key.slice(5);
      openWindow("editor", { file: f, draft: files[f] ?? "", title: `mousepad - ${f}` });
      return;
    }
    openWindow(icon.app, icon.url ? { url: icon.url, title: icon.label } : {});
  };

  /** rubber-band selection, the way a real file manager does it */
  const onAreaPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest(".dicon")) return;
    if (!area.current) return;
    const rect = layoutBox(area.current);
    const additive = e.shiftKey || e.ctrlKey || e.metaKey;
    const base = additive ? sel : [];
    if (!additive) setSel([]);
    const start = pt(e);
    const sx = start.x;
    const sy = start.y;
    let dragging = false;

    const move = (ev: PointerEvent) => {
      const p = pt(ev);
      if (!dragging && Math.abs(p.x - sx) + Math.abs(p.y - sy) < 4) return;
      dragging = true;
      const x = Math.min(sx, p.x) - rect.left;
      const y = Math.min(sy, p.y) - rect.top;
      const w = Math.abs(p.x - sx);
      const h = Math.abs(p.y - sy);
      setBand({ x, y, w, h });
      const hit: string[] = [];
      area.current?.querySelectorAll<HTMLElement>(".dicon").forEach((el) => {
        const b = layoutBox(el);
        const inside =
          b.left + b.width > Math.min(sx, p.x) &&
          b.left < Math.max(sx, p.x) &&
          b.top + b.height > Math.min(sy, p.y) &&
          b.top < Math.max(sy, p.y);
        if (inside && el.dataset["key"]) hit.push(el.dataset["key"]);
      });
      setSel([...new Set([...base, ...hit])]);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setBand(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const onIconPointerDown = (key: string) => (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const additive = e.shiftKey || e.ctrlKey || e.metaKey;
    const group = additive
      ? sel.includes(key)
        ? sel.filter((k) => k !== key)
        : [...sel, key]
      : sel.includes(key)
        ? sel
        : [key];
    setSel(group);
    if (additive && !group.includes(key)) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;
    let last = { x: 0, y: 0 };
    const move = (ev: PointerEvent) => {
      const d = unspinDelta(ev.clientX - startX, ev.clientY - startY);
      last = d;
      if (!moved && Math.abs(d.x) + Math.abs(d.y) <= 6) return;
      moved = true;
      setOffset({ keys: group, dx: d.x, dy: d.y });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setOffset(null);
      if (!moved) return;
      // snap the whole group by the same grid delta, so relative layout survives
      const dc = Math.round(last.x / COL);
      const dr = Math.round(last.y / ROW);
      if (dc === 0 && dr === 0) return;
      setState((s) => {
        const next = { ...s.icons };
        for (const k of group) {
          const i = all.findIndex((a) => a.key === k);
          const p = s.icons[k] ?? { col: Math.floor(i / 6), row: i % 6 };
          next[k] = { col: Math.max(0, p.col + dc), row: Math.max(0, p.row + dr) };
        }
        return { icons: next };
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };


  const openCtx = (icon: IconDef | null) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (icon && !sel.includes(icon.key)) setSel([icon.key]);
    if (!icon) setSel([]);
    setMenu(false);
    setCtx({ x: e.clientX, y: e.clientY, icon });
  };

  const showProps = (icon: IconDef) => {
    const isFile = icon.key.startsWith("file:");
    const p = icons[icon.key];
    const body: [string, string][] = isFile
      ? [
          ["name", icon.label],
          ["type", "text/plain"],
          ["size", `${new Blob([files[icon.label] ?? ""]).size} bytes`],
          ["lines", String((files[icon.label] ?? "").split("\n").length)],
          ["opens with", "mousepad"],
          ["position", p ? `col ${p.col}, row ${p.row}` : "auto"],
        ]
      : [
          ["name", icon.label],
          ["type", "application"],
          ["unit", `${icon.app}.app`],
          ["exec", `/usr/bin/${icon.app}`],
          ["position", p ? `col ${p.col}, row ${p.row}` : "auto"],
        ];
    setProps({ icon, body });
  };

  const deleteFile = (icon: IconDef) => {
    const f = icon.label;
    setState((s) => {
      const next = { ...s.files };
      delete next[f];
      const nextIcons = { ...s.icons };
      delete nextIcons[icon.key];
      return { files: next, icons: nextIcons };
    });
  };

  const newFile = () => {
    // compute inside the updater so rapid creates see the freshest file list,
    // and use `in` because an empty file ("") is falsy
    let name = "untitled.txt";
    setState((s) => {
      let n = 1;
      name = "untitled.txt";
      while (name in s.files) name = `untitled-${++n}.txt`;
      return { files: { ...s.files, [name]: "" } };
    });
    openWindow("editor", { file: name, draft: "", title: `mousepad - ${name}` });
  };


  const tidyIcons = () => setState(() => ({ icons: {} }));

  return (
    <div
      className="desktop"
      style={wallpaper ? { backgroundImage: `url(${wallpaper})` } : undefined}
      data-wall={wallpaper ? "" : undefined}
    >
      <div className="desktop-topbar">
        <button
          className={`start-btn${menu ? " open" : ""}`}
          onClick={() => setMenu((m) => !m)}
          aria-expanded={menu}
        >
          <span className="start-glyph" aria-hidden>
            ▤
          </span>
          menu
        </button>
        <span className="topbar-sep" aria-hidden />
        <span className="topbar-right">
          <span className="topbar-clock">{clock}</span>
        </span>
        {menu && (
          <>
            <div className="start-scrim" onClick={() => setMenu(false)} />
            <div className="start-menu">
              {ICONS.map((i) => (
                <button
                  key={i.key}
                  onClick={() => {
                    setMenu(false);
                    launch(i);
                  }}
                >
                  <AppGlyph name={i.glyph} className="mglyph" />

                  {i.label}
                </button>
              ))}
              {fileIcons.length > 0 &&
                fileIcons.map((i) => (
                  <button
                    key={i.key}
                    onClick={() => {
                      setMenu(false);
                      launch(i);
                    }}
                  >
                    <AppGlyph name={i.glyph} className="mglyph" />

                    {i.label}
                  </button>
                ))}
            </div>
          </>
        )}
      </div>

      <div
        className="desktop-icons"
        ref={area}
        onPointerDown={onAreaPointerDown}
        onContextMenu={openCtx(null)}
      >
        {band && (
          <div
            className="select-band"
            style={{ left: band.x, top: band.y, width: band.w, height: band.h }}
          />
        )}
        {offset &&
          (() => {
            const dc = Math.round(offset.dx / COL);
            const dr = Math.round(offset.dy / ROW);
            return offset.keys.map((k) => {
              const i = all.findIndex((a) => a.key === k);
              if (i < 0) return null;
              const p = posOf(k, i);
              return (
                <div
                  key={`ghost:${k}`}
                  className="drop-ghost"
                  style={{
                    left: Math.max(0, p.col + dc) * COL + 12,
                    top: Math.max(0, p.row + dr) * ROW + 10,
                  }}
                />
              );
            });
          })()}
        {all.map((icon, i) => {
          const p = posOf(icon.key, i);
          const moving = offset?.keys.includes(icon.key);
          return (
            <button
              key={icon.key}
              data-key={icon.key}
              className={`dicon${moving ? " dragging" : ""}${sel.includes(icon.key) ? " is-selected" : ""}`}
              style={{
                left: p.col * COL + 12,
                top: p.row * ROW + 10,
                transform: moving ? `translate3d(${offset!.dx}px, ${offset!.dy}px, 0)` : undefined,
              }}
              onPointerDown={onIconPointerDown(icon.key)}
              onDoubleClick={() => launch(icon)}
              onContextMenu={openCtx(icon)}
            >
              <AppGlyph name={icon.glyph} className="glyph" />

              <span>{icon.label}</span>
            </button>
          );
        })}

        <pre
          className="duck-big"
          style={{ position: "absolute", right: 24, bottom: 20, opacity: 0.5 }}
        >
          {DUCK_ASCII}
        </pre>
      </div>

      {ctx && (
        <>
          <div className="ctx-scrim" onClick={() => setCtx(null)} onContextMenu={(e) => {
            e.preventDefault();
            setCtx(null);
          }} />
          <div className="ctx-menu" style={{ left: Math.min(ctx.x, window.innerWidth - 190), top: Math.min(ctx.y, window.innerHeight - 220) }}>
            {ctx.icon ? (
              <>
                <span className="ctx-title">{ctx.icon.label}</span>
                <button onClick={() => { launch(ctx.icon!); setCtx(null); }}>open</button>
                {ctx.icon.key.startsWith("file:") ? (
                  <>
                    <button onClick={() => { openWindow("editor", { file: ctx.icon!.label, draft: files[ctx.icon!.label] ?? "", title: `mousepad - ${ctx.icon!.label}` }); setCtx(null); }}>
                      edit in mousepad
                    </button>
                    <button onClick={() => { deleteFile(ctx.icon!); setCtx(null); }}>delete</button>
                  </>
                ) : (
                  <button onClick={() => { openWindow(ctx.icon!.app, ctx.icon!.url ? { url: ctx.icon!.url, title: ctx.icon!.label } : {}); setCtx(null); }}>
                    open new instance
                  </button>
                )}
                <button onClick={() => { setState((s) => { const n = { ...s.icons }; delete n[ctx.icon!.key]; return { icons: n }; }); setCtx(null); }}>
                  reset position
                </button>
                <span className="ctx-sep" />
                <button onClick={() => { showProps(ctx.icon!); setCtx(null); }}>properties</button>
              </>
            ) : (
              <>
                <span className="ctx-title">desktop</span>
                <button onClick={() => { newFile(); setCtx(null); }}>new text file</button>
                <button onClick={() => { openWindow("terminal", {}); setCtx(null); }}>open terminal</button>
                <button onClick={() => { tidyIcons(); setCtx(null); }}>tidy icons</button>
                <span className="ctx-sep" />
                <button onClick={() => { setState(() => ({ wallpaper: null })); setCtx(null); }}>clear wallpaper</button>
                <button onClick={() => { openWindow("taskmgr", {}); setCtx(null); }}>task manager</button>
              </>
            )}
          </div>
        </>
      )}

      {props && <PropsWindow data={props} onClose={() => setProps(null)} />}

      <div className="taskbar">
        {windows.length === 0 && (
          <span className="small" style={{ opacity: 0.55 }}>
            double click an icon.
          </span>
        )}
        {windows.map((w) => (
          <button
            key={w.id}
            className={`task ${w.minimized ? "" : "active"}`}
            onClick={() =>
              w.minimized ? focusWindow(w.id) : updateWindow(w.id, { minimized: true })
            }
            onAuxClick={(e) => {
              if (e.button === 1) closeWindow(w.id);
            }}
            title="click to toggle, middle click to close"
          >
            {w.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function PropsWindow({ data, onClose }: { data: Props; onClose: () => void }) {
  const [pos, setPos] = useState(() => ({
    x: Math.max(20, Math.round(window.innerWidth / 2 - 190)),
    y: Math.max(40, Math.round(window.innerHeight / 2 - 160)),
  }));
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos({
      x: Math.min(window.innerWidth - 80, Math.max(0, e.clientX - drag.current.dx)),
      y: Math.min(window.innerHeight - 40, Math.max(0, e.clientY - drag.current.dy)),
    });
  };
  const onUp = () => {
    drag.current = null;
  };

  return createPortal(
    <div className="ctx-props is-window" style={{ left: pos.x, top: pos.y }}>
      <div
        className="ctx-props-head"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        <span>{data.icon.label} - properties</span>
        <button className="mini-btn" onClick={onClose}>
          x
        </button>
      </div>
      <dl>
        {data.body.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>,
    document.body,
  );
}
