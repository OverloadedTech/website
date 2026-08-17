import { useEffect, useRef, useState } from "react";
import { isBirthday } from "@/lib/site";

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
};

const COLORS = ["#ffd166", "#06d6a0", "#ef476f", "#118ab2", "#f4f1de", "#c77dff"];

/** Confetti burst, only on 18 August. */
export function Confetti() {
  const [active, setActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isBirthday()) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setActive(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = () => window.innerWidth;
    const pieces: Piece[] = Array.from({ length: 160 }, () => ({
      x: Math.random() * w(),
      y: -20 - Math.random() * window.innerHeight * 0.6,
      vx: (Math.random() - 0.5) * 1.4,
      vy: 1.6 + Math.random() * 2.6,
      size: 5 + Math.random() * 7,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    }));

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const fade = elapsed > 8000 ? Math.max(0, 1 - (elapsed - 8000) / 2000) : 1;
      ctx.globalAlpha = fade;
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > window.innerHeight + 20) {
          p.y = -20;
          p.x = Math.random() * w();
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (elapsed < 10000) raf = requestAnimationFrame(tick);
      else setActive(false);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />;
}
