---
title: BananaWiki 1.0.0 (internal)
date: 2026-06-04
summary: The first version I'm willing to call 1.0.0. Internal only, but the whole thing finally holds together.
---
BananaWiki hit 1.0.0 today. It's an internal release: no signups, no public instance yet. But every piece of it works at the same time, which has not been true for the last four months.

Short recap for whoever landed here by accident: BananaWiki is a Flask platform where you make your own wiki. Markdown pages, private or public spaces, users with roles, and a plugin system that carries the interesting parts: mind maps, Kanban boards, canvas, chat.

## Where it stands

32 plugins, 6 role levels, 3 editor modes and 4 export formats.

The plugin count is the number I care about. Everything past the wiki core is a plugin, including the boring built-ins, so the core stays small and anything I regret can be deleted without surgery.

Page render time over the 1.0.0 cycle, measured by me on one box (so take it with a grain of salt): about 420 ms in February, 310 in March, 260 in April, 180 in May and 95 now. Most of that drop is me removing things I should never have written. Caching helped a bit, deleting three abstraction layers helped a lot more.

## What 1.0.0 does not mean

- it only runs internally, for the Officina
- it is not open source yet
- it is not stable under people who actively want to break it

It just means I stopped pretending it's a 0.x. Next step is putting it somewhere other people can reach.

<p class="small">Update, September 2026: it is open source now. <a href="/blog/banana-suite-open-source/">Here's the post.</a></p>
