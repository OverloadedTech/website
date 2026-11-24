import { DUCK } from "../os/duck";

const SORRY = "so sorry! the CV is still a work in progress. thank you for being patient.";
const AFTER = "oh no, the cone slipped! are you okay? please come back soon, it will be worth it.";

const CONE = `<svg viewBox="0 0 24 26" aria-hidden="true">
  <path d="M12 1.5 19.5 21h-15z" fill="#ff7a1a"/>
  <path d="M9.3 8.5h5.4l1.35 3.5h-8.1z" fill="#fff"/>
  <path d="M6.6 15.5h10.8l1.15 3H5.45z" fill="#fff"/>
  <rect x="1.5" y="20.5" width="21" height="4" rx="1" fill="#e2620a"/>
</svg>`;

let layer: HTMLElement | null = null;
let timers: number[] = [];

export function throwCone(button: Element) {
  layer?.remove();
  timers.forEach(clearTimeout);

  const r = button.getBoundingClientRect();
  const top = r.bottom + 26;
  const right = Math.max(8, innerWidth - (r.left + r.width / 2) - 30);
  // distance to the middle of the screen
  const dx = innerWidth / 2 - (innerWidth - right - 30);
  const dy = innerHeight / 2 - top;

  layer = document.createElement("div");
  layer.className = "cone-layer";
  layer.innerHTML = `
    <div class="cv-duck" role="status" style="top:${top}px; right:${right}px; --dx:${dx}px; --dy:${dy}px">
      <div class="say"></div>
      <div class="body"><pre aria-hidden="true"></pre><span class="cone">${CONE}</span></div>
    </div>
    <div class="bonk" aria-hidden="true"><span>*bonk*</span></div>`;
  layer.querySelector("pre")!.textContent = DUCK;
  const say = layer.querySelector(".say")!;
  say.textContent = SORRY;
  document.body.append(layer);

  const html = document.documentElement;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const current = layer;
  timers = [
    window.setTimeout(() => {
      say.textContent = AFTER;
      if (!still) html.setAttribute("data-bonk", "");
    }, 1500),
    window.setTimeout(() => html.removeAttribute("data-bonk"), 1950),
    window.setTimeout(() => current.remove(), 6000),
  ];
}
