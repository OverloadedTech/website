---
title: BananaWiki is public, and it lives at bananawiki.com
date: 2026-07-25
summary: It's hosted, it has its own domain, and you can sign up. Also gTTS is gone, Piper is in, and the FSL gave me way too much free time.
---
**BananaWiki is public.** It's hosted, you can go make an account, and it lives at [bananawiki.com](https://bananawiki.com). The old address, bw.lucazani.com, now redirects there. It's the same project, it just got its own name and its own domain.

I started BananaWiki on my own back in February, because Canalescuola needed a wiki for the Officina Tecnologica project, and it has been growing ever since. It's not a subdomain of my personal site anymore because it stopped being a personal-site-sized thing.

## What you get today

Markdown pages, Kanban, canvas, chat, mind maps, per-space permissions, and plugins for the rest (33 of them right now, plus 6 role levels, 3 editor modes and 4 export formats). Free trial, no card, data hosted in the EU. Going from signup to a usable wiki took 95 seconds back at 1.0.0 and takes about 18 now, in my own runs.

A self-hosted build is the obvious next thing and I want it. Realistically that's a few months out, and I'd rather say "maybe" now than promise a date I'll quietly miss.

<p class="small">Update, September 2026: it happened. BananaWiki is open source and you can run it yourself. <a href="/blog/banana-suite-open-source/">Here's the announcement.</a></p>

## The FSL detour

My FSL ran from 8 June to 19 June. It gave me far more usable hours than a normal school stretch does, and I spent almost all of them on this.

The biggest thing to come out of it was the rewritten TTS pipeline. It used to be gTTS, which meant a network round trip, a dependency on Google and a voice straight out of 2014. Now it's Piper, running locally: faster, works offline, no third party involved, and it sounds like a person who is at least mildly awake. On a 400-word page on the same machine, gTTS took about 11 seconds and Piper takes about 3.

## BananaForms

For a while there was going to be a second thing, BananaForms: an internal experiment on the same codebase, meant to help Canalescuola fill out forms without someone retyping the same fields forever. A proof of concept, never really meant for the public.

**Update: BananaForms is off.** The concept held up and I still think it's a good idea. It's off because splitting my time between two things means shipping neither, and BananaWiki is the one with users. If the forms idea comes back, it comes back as a plugin, which is probably where it belonged from the start.

All of this took a lot longer than I said it would. But it's ready now: [go look at it](https://bananawiki.com).
