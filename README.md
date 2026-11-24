# lucazani.com

My personal site. It looks like a normal page, but it's a kiosk: the duck in the
top bar hands you a terminal, and from there you can get to the desktop
underneath. Read [the duck post](https://lucazani.com/blog/duck-lore/) before
you go poking through the source, it's more fun that way.

## Running it

```sh
npm install
npm run dev     # builds, watches, serves on http://localhost:4321
npm run build   # production build into dist/
npm run check   # typescript
```

## How it's put together

- `site/layout.html` is the shell every page goes into.
- `site/pages/*.html` are the pages. The bit between the `---` lines at the top
  is the title and description.
- `site/blog/*.md` are the posts, same idea, plus `date` and `summary`. The file
  name is the URL.
- `build.mjs` glues all that together into `dist/` and bundles `src/` with
  esbuild. No framework for the pages, they're just HTML.
- `src/page/` is the small stuff on the pages: the age counter, the CV button,
  the duck on the likes page, and the link handling that swaps pages without a
  reload (so an open terminal survives clicking around).
- `src/os/` is the desktop, windows, terminal and apps, written with Preact. It
  only exists in memory, a reload throws all of it away.

The kiosk and browser windows load the site with `?embed=1`, which keeps the OS
from starting inside itself.

## Deploying

Pushing to `main` runs `.github/workflows/pages.yml`, which builds and publishes
`dist/` to GitHub Pages. In the repo settings, Pages has to be set to
"GitHub Actions" as the source.
