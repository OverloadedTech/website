# lucazani.com

Personal site with a small browser-based OS layer (desktop, terminal, kiosk mode).

## Development

```sh
bun install
bun run dev
```

## Builds

```sh
bun run build          # standard build
bun run build:pages    # static prerender for a web host (GitHub Pages, Netlify, ...)
bun run build:file     # standalone HTML files you can double-click (no server needed)
bun run serve:pages    # serve dist/client over HTTP locally
```

`build:file` inlines every script, stylesheet and image into each `.html`, and the
router falls back to hash URLs when the page is opened over `file://`.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Settings -> Pages -> Source: **GitHub Actions**.
3. In `.github/workflows/deploy-pages.yml` set `BASE_PATH`:
   - custom domain or `<user>.github.io` repo: `"/"`
   - project site at `https://<user>.github.io/<repo>/`: `"/<repo>/"`
4. Push to `main`. The workflow builds and publishes `dist/client`.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
