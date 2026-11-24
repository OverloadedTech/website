import type { ComponentChildren } from "preact";
import { createPortal } from "preact/compat";
import { useEffect, useRef, useState } from "preact/hooks";
import { angleOf, spinStyle, unrotate } from "./spin";
import { closeWindow, focusWindow, startKiosk, updateWindow, useOs, type Win } from "./state";

type Box = { x: number; y: number; w: number; h: number };
type Edge = "move" | "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";
type Zone = "max" | "left" | "right" | "top" | "bottom" | "tl" | "tr" | "bl" | "br";

const MIN_W = 260;
const MIN_H = 160;
const EDGE = 28;

const ZONE_NAMES: Record<Zone, string> = {
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

// desktop bars, 0 in kiosk mode
const barTop = () => document.querySelector(".topbar")?.getBoundingClientRect().height ?? 0;
const barBottom = () => document.querySelector(".taskbar")?.getBoundingClientRect().height ?? 0;

function zoneAt(x: number, y: number): Zone | null {
  const top = barTop();
  const atTop = y <= top + EDGE;
  const atBottom = y >= innerHeight - barBottom() - EDGE;
  const atLeft = x <= EDGE;
  const atRight = x >= innerWidth - EDGE;
  if (atTop && atLeft) return "tl";
  if (atTop && atRight) return "tr";
  if (atBottom && atLeft) return "bl";
  if (atBottom && atRight) return "br";
  // the very top strip maximizes, the band just below it is the top half
  if (y <= top + 10) return "max";
  if (atTop) return "top";
  if (atBottom) return "bottom";
  if (atLeft) return "left";
  if (atRight) return "right";
  return null;
}

function zoneBox(z: Zone): Box {
  const t = barTop();
  const W = innerWidth;
  const H = innerHeight - t - barBottom();
  const hw = Math.round(W / 2);
  const hh = Math.round(H / 2);
  const boxes: Record<Zone, Box> = {
    max: { x: 0, y: t, w: W, h: H },
    left: { x: 0, y: t, w: hw, h: H },
    right: { x: hw, y: t, w: W - hw, h: H },
    top: { x: 0, y: t, w: W, h: hh },
    bottom: { x: 0, y: t + hh, w: W, h: H - hh },
    tl: { x: 0, y: t, w: hw, h: hh },
    tr: { x: hw, y: t, w: W - hw, h: hh },
    bl: { x: 0, y: t + hh, w: hw, h: H - hh },
    br: { x: hw, y: t + hh, w: W - hw, h: H - hh },
  };
  return boxes[z];
}

const asStyle = (b: Box) => ({ left: b.x, top: b.y, width: b.w, height: b.h });

function clampBox(b: Box): Box {
  const w = Math.max(240, Math.min(b.w, innerWidth - 24));
  const h = Math.max(160, Math.min(b.h, innerHeight - 80));
  return {
    w,
    h,
    x: Math.max(0, Math.min(b.x, innerWidth - w)),
    y: Math.max(0, Math.min(b.y, innerHeight - h)),
  };
}

function resize(edge: Edge, s: Box, dx: number, dy: number): Box {
  const b = { ...s };
  if (edge === "move") return { ...s, x: s.x + dx, y: s.y + dy };
  if (edge.includes("e")) b.w = Math.max(MIN_W, s.w + dx);
  if (edge.includes("s")) b.h = Math.max(MIN_H, s.h + dy);
  if (edge.includes("w")) {
    b.w = Math.max(MIN_W, s.w - dx);
    b.x = s.x + s.w - b.w;
  }
  if (edge.includes("n")) {
    b.h = Math.max(MIN_H, s.h - dy);
    b.y = s.y + s.h - b.h;
  }
  return b;
}

export function Window({ win, children }: { win: Win; children: ComponentChildren }) {
  const [box, setBox] = useState<Box>({ x: win.x, y: win.y, w: win.w, h: win.h });
  const [zone, setZone] = useState<Zone | null>(null);
  const el = useRef<HTMLDivElement>(null);
  const spin = useOs((s) => s.spin);
  // size to restore after max/snap
  const restore = useRef<Box>({ x: win.x, y: win.y, w: win.w, h: win.h });
  const snapped = useRef(false);
  const dragging = useRef(false);

  useEffect(() => {
    if (!dragging.current) setBox({ x: win.x, y: win.y, w: win.w, h: win.h });
  }, [win.x, win.y, win.w, win.h]);

  const toggleMax = () => {
    if (win.max) {
      snapped.current = false;
      const b = clampBox(restore.current);
      restore.current = b;
      updateWindow(win.id, { max: false, ...b });
    } else {
      if (!snapped.current) restore.current = box;
      updateWindow(win.id, { max: true });
    }
  };

  const grab = (edge: Edge) => (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    focusWindow(win.id);
    // undo the window's own rotation while spinning
    const deg = angleOf(el.current);
    let start = box;
    let sx = e.clientX;
    let sy = e.clientY;
    let moved = false;
    let tearOff = edge === "move" && (win.max || snapped.current);
    let lastZone: Zone | null = null;
    let current = box;
    dragging.current = true;
    if (edge !== "move") snapped.current = false;

    const move = (ev: PointerEvent) => {
      let d = unrotate(ev.clientX - sx, ev.clientY - sy, deg);
      if (!moved) {
        if (Math.abs(d.x) < 5 && Math.abs(d.y) < 5) return;
        moved = true;
        if (tearOff) {
          // tear off: old size, centred on the cursor
          const r = restore.current;
          start = {
            ...r,
            x: Math.round(ev.clientX - r.w / 2),
            y: Math.max(barTop(), ev.clientY - 16),
          };
          sx = ev.clientX;
          sy = ev.clientY;
          d = { x: 0, y: 0 };
          tearOff = false;
          snapped.current = false;
          updateWindow(win.id, { max: false, ...start });
        }
      }
      current = resize(edge, start, d.x, d.y);
      setBox(current);
      if (edge === "move") {
        lastZone = zoneAt(ev.clientX, ev.clientY);
        setZone(lastZone);
      }
    };

    const up = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
      removeEventListener("pointercancel", up);
      dragging.current = false;
      setZone(null);
      if (!moved) return;
      if (lastZone) {
        restore.current = start;
        snapped.current = true;
        updateWindow(win.id, { max: false, ...zoneBox(lastZone) });
      } else {
        updateWindow(win.id, current);
      }
    };

    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
    addEventListener("pointercancel", up);
  };

  if (win.min) return null;

  // terminals never spin: the way out has to stay still
  const turning = win.app !== "terminal" && spin.mode !== "off";
  const place = win.max
    ? {
        left: 0,
        top: "var(--os-top)",
        width: "100%",
        height: "calc(100% - var(--os-top) - var(--os-bottom))",
      }
    : asStyle(box);

  return (
    <div
      ref={el}
      class="win"
      style={{ ...place, zIndex: win.z, ...(turning ? spinStyle(spin) : {}) }}
      onPointerDown={() => focusWindow(win.id)}
    >
      {!win.max &&
        (["n", "s", "e", "w", "nw", "ne", "sw", "se"] as const).map((g) => (
          <div key={g} class={`grip ${g}`} onPointerDown={grab(g)} />
        ))}
      <div class="bar" onPointerDown={grab("move")} onDblClick={toggleMax}>
        <span class="title">{win.title}</span>
        <span class="buttons" onPointerDown={(e) => e.stopPropagation()}>
          {win.app === "kiosk" && (
            <button title="full mode - reload the site in kiosk mode" onClick={startKiosk}>
              ⛶
            </button>
          )}
          <button title="minimize" onClick={() => updateWindow(win.id, { min: true })}>
            _
          </button>
          <button title={win.max ? "restore" : "maximize"} onClick={toggleMax}>
            {win.max ? "❐" : "□"}
          </button>
          <button class="close" title="close" onClick={() => closeWindow(win.id)}>
            x
          </button>
        </span>
      </div>
      <div class="body">{children}</div>
      {zone &&
        createPortal(
          <div class="snap" style={asStyle(zoneBox(zone))}>
            <span>{ZONE_NAMES[zone]}</span>
          </div>,
          document.body,
        )}
    </div>
  );
}
