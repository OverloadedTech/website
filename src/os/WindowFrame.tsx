import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { clampGeom, closeWindow, focusWindow, updateWindow, useOs, type WinState } from "./store";
import { elAngle, unspinAround, unspinDeltaBy } from "./spin";
import { spinClass, spinStyle } from "./SpinBox";


type Geom = { x: number; y: number; w: number; h: number };
type Mode = null | "move" | "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

const SNAP_LABEL: Record<SnapZone, string> = {
  max: "full",
  left: "left half",
  right: "right half",
  top: "top half",
  bottom: "bottom half",
  tl: "top left",
  tr: "top right",
  bl: "bottom left",
  br: "bottom right",
};

const MIN_W = 260;
const MIN_H = 160;
/** how close to an edge the pointer must be for a snap zone to arm */
const EDGE = 28;

export type SnapZone =
  | "max"
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "tl"
  | "tr"
  | "bl"
  | "br";

/** measured desktop chrome: top bar and taskbar, absent in kiosk mode */
const chromeTop = () =>
  Math.round(document.querySelector(".desktop-topbar")?.getBoundingClientRect().height ?? 0);
const chromeBottom = () =>
  Math.round(document.querySelector(".taskbar")?.getBoundingClientRect().height ?? 0);

/** pointer position -> snap zone, windows-style edges and corners */
function zoneFor(x: number, y: number): SnapZone | null {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const ct = chromeTop();
  // the very top strip maximizes (windows-style); the band just below it takes the top half
  const topMax = y <= ct + 10;
  const top = y <= ct + EDGE;
  const bottom = y >= h - chromeBottom() - EDGE;
  const left = x <= EDGE;
  const right = x >= w - EDGE;
  if (top && left) return "tl";
  if (top && right) return "tr";
  if (bottom && left) return "bl";
  if (bottom && right) return "br";
  if (topMax) return "max";
  if (top) return "top";
  if (bottom) return "bottom";
  if (left) return "left";
  if (right) return "right";
  return null;
}

/** snap zone -> window geometry inside the desktop chrome */
export function zoneGeom(z: SnapZone): Geom {
  const t = chromeTop();
  const b = chromeBottom();
  const W = window.innerWidth;
  const H = window.innerHeight - t - b;
  const half = { w: Math.round(W / 2), h: Math.round(H / 2) };
  switch (z) {
    case "max":
      return { x: 0, y: t, w: W, h: H };
    case "left":
      return { x: 0, y: t, w: half.w, h: H };
    case "right":
      return { x: half.w, y: t, w: W - half.w, h: H };
    case "top":
      return { x: 0, y: t, w: W, h: half.h };
    case "bottom":
      return { x: 0, y: t + half.h, w: W, h: H - half.h };
    case "tl":
      return { x: 0, y: t, w: half.w, h: half.h };
    case "tr":
      return { x: half.w, y: t, w: W - half.w, h: half.h };
    case "bl":
      return { x: 0, y: t + half.h, w: half.w, h: H - half.h };
    case "br":
      return { x: half.w, y: t + half.h, w: W - half.w, h: H - half.h };
  }
}

