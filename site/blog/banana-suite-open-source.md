---
title: BananaWiki, BananaChat and BananaVibe are open source
date: 2026-09-23
summary: Seven months after the first commit, all three are free software under the AGPL. It's the same code that runs the hosted version, and you can run it yourself.
---
As of today BananaWiki, BananaChat and BananaVibe are free software. The source is on GitHub in the [BananaSuite](https://github.com/BananaSuite) organization, licensed AGPL-3.0, and it's the same code that runs the hosted version.

## How it got here

BananaWiki started on 20 February, just me, because Canalescuola needed a wiki for the Officina Tecnologica project and nothing I could find fit. For months it was an internal thing that kept growing: the plugin system and multi-tenant hosting came in the spring, and in June the FSL gave me two weeks of proper hours, which is where it really sped up. Since then it has been maintained by me and Officina Tecnologica.

Until now the code was internal and only the hosted version ran it. From this release on, the internal version and the public one are the same code. The hosted service keeps running (sometimes it's open to the public, sometimes it isn't), and anyone who wants BananaWiki can run it on their own server instead: one command on a Linux box, or a desktop launcher on Windows, Linux and Apple silicon Macs.

## The other two

**BananaChat** started as BananaAI, back when all I wanted was to self-host AI models instead of sending everything to someone else's servers. It lived inside BananaWiki for a while and then moved out, because nobody should need a wiki installed to get a chat window. Now it's a small, separate way to show people what a local model can do.

**BananaVibe** (first called BananaAgent) is how I try features quickly and keep up with maintenance. A maintainer starts it from an issue, it works on its own branch, runs the checks and opens a draft pull request. Nothing gets merged until I've read it.

## What changed on the way out

The public launch in July had 33 plugins. The open source release has 19, so fourteen didn't make it. Most were experiments or in-jokes, one only did anything if you had a Telegram bot configured, and one handed out beta tester perks that were never wired up. What's left is what I'd actually want someone else to run.

The old "free but non-commercial" rule is gone too. It's AGPL now: use it for whatever you like, commercial included. If you share it, or run a modified version for other people over a network, they get the source under the same license.

## Why each repo has one commit

If you go look, every repository starts at a single commit. The real history is a bit over three thousand commits for BananaWiki alone, and plenty of it has deployment credentials and infrastructure notes that were never meant for anyone else. I don't trust myself to scrub all of that reliably, so the public repos start from a clean export. The NOTICE file in each one keeps the original start date and first commit.

Bug reports, pull requests and "this doesn't work on my machine" emails are all welcome.

[source on GitHub](https://github.com/BananaSuite) &middot; [bananawiki.com](https://bananawiki.com)
