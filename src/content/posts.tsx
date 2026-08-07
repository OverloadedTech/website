import type { ReactNode } from "react";
import { Bars, Sparkline } from "@/components/Chart";

export type Post = {
  slug: string;
  title: string;
  date: string; // ISO
  dateLabel: string;
  summary: string;
  body: () => ReactNode;
};

export const POSTS: Post[] = [
  {
    slug: "bananawiki-1-0-0-internal",
    title: "BananaWiki 1.0.0 (internal)",
    date: "2026-06-04",
    dateLabel: "4 June 2026",
    summary:
      "The first version I'm willing to call 1.0.0. Internal only, but the whole thing finally holds together.",
    body: () => (
      <>
        <p>
          BananaWiki hit <strong>1.0.0</strong> today. Internal release, no signups, no public
          instance yet - but every piece of the thing works at the same time, which has not been
          true for the last four months.
        </p>
        <p>
          Short recap for whoever landed here by accident: BananaWiki is a Flask platform where you
          make your own wiki. Markdown pages, private or public spaces, users with roles, and a
          plugin system that carries the interesting parts - mind maps, Kanban boards, canvas, chat.
        </p>
        <h2>Where it stands</h2>
        <Bars
          caption="Feature surface at 1.0.0 (internal build)"
          data={[
            { label: "plugins shipped", value: 33 },
            { label: "role levels", value: 6 },
            { label: "editor modes", value: 3 },
            { label: "export formats", value: 4 },
          ]}
        />
        <p>
          The plugin count is the number I care about. Everything past the wiki core is a plugin,
          including the boring built-ins, so the core stays small and anything I regret can be
          deleted without surgery.
        </p>
        <Sparkline
          caption="Rough page-render latency over the 1.0.0 cycle (ms, self-measured, one box)"
          labels={["feb", "mar", "apr", "may", "jun"]}
          points={[420, 310, 260, 180, 95]}
        />
        <p>
          Most of that drop is not clever engineering, it&apos;s me removing things I should never
          have written. Caching helped. Deleting three abstraction layers helped more.
        </p>
        <h2>What 1.0.0 does not mean</h2>
        <ul>
          <li>it is not hosted for anyone but me</li>
          <li>it is not open source yet</li>
          <li>it is not stable under people who actively want to break it</li>
        </ul>
        <p>
          It means the version number stops pretending. Next step is putting it somewhere other
          people can reach.
        </p>
      </>
    ),
  },
  {
    slug: "duck-lore",
    title: "The duck, at length",
    date: "2026-08-05",
    dateLabel: "5 August 2026",
    summary:
      "There is a duck on this site. This post was supposed to go up on 9 June. Yikes.",
    body: () => (
      <>
        <p className="small">
          This should have been published on <strong>9 June</strong>. It is 5 August. Nearly two
          months late. Yikes.
        </p>
        <p>
          So. There is a duck in the top bar. She is holding a terminal and she is asking you a
          question. The question is the whole post, really, but people keep emailing me asking what
          she is, so here is the long version.
        </p>
        <h2>The setup</h2>
        <p>
          What you are looking at is not a website in the way you think. It is a kiosk. You have
          seen these: the screen at the mall, the ticket machine at the station, the museum thing
          that&apos;s been showing the same slideshow since 2014. A kiosk is a normal computer with
          one application locked over the top of it so you can only do the one thing.
        </p>
        <p>
          Sometimes the kiosk glitches. The application dies, and for a second you see what was
          underneath the whole time: a desktop, a taskbar, someone&apos;s wallpaper. That moment is
          the best thing about kiosks and I have wanted to build one for years.
        </p>
        <h2>The duck</h2>
        <p>
          The duck is not a mascot. She is not decoration and she is not a joke that ran long. She
          is the one process on this machine that was never supposed to be running, and she is the
          reason you can get out at all. She hands you a terminal. Nobody told her to.
        </p>
        <p>
          A few people have already worked out that you can point that terminal at her. I am not
          going to tell you what happens. I will tell you that it does not work, that it will never
          work, and that trying anyway is the correct instinct and you should absolutely do it.
        </p>
        <p>
          She is immortal, and given what she did for you, that seems fair. Be nice to her. Or
          don&apos;t - she has been fine so far.
        </p>
        <h2>What to actually do</h2>
        <p>
          Open the terminal. Type <code>help</code>. Read it like you would read the help output of
          a program you just installed: skeptically, and then try the thing that looks like it
          shouldn&apos;t be there. Then type <code>lore</code>.
        </p>
        <p>
          A few things are true and I will state them plainly because they are not the puzzle: the
          commands ignore case, they don&apos;t care whether you put <code>sudo</code> in front of
          them, and nothing you do here can permanently break anything. There is a way to wipe
          yourself back to a clean slate if you want to start over. Everything else, go find.
        </p>
        <p className="small">
          If you get somewhere unexpected and it looks broken rather than intentional, that is a
          bug, and I would genuinely like the email.
        </p>
      </>
    ),
  },
  {
    slug: "bananawiki-public",
    title: "BananaWiki is public, and it lives at bananawiki.com",
    date: "2026-07-25",
    dateLabel: "25 July 2026",
    summary:
      "Hosted, independent, and out. Plus: gTTS is gone, Piper is in, and a PCTO that gave me way too much free time.",
    body: () => (
      <>
        <p>
          <strong>BananaWiki is public.</strong> It&apos;s hosted, you can go make an account, and
          it lives at{" "}
          <a href="https://bananawiki.com" target="_blank" rel="noopener noreferrer">
            bananawiki.com
          </a>
          . The old address, bw.lucazani.com, now redirects there - same project, own name, own
          domain.
        </p>
        <p>
          That domain move is the actual news. BananaWiki started as work I did with{" "}
          <strong>Canalescuola</strong>, and after that stretch ended I kept building it on my own.
          It is an independent project now. It is not a subdomain of my personal site anymore
          because it stopped being a personal-site-sized thing.
        </p>
        <h2>What you get today</h2>
        <Bars
          caption="Public launch - what's in the box"
          data={[
            { label: "plugins", value: 33 },
            { label: "role levels", value: 6 },
            { label: "editor modes", value: 3 },
            { label: "export formats", value: 4 },
            { label: "data regions (EU)", value: 1 },
          ]}
        />
        <p>
          Markdown pages, Kanban, canvas, chat, mind maps, per-space permissions, plugins for the
          rest. Free trial, no card, EU-hosted data. A self-hosted build is the obvious next thing
          and I want it - realistically that&apos;s a few months out, and I&apos;d rather say
          &quot;maybe&quot; now than promise a date I&apos;ll quietly miss.
        </p>
        <Sparkline
          caption="Time from signup to a usable wiki (seconds, internal runs)"
          labels={["1.0.0", "1.0.4", "1.1", "public"]}
          points={[95, 62, 40, 18]}
        />
        <h2>The PCTO detour</h2>
        <p>
          My PCTO ran from <strong>8 June to 19 June</strong>. It gave me far more usable hours than
          a normal school stretch does, and I spent almost all of them on this.
        </p>
        <p>
          The biggest thing to come out of it: the TTS pipeline got rewritten. It used to be gTTS,
          which means a network round trip, a Google dependency, and a voice that sounds like a
          voice from 2014. It&apos;s now <strong>Piper</strong>, running locally. Faster, offline,
          no third party in the loop, and it sounds like a person who is at least mildly awake.
        </p>
        <Bars
          caption="TTS: gTTS vs Piper, 400-word page, same machine"
          unit="s"
          data={[
            { label: "gTTS (network)", value: 11 },
            { label: "Piper (local)", value: 3 },
          ]}
        />
        <h2>BananaForms</h2>
        <p>
          For a while there was going to be a second thing. BananaForms: an internal experiment on
          the same codebase, meant to help Canalescuola fill out forms without a human retyping the
          same fields forever. Proof of concept, never really destined for the public.
        </p>
        <p>
          <strong>Update: BananaForms is off.</strong> Not because it didn&apos;t work - the concept
          held up, and I still think it&apos;s a good idea sitting on a good codebase. It&apos;s off
          because splitting attention between two things means shipping neither, and BananaWiki is
          the one with users. Everything goes into BananaWiki instead. If the forms idea comes back
          it comes back as a plugin, which is where it probably belonged from the start.
        </p>
        <p>
          All of this took considerably longer than I said it would. It&apos;s ready now, which is
          the part that counts.
        </p>
        <p>
          <a href="https://bananawiki.com" target="_blank" rel="noopener noreferrer" className="btn">
            go look at it →
          </a>
        </p>
      </>
    ),
  },
  {
    slug: "hello-world",
    title: "Hello World",
    date: "2026-05-28",
    dateLabel: "28 May 2026",
    summary: "The first post.",
    body: () => (
      <>
        <p>This is where I write about what I build.</p>
      </>
    ),
  },
];

export const POSTS_SORTED = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}