export function WindowFrame({
  win,
  children,
  onMinimize,
  onClose,
  extraButtons,
}: {
  win: WinState;
  children: ReactNode;
  onMinimize?: (id: number) => void;
  onClose?: (id: number) => void;
  extraButtons?: ReactNode;
}) {
  const [geom, setGeom] = useState<Geom>({ x: win.x, y: win.y, w: win.w, h: win.h });
  const boxRef = useRef<HTMLDivElement | null>(null);
  const spin = useOs((s) => s.spin);
  const spinAngleState = useOs((s) => s.spinAngle);
  const spinSpeed = useOs((s) => s.spinSpeed);
  // terminals are the way out, so they never turn
  const spins = win.app !== "terminal" && spin !== "none";

  const drag = useRef<
    { mode: Mode; sx: number; sy: number; start: Geom; tearOff: boolean; armed: boolean } | null
  >(null);
  const [snap, setSnap] = useState<SnapZone | null>(null);
  const snapRef = useRef<SnapZone | null>(null);
  /** geometry to restore to when un-maximizing / un-snapping */
  const restore = useRef<Geom>({ x: win.x, y: win.y, w: win.w, h: win.h });
  /** true while the window sits in a snap zone, so dragging it out restores its size */
  const snapped = useRef(false);

  const toggleMax = useCallback(() => {
    if (win.maximized) {
      snapped.current = false;
      // the restore target may come from a wider session (desktop -> phone),
      // so clamp it or the window "restores" to something off-screen
      const g = clampGeom(restore.current);
      restore.current = g;
      updateWindow(win.id, { maximized: false, ...g });
      setGeom(g);
    } else {
      // keep the pre-snap geometry as the restore target when currently snapped
      if (!snapped.current) restore.current = { ...geom };
      updateWindow(win.id, { maximized: true });
    }
  }, [geom, win.id, win.maximized]);

  useEffect(() => {
    if (!drag.current) setGeom({ x: win.x, y: win.y, w: win.w, h: win.h });
  }, [win.x, win.y, win.w, win.h]);

  const begin = useCallback(
    (mode: Mode) => (e: React.PointerEvent) => {
      e.preventDefault();
      focusWindow(win.id);
      const start = { ...geom };
      if (mode !== "move") snapped.current = false;
      // a maximized / snapped window is only torn off once the pointer actually
      // moves, so a plain double-click never turns into a snap
      const tearOff = mode === "move" && (win.maximized || snapped.current);
      drag.current = { mode, sx: e.clientX, sy: e.clientY, start, tearOff, armed: false };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [geom, win.id, win.maximized],
  );


  useEffect(() => {
    // each window turns around its own centre, so un-rotate pointer maths
    // about that same centre (rotation leaves the centre where it is)
    const ang = () => elAngle(boxRef.current);
    const P = (e: { clientX: number; clientY: number }) => {
      const deg = ang();
      if (!deg || !boxRef.current) return { x: e.clientX, y: e.clientY };
      const r = boxRef.current.getBoundingClientRect();
      return unspinAround(e.clientX, e.clientY, deg, r.left + r.width / 2, r.top + r.height / 2);
    };
    const D = (dx: number, dy: number) => unspinDeltaBy(dx, dy, ang());

    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const delta = D(e.clientX - d.sx, e.clientY - d.sy);
      let dx = delta.x;
      let dy = delta.y;
      // ignore jitter: nothing happens until the pointer clears a small threshold
      if (!d.armed) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        d.armed = true;
        if (d.tearOff) {
          // tear a maximized / snapped window off: restore its size under the cursor
          const r = restore.current;
          const p = P(e);
          d.start = {
            w: r.w,
            h: r.h,
            x: Math.round(p.x - r.w / 2),
            y: Math.max(chromeTop(), Math.round(p.y - 16)),
          };
          d.sx = e.clientX;
          d.sy = e.clientY;
          dx = 0;
          dy = 0;
          d.tearOff = false;
          snapped.current = false;
          const g = d.start;
          setGeom(g);
          queueMicrotask(() => updateWindow(win.id, { maximized: false, ...g }));
        }
      }
      const s = d.start;
      let next: Geom = { ...s };
      switch (d.mode) {
        case "move": {
          next = { ...s, x: s.x + dx, y: s.y + dy };
          const p = P(e);
          const z = zoneFor(p.x, p.y);
          snapRef.current = z;
          setSnap(z);
          break;
        }
        case "e":
          next.w = Math.max(MIN_W, s.w + dx);
          break;
        case "s":
          next.h = Math.max(MIN_H, s.h + dy);
          break;
        case "w":
          next.w = Math.max(MIN_W, s.w - dx);
          next.x = s.x + (s.w - next.w);
          break;
        case "n":
          next.h = Math.max(MIN_H, s.h - dy);
          next.y = s.y + (s.h - next.h);
          break;
        case "se":
          next.w = Math.max(MIN_W, s.w + dx);
          next.h = Math.max(MIN_H, s.h + dy);
          break;
        case "ne":
          next.w = Math.max(MIN_W, s.w + dx);
          next.h = Math.max(MIN_H, s.h - dy);
          next.y = s.y + (s.h - next.h);
          break;
        case "sw":
          next.w = Math.max(MIN_W, s.w - dx);
          next.x = s.x + (s.w - next.w);
          next.h = Math.max(MIN_H, s.h + dy);
          break;
        case "nw":
          next.w = Math.max(MIN_W, s.w - dx);
          next.x = s.x + (s.w - next.w);
          next.h = Math.max(MIN_H, s.h - dy);
          next.y = s.y + (s.h - next.h);
          break;
        default:
          return;
      }
      setGeom(next);
    };
    const up = () => {
      if (!drag.current) return;
      const wasMove = drag.current.mode === "move";
      const armed = drag.current.armed;
      const startGeom = drag.current.start;
      drag.current = null;
      const z = snapRef.current;
      snapRef.current = null;
      setSnap(null);
      // a click without movement must not change geometry (keeps double-click clean)
      if (!armed) return;
      if (wasMove && z) {
        restore.current = startGeom;
        snapped.current = true;
        const g = zoneGeom(z);
        setGeom(g);
        updateWindow(win.id, { ...g, maximized: false });
        return;
      }
      setGeom((g) => {
        updateWindow(win.id, g);
        return g;
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [win.id, win.app]);

  if (win.minimized) return null;

  const style: React.CSSProperties = win.maximized
    ? {
        left: 0,
        top: "var(--os-top)",
        width: "100%",
        height: "calc(100% - var(--os-top) - var(--os-bottom))",
        zIndex: win.z,
      }
    : { left: geom.x, top: geom.y, width: geom.w, height: geom.h, zIndex: win.z };

  const spun = spins ? spinStyle(spin, spinAngleState, spinSpeed) : undefined;

  return (
    <div
      ref={boxRef}
      className={`win${spins ? ` win-spin ${spinClass(spin)}` : ""}`}
      style={{ ...style, ...spun }}
      onPointerDown={() => focusWindow(win.id)}
    >

      {!win.maximized &&
        (["n", "s", "e", "w", "nw", "ne", "sw", "se"] as const).map((g) => (
          <div key={g} className={`win-grip g-${g}`} onPointerDown={begin(g)} />
        ))}
      {snap &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="snap-preview"
            style={(() => {
              const g = zoneGeom(snap);
              return { left: g.x, top: g.y, width: g.w, height: g.h };
            })()}
          >
            <span className="snap-label">{SNAP_LABEL[snap]}</span>
          </div>,
          document.body,
        )}
      <div className="win-bar" onPointerDown={begin("move")} onDoubleClick={toggleMax}>
        <span className="win-title">{win.title}</span>
        <div className="win-btns" onPointerDown={(e) => e.stopPropagation()}>
          {extraButtons}
          <button
            title="minimize"
            onClick={() => (onMinimize ? onMinimize(win.id) : updateWindow(win.id, { minimized: true }))}
          >
            _
          </button>
          <button
            title={win.maximized ? "restore" : "maximize"}
            onClick={toggleMax}
          >
            {win.maximized ? "❐" : "□"}
          </button>
          <button className="x" title="close" onClick={() => (onClose ? onClose(win.id) : closeWindow(win.id))}>
            ✕
          </button>
        </div>
      </div>
      <div className="win-body">{children}</div>
    </div>
  );
}
