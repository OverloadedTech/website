export type Page = { name: string; path: string; label: string };

export const PAGES: Page[] = [
  { name: "home", path: "/", label: "lucazani.com" },
  { name: "projects", path: "/projects", label: "projects" },
  { name: "blog", path: "/blog", label: "blog" },
  { name: "likes", path: "/likes", label: "likes" },
  { name: "contact", path: "/contact", label: "contact" },
];

export function pageByName(name: string): Page | undefined {
  return PAGES.find((p) => p.name === name.replace(/^\/+|\.html$/g, "").toLowerCase());
}

export function calcAge(): number {
  const birth = new Date(2008, 7, 18);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/** Site went live on 1 August 2021, a few weeks before Luca turned 13. */
export const SITE_START_AGE = 13;

export function isBirthday(d: Date = new Date()): boolean {
  return d.getMonth() === 7 && d.getDate() === 18;
}

/** Every age from 13 up to the real one: 13, 14, 15, 16, ... */
export function ageSequence(real: number): number[] {
  const seq: number[] = [];
  for (let a = SITE_START_AGE; a <= Math.max(real, SITE_START_AGE); a++) seq.push(a);
  return seq;
}

/**
 * How long to wait before showing the next age. Random, so the count
 * stumbles upward instead of ticking like a clock; the last step waits a
 * little longer so the real age lands on its own beat.
 */
export function ageStepDelay(isLastStep: boolean, random: () => number = Math.random): number {
  const [min, max] = isLastStep ? [550, 900] : [160, 620];
  return Math.round(min + random() * (max - min));
}

export const DUCK_ASCII = `   __
 <(o )___
  ( ._> /
   \`---'`;
