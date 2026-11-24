import { get, requestTerminal, subscribe } from "../os/state";

const SAYINGS = [
  "quack.",
  "quack quack.",
  "bread, please.",
  "that tickles.",
  "again?",
  "ok, last one.",
];
const GLYPHS = "*+/\\#><=|~^01{}[]:;%&$";
const COLORS = ["var(--accent)", "var(--bright)", "var(--muted)", "var(--fg)", "var(--accent-2)"];

const hasTerminal = () => get().wins.some((w) => w.app === "terminal");

function comeBack() {
  document.querySelectorAll(".poke").forEach((d) => d.classList.remove("flying", "gone"));
}

export function watchPond() {
  let had = hasTerminal();
  subscribe(() => {
    const has = hasTerminal();
    if (had && !has) comeBack();
    had = has;
  });
}

export function poke(duck: Element, embedded: boolean) {
  const r = duck.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;

  const burst = document.createElement("div");
  burst.className = "burst";
  burst.setAttribute("aria-hidden", "true");
  const ring = document.createElement("span");
  ring.className = "ring";
  ring.style.cssText = `left:${x}px; top:${y}px`;
  burst.append(ring);
  const count = 54;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.35;
    const power = 90 + Math.random() * 190;
    const g = document.createElement("i");
    g.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    g.style.cssText = [
      `left:${x}px`,
      `top:${y}px`,
      `color:${COLORS[Math.floor(Math.random() * COLORS.length)]}`,
      `font-size:${11 + Math.round(Math.random() * 15)}px`,
      `animation-duration:${1.1 + Math.random() * 0.9}s`,
      `animation-delay:${Math.random() * 0.06}s`,
      `--dx:${Math.round(Math.cos(angle) * power)}px`,
      `--dy:${Math.round(Math.sin(angle) * power * 0.75)}px`,
      `--fall:${Math.round(160 + Math.random() * 320)}px`,
      `--rot:${Math.round(Math.random() * 1080 - 540)}deg`,
    ].join(";");
    burst.append(g);
  }
  document.body.append(burst);
  setTimeout(() => burst.remove(), 2200);

  const pond = duck.closest(".pond")!;
  pond.querySelector(".bubble")?.remove();
  const bubble = document.createElement("span");
  bubble.className = "bubble";
  bubble.textContent = SAYINGS[Math.floor(Math.random() * SAYINGS.length)];
  pond.append(bubble);

  duck.classList.add("flying");
  setTimeout(() => {
    bubble.remove();
    duck.classList.add("gone");
    if (embedded) dispatchEvent(new Event("inception"));
    else requestTerminal();
    // nothing opened (phone warning, inception duck), come back
    setTimeout(() => !hasTerminal() && comeBack(), 400);
  }, 950);
}
