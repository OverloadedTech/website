// swap pages without a reload so the terminal survives

let onPage = () => {};

export function startNav(callback: () => void) {
  onPage = callback;

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    const a = (e.target as Element).closest("a");
    if (!a || a.target || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    go(url.href);
  });

  addEventListener("popstate", () => {
    if (location.pathname !== shown) load(location.href, false);
  });
}

let shown = location.pathname;

export function go(href: string) {
  return load(new URL(href, location.href).href, true);
}

async function load(href: string, push: boolean) {
  let html: string;
  let finalUrl: URL;
  try {
    const res = await fetch(href);
    html = await res.text();
    finalUrl = new URL(res.url || href);
    finalUrl.hash = new URL(href).hash;
  } catch {
    location.href = href;
    return;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const next = doc.querySelector("#site .page");
  const current = document.querySelector("#site .page");
  if (!next || !current) {
    location.href = href;
    return;
  }

  current.replaceWith(next);
  document.title = doc.title;
  if (push) history.pushState(null, "", finalUrl.href);
  shown = location.pathname;

  const target =
    finalUrl.hash && document.getElementById(decodeURIComponent(finalUrl.hash.slice(1)));
  if (target) target.scrollIntoView();
  else if (push) scrollTo(0, 0);

  onPage();
}
