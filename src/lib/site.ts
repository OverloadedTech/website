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

export const DUCK_ASCII = `   __
 <(o )___
  ( ._> /
   \`---'`;
