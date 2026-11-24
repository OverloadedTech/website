import type { State } from "./state";

export function angleOf(el: Element | null): number {
  if (!el) return 0;
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  const m = new DOMMatrixReadOnly(t);
  const deg = (Math.atan2(m.b, m.a) * 180) / Math.PI;
  return (deg + 360) % 360;
}

export const siteAngle = () => angleOf(document.getElementById("site"));

// negative animation-delay = carry on from the current angle instead of 0
export function spinStyle({ mode, angle, speed }: State["spin"]): Record<string, string> {
  if (mode === "frozen") return { transform: `rotate(${angle}deg)` };
  if (mode === "off") return {};
  const into = mode === "cw" ? angle : 360 - angle;
  return {
    animation: `spin ${speed}s linear infinite${mode === "ccw" ? " reverse" : ""}`,
    animationDelay: `-${(into / 360) * speed}s`,
  };
}

export function unrotate(dx: number, dy: number, deg: number) {
  if (!deg) return { x: dx, y: dy };
  const r = (-deg * Math.PI) / 180;
  return {
    x: dx * Math.cos(r) - dy * Math.sin(r),
    y: dx * Math.sin(r) + dy * Math.cos(r),
  };
}
