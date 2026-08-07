# lucazani.com

Personal site with a small browser-based OS layer (desktop, terminal, kiosk mode).

## What this is

A plain static site. No framework, no build step. Every page is a hand-written
HTML file that loads `styles.css` and `os.js` from the repo root; `os.js` adds the
desktop/terminal/kiosk layer on top of any page.

## Structure

- `index.html`, `projects.html`, `blog.html`, `likes.html`, `contact.html` - the pages
- `posts/*.html` - blog posts (kept in this folder so `web`/`posts/*` can resolve)
- `os.js` - the OS layer (desktop, windows, terminal, kiosk, duck)
- `styles.css` - all styles (site + OS)
- `favicon.png`, `robots.txt`
- `.github/workflows/deploy-pages.yml` - static deploy to GitHub Pages

## Local preview

```sh
python3 -m http.server
```

or any static file server that supports directory traversal.

## Deploy

The GitHub Pages workflow copies the HTML, CSS, JS and posts into a temporary
`dist` folder and uploads it. No build step required.