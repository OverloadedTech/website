// the site went up in August 2021, just before I turned 13

export function age(now = new Date()) {
  const had = now.getMonth() > 7 || (now.getMonth() === 7 && now.getDate() >= 18);
  return now.getFullYear() - 2008 - (had ? 0 : 1);
}

export const isBirthday = (d = new Date()) => d.getMonth() === 7 && d.getDate() === 18;

// 18 -> 13 15 17 18, 30 -> 13 19 25 30
export function jumps(real: number) {
  const span = real - 13;
  const count = Math.min(4, span + 1);
  if (count < 2) return [real];
  const out = new Set<number>();
  for (let i = 0; i < count; i++) out.add(Math.ceil(13 + (span * i) / (count - 1)));
  return [...out];
}

let timer = 0;

export function countAge() {
  clearTimeout(timer);
  const el = document.querySelector<HTMLElement>(".age");
  if (!el) return;
  const real = age();
  el.textContent = String(real);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || real <= 13) return;

  // screen readers just get the number
  el.setAttribute("aria-label", String(real));
  el.textContent = "";
  const seq = jumps(real);
  let i = 0;
  const next = () => {
    const n = seq[i++];
    const span = document.createElement("span");
    span.setAttribute("aria-hidden", "true");
    span.textContent = String(n);
    if (n === real) span.className = "now";
    el.append(span);
    if (n === real) return;
    const [min, max] = seq[i] === real ? [550, 900] : [250, 650];
    timer = window.setTimeout(next, min + Math.random() * (max - min));
  };
  next();
}
