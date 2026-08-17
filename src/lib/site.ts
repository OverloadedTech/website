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

/** Site went live on 1 August 2021, when Luca was 13. */
export const SITE_START_AGE = 13;

export function isBirthday(d: Date = new Date()): boolean {
  return d.getMonth() === 7 && d.getDate() === 18;
}

/** 13, 14, 15, ..., real age */
export function ageSequence(real: number): (number | "...")[] {
  const seq: (number | "...")[] = [];
  for (let a = SITE_START_AGE; a < Math.min(real, SITE_START_AGE + 3); a++) seq.push(a);
  if (!seq.includes(real)) {
    seq.push("...");
    seq.push(real);
  }
  return seq;
}

export const DUCK_ASCII = `   __
 <(o )___
  ( ._> /
   \`---'`;
