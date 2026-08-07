import type { CSSProperties, ReactNode } from "react";
import { useOs, type SpinMode } from "./store";

/** class + inline animation state for anything that should turn with `spin` */
export function spinClass(spin: SpinMode): string {
  return spin === "cw" ? "spin-cw" : spin === "ccw" ? "spin-ccw" : "";
}

export function spinStyle(
  spin: SpinMode,
  angle: number,
  speed: number,
): CSSProperties | undefined {
  if (spin === "frozen") return { transform: `rotate(${angle}deg)` };
  if (spin === "cw" || spin === "ccw")
    return {
      animationDuration: `${speed}s`,
      // negative delay resumes the turn from the angle it was already at,
      // so speed/direction changes never snap back.
      animationDelay: `-${((spin === "cw" ? angle : 360 - angle) / 360) * speed}s`,
    };
  return undefined;
}

/**
 * Shared rotation wrapper for the `spin` command: the site itself and the
 * kiosk rebuild overlay use it. Windows spin individually around their own
 * centre instead (see WindowFrame), and terminals never spin - the way out
 * must stay still.
 */
export function SpinBox({ children, className }: { children: ReactNode; className?: string }) {
  const spin = useOs((s) => s.spin);
  const angle = useOs((s) => s.spinAngle);
  const speed = useOs((s) => s.spinSpeed);

  const cls = [className, spinClass(spin)].filter(Boolean).join(" ");

  return (
    <div className={cls} style={spinStyle(spin, angle, speed)}>
      {children}
    </div>
  );
}

