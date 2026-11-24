import { age, isBirthday } from "./age";

// only on 18 August: a line under my name and five seconds of confetti

const COLORS = ["#ffd166", "#06d6a0", "#ef476f", "#118ab2", "#f4f1de", "#c77dff"];

export function birthday() {
  const note = document.querySelector<HTMLElement>(".birthday");
  if (!note || !isBirthday()) return;
  note.textContent = `🎉 it's 18 August, which means it's my birthday: ${age()} today. thanks for stopping by.`;
  note.hidden = false;
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) confetti();
}

function confetti() {
  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  document.body.append(canvas);
  const ctx = canvas.getContext("2d")!;
  const dpr = devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const bits = Array.from({ length: 160 }, () => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * innerHeight * 0.6,
    vx: (Math.random() - 0.5) * 1.4,
    vy: 1.6 + Math.random() * 2.6,
    size: 5 + Math.random() * 7,
    rot: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  const start = performance.now();
  const frame = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = t > 4000 ? Math.max(0, 1 - (t - 4000) / 1000) : 1;
    for (const b of bits) {
      b.x += b.vx;
      b.y += b.vy;
      b.rot += b.spin;
      if (b.y > innerHeight + 20) {
        b.y = -20;
        b.x = Math.random() * innerWidth;
      }
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.color;
      ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
      ctx.restore();
    }
    if (t < 5000) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
