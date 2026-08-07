/**
 * Pointer maths for the `spin` command.
 *
 * While the page (and, now, the desktop + windows) is rotated, raw clientX/Y
 * no longer lines up with the layout: dragging an icon to the right would move
 * it sideways-and-down. Everything interactive converts its pointer coords
 * through here first, which un-rotates them back into layout space.
 */

export type Pt = { x: number; y: number };

/** Rotation of a specific element in degrees (0 when it is upright). */
export function elAngle(el: Element | null | undefined): number {
  if (!el || typeof window === "undefined") return 0;
  const t = getComputedStyle(el as HTMLElement).transform;
  if (!t || t === "none") return 0;
  try {
    const m = new DOMMatrixReadOnly(t);
    const deg = (Math.atan2(m.b, m.a) * 180) / Math.PI;
    return ((deg % 360) + 360) % 360;
  } catch {
    return 0;
  }
}

/** Live rotation of the escape layer in degrees, 0 when nothing is spinning. */
export function spinAngle(): number {
  if (typeof document === "undefined") return 0;
  const el = (document.querySelector(".spin-stage") ??
    document.querySelector(".spin-root")) as HTMLElement | null;
  return elAngle(el);
}

/** Client-space delta -> layout-space delta for a given rotation. */
export function unspinDeltaBy(dx: number, dy: number, deg: number): Pt {
  if (!deg) return { x: dx, y: dy };
  const r = (-deg * Math.PI) / 180;
  return {
    x: dx * Math.cos(r) - dy * Math.sin(r),
    y: dx * Math.sin(r) + dy * Math.cos(r),
  };
}

/** Client point -> layout point, un-rotating around an arbitrary centre. */
export function unspinAround(x: number, y: number, deg: number, cx: number, cy: number): Pt {
  const d = unspinDeltaBy(x - cx, y - cy, deg);
  return { x: cx + d.x, y: cy + d.y };
}


function center(): Pt {
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/** Client point -> layout point (undoes the current rotation). */
export function unspinPoint(x: number, y: number): Pt {
  const deg = spinAngle();
  if (!deg) return { x, y };
  const c = center();
  const r = (-deg * Math.PI) / 180;
  const dx = x - c.x;
  const dy = y - c.y;
  return {
    x: c.x + dx * Math.cos(r) - dy * Math.sin(r),
    y: c.y + dx * Math.sin(r) + dy * Math.cos(r),
  };
}

/** Same, straight from a pointer/mouse event. */
export function pt(e: { clientX: number; clientY: number }): Pt {
  return unspinPoint(e.clientX, e.clientY);
}

/** Client-space delta -> layout-space delta. */
export function unspinDelta(dx: number, dy: number): Pt {
  const deg = spinAngle();
  if (!deg) return { x: dx, y: dy };
  const r = (-deg * Math.PI) / 180;
  return {
    x: dx * Math.cos(r) - dy * Math.sin(r),
    y: dx * Math.sin(r) + dy * Math.cos(r),
  };
}

/**
 * Layout-space box of an element. Rotation keeps an element's centre where it
 * is, so the un-rotated centre plus the offset size gives the real box.
 */
export function layoutBox(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const c = unspinPoint(r.left + r.width / 2, r.top + r.height / 2);
  const w = el.offsetWidth || r.width;
  const h = el.offsetHeight || r.height;
  return { left: c.x - w / 2, top: c.y - h / 2, width: w, height: h, cx: c.x, cy: c.y };
}
