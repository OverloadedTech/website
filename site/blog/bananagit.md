---
title: BananaGit, and what we're working on next
date: 2026-11-24
summary: We moved from Forgejo to BananaGit, our own fork of Gitea. Also, BananaWiki Hosting accounts now work as a login for BananaChat, which is free to try, and TrentinoTranslate is back on the list.
---
Another BananaSuite project: [BananaGit](https://github.com/BananaSuite/BananaGit). It's a self-hosted Git service (repositories, code review, issues, wiki, packages and CI/CD), and it's what Officina Tecnologica runs at [git.officinatecnologica.eu](https://git.officinatecnologica.eu).

We used to run [Forgejo](https://forgejo.org). For legal reasons BananaGit had to be based on [Gitea](https://about.gitea.com) and not on Forgejo, so it's a Gitea fork, and we moved our instance from Forgejo over to it. If you're on Forgejo too, the docs have a tested in-place migration. It's one-way, so rehearse it on a copy first.

It's a deliberately small fork. Apart from a short list of changes it is Gitea: same features, same database, same `app.ini` and API, and Gitea's documentation applies as it is. What we changed:

- the BananaSuite look: three themes in our colours (`bananagit-auto` is the default) and the banana I drew as logo, favicon and default avatar
- an updater, `bananagit-update`, that checks a signed release, makes a backup, switches to the new version, checks that it's healthy and rolls back if it isn't. Automatic updates are there too, but they're off until you turn them on
- version numbers like `v1.27.3.1`, which is Gitea's version plus our own counter

If you're coming from Gitea you just swap the binary, the data stays where it is.

Keeping up with Gitea doesn't need anyone to write code. A workflow pulls in the newest Gitea patch release every day, builds it and opens a pull request. Files we replace completely are skipped during the sync, so a conflict can only come from the few lines we change inside Gitea's own files. Right now it's based on Gitea 1.27.3.

It's MIT like Gitea, and it says "Powered by Gitea" wherever Gitea does. It isn't an official Gitea project and isn't endorsed by them, it's our build of it.

Release binaries are for Linux on amd64 and arm64 and are meant to run with PostgreSQL. The [README](https://github.com/BananaSuite/BananaGit#readme) has the full install steps for a server with systemd, plus a quickstart if you only want to try it on your own machine.

## Our instance

Our BananaGit is kept internal, so there's no sign up. The public projects on it are open to everyone though, so feel free to look around and [let us know what you think](/contact/). If you'd like to contribute to someone's project there, ask and we can give you access.

The BananaSuite repos are mirrored there too, but we don't accept contributions from the mirror. Issues and pull requests for BananaSuite go to [GitHub](https://github.com/BananaSuite).

## Try the hosted version

If you want to try everything without installing anything, sign up at [hosting.bananawiki.com](https://hosting.bananawiki.com). That's the managed version of the suite: you can create wikis there if you want, and the same account gets you into BananaChat through our OAuth. BananaChat is free for now. Whether it stays free depends on demand.

## What's cooking

OAuth is the newest piece and we're still building on it. The idea is that a BananaWiki Hosting account works as the login for everything in the suite. BananaChat already uses it, and BananaGit has a "Sign in with BananaWiki" provider ready for it.

TrentinoTranslate is back on the list too. It got shelved in June 2023 because the dictionary-and-rules approach fell apart on real sentences ([the full story is on the projects page](/projects/#trentinotranslate)). This time the plan is to do it properly, with native speakers adding and reviewing translations and a real dataset behind it, using what I learned building BananaWiki.

There's more in progress that isn't ready to talk about yet. I'll write about it when it is.
