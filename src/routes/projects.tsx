import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects - Luca Zani" },
      {
        name: "description",
        content:
          "BananaWiki, Wicked Agent, an unnamed game engine, and the older stuff: emulators, Redditzilla, Empty Character, a carrier app with 26k installs.",
      },
      { property: "og:title", content: "Projects - Luca Zani" },
      {
        property: "og:description",
        content: "The longer version of what I'm working on and have built over the years.",
      },
    ],
  }),
  component: Projects,
});

function Projects() {
  return (
    <Layout back>
      <section>
        <h1>Projects</h1>
        <p>The longer version of what I&apos;m working on and have built over the years.</p>
        <p className="small">
          Fair warning: 90-95% of what I build never appears on this page. Most of it is an
          experiment, and most experiments get archived or deleted because I only publish work
          I&apos;d call pseudo-significant. I know that&apos;s a bad habit. I&apos;m working on it.
        </p>
      </section>

      <section id="opensource">
        <h2>Open Source</h2>
        <p>
          In the last months, i didn&apos;t contribute much to open source projects, sadly :(. Yet i
          kept learning and building new things
        </p>
        <p>
          Most of my work these days is on private repos, especially for: High School things, jobs
          for other places i come by and also personal projects that are just stubs or aren&apos;t
          yet useful to be published (i know it might sound dumb). The public repos you see on my
          GitHub are mostly older projects and experiments i built years ago (2020ish-2024)
        </p>
        <p>I&apos;d like to come back and help with FOSS as soon as i can once i get a bit of free time.</p>
      </section>

      <section id="bananawiki">
        <h2>BananaWiki (2026)</h2>
        <p>
          BananaWiki is both an open technology project and a managed hosting platform. It started
          in February 2026 as a small Flask and SQLite app: a private wiki a small team could
          actually run without maintaining a stack or paying for four different SaaS products.
        </p>
        <p>
          At its centre is a private wiki with a Markdown editor and live preview, categories,
          permissions, drafts, file uploads and full revision history. Around it there are Kanban
          boards with priorities, assignees, due dates and attachments, Canvas diagrams that link
          nodes to pages, images, videos and external URLs, built-in chat with DMs and channels,
          and 33 plugins (assessments, badges, video meetings, text-to-speech, CAD viewer, AI
          assistant and more) that can be toggled without restarting anything.
        </p>
        <p>
          By April 2026 the editor, auth, history and admin tools had grown into a real platform
          with the plugin system, boards and canvas. In May the multi-tenant hosting launched, so
          you can spin up an isolated wiki in seconds, and a full Italian interface followed. June
          brought owner controls, Easy Wiki mode, developer tools, operational safeguards and an
          automated test suite. In July it moved to bananawiki.com with a redesigned public site,
          hosting portal and proper legal documentation.
        </p>
        <p>
          It runs at{" "}
          <a href="https://hosting.bananawiki.com" target="_blank" rel="noopener noreferrer">
            hosting.bananawiki.com
          </a>{" "}
          with isolated environments per wiki, operational backups and EU data storage. Private by
          default: anonymous access and higher-risk features need deliberate approval. No ads, no
          data selling, no tracking business model. BananaWiki is{" "}
          <strong>free and non-commercial</strong> for personal, educational and team use;
          commercial use needs prior arrangement. A self-hosted deployment path is the plan.
        </p>
        <p>
          It started as a PCTO (School-Work Program) with Canalescuola, who provided the framework
          and the opportunity, and we still collaborate on BananaAI, a sovereign local AI platform
          for internal use. Dino Michele Barone contributes ideas, feature plans and testing, and
          donated the VPS hosting from 25 February to 10 July 2026 that carried the project through
          its early development. After the PCTO ended,{" "}
          <strong>BananaWiki became independent</strong> and lives at{" "}
          <a href="https://bananawiki.com" target="_blank" rel="noopener noreferrer">
            bananawiki.com
          </a>{" "}
          (the old bw.lucazani.com redirects there).
        </p>
        <p>
          <a
            href="https://bananawiki.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            visit BananaWiki →
          </a>
        </p>
      </section>


      <section id="wicked-agent">
        <h2>Wicked Agent</h2>
        <p>
          Inspired by Devin AI, i wanted to build an open source, cloud based (hostable on a VPS
          server) coding agent that used a custom or local LLM on the server (Ollama or any
          OpenAI-compatible API) and worked with an asynchronous design, you could assign it a task,
          close the site, come back some time later and get the result.
        </p>
        <p>
          I started researching because i really like{" "}
          <a href="https://opencode.ai/" target="_blank" rel="noopener noreferrer">
            OpenCode
          </a>{" "}
          but it has the minor downside of requiring your device to always be on and the major
          downside that sometimes it stops without actually finishing its assigned task. Devin solves
          that issue but it remains a paid tool with very tight usage limits, the idea is to be as
          open as OpenCode but as dynamic and functional as Devin. Hence Wicked Agent (because yes,
          it&apos;s wicked, it&apos;s evil!)
        </p>
        <p>
          It will be released as an experiment in the coming months as soon as i can figure out a few
          things and i get more time to work on it
        </p>
      </section>

      <section id="unnamed-engine">
        <h2>Unnamed Engine</h2>
        <p>
          I&apos;ve always been obsessed, at least since 2019-2020 about game engines and how games
          work, i never worked on any serious game i published. At the time i didn&apos;t and likely
          still today don&apos;t have the capabilities to work on 3D graphics, OpenGL takes time to
          learn and i never started.
        </p>
        <p>
          (Yes, i did create a few simple games in the last months or a basic rendering system but it
          takes more time to master and actually create something meaningful. There are tons of
          better developers out there in this field)
        </p>
        <p>
          Maybe in future i might build a very simple concept of a game engine, nothing too crazy,
          maybe 2D, maybe 3D but only time will tell
        </p>
      </section>


      <section>
        <h2>Older Projects</h2>
        <h3 id="emulators">Various Emulators for Teachers (Sep-Dec 2025)</h3>
        <p>
          At school, i worked internally for a while on building a small web-based 3D simulator for
          mechanical events such as Material Twisting, Material Bending, Shearing, Stretching, etc...
          After all, i&apos;m in a Mechatronics High School
        </p>
        <h3 id="redditzilla">Redditzilla (2025)</h3>
        <p>
          This was a project for a friend that ended up getting abandoned by both of us. He started
          creating videos that were Reddit posts with comments scrolling by (telling some kind of
          &quot;story&quot;) with at the same time a generic video in the background (eg: Minecraft
          Parkour), a lo-fi music track and a TTS voice reading what was going on
        </p>
        <p>
          The tool worked well, i let it run on a VPS for a night to generate around 300 videos. We
          published none though, as this was just an experiment and we decided to stop at that point
          without the need of polluting the already polluted web
        </p>
        <p>
          I was mainly inspired by{" "}
          <a
            href="https://github.com/elebumm/RedditVideoMakerBot"
            target="_blank"
            rel="noopener noreferrer"
          >
            this tool
          </a>{" "}
          that i personally still think is really cool as a concept but don&apos;t expect to print
          millions with it. For that you can try something like getting a job or something
        </p>
        <h3 id="trentinotranslate">TrentinoTranslate (2023, rebuilding)</h3>
        <p>
          TrentinoTranslate was a proof of concept translator for the Trentino dialect, one of those
          local languages that basically no translation service supports because there&apos;s barely
          any usable corpus for it and half of it changes from valley to valley.
        </p>
        <p>
          I started it internally and it went up abandoned in June 2023. The idea was there, the
          execution wasn&apos;t: i was mapping words with a dictionary approach and a pile of rules,
          which works for single terms and falls apart the moment you feed it a real sentence. I
          didn&apos;t have the experience or the tooling to do it properly, so it quietly died.
        </p>
        <p>
          Now that i&apos;ve built and shipped{" "}
          <Link to="/projects" hash="bananawiki">
            BananaWiki
          </Link>{" "}
          i have a much better idea of how to structure something like this: a real contribution
          layer where native speakers submit and review translations, versioned entries, variant
          tagging per zone, and a proper dataset i can actually build a model on top of instead of
          hardcoding rules.
        </p>
        <p>
          So it&apos;s coming back. No date, no promises, but this one i actually want to finish.
        </p>
        <h3 id="empty-character">Empty Character (2021)</h3>
        <p>
          A basic empty character app I published in 2021 by using a modified version of the AI2 App
          Engine. Nothing too big but i took care of it. I rewrote the engine in 2023 (basic) and
          wrote a bit about its story. You can find it on its{" "}
          <a href="https://emptycharacterapp.web.app/" target="_blank" rel="noopener noreferrer">
            dedicated site (maybe a bit too much for an app like this but okay)
          </a>{" "}
          and on the{" "}
          <a
            href="https://play.google.com/store/apps/details?id=com.empty.character"
            target="_blank"
            rel="noopener noreferrer"
          >
            Play Store
          </a>
          .
        </p>
        <p>
          The project is open source and free. Due to its basic nature, it&apos;s maintained by me
          but hasn&apos;t been updated since 2024.
        </p>
        <h3 id="phone-credit">Phone Credit App (2020)</h3>
        <p>
          I&apos;ll try not to go too much into detail here as this project operated in a gray zone
          but, in 2020, a well known phone provider that came to Italy in 2018 didn&apos;t have an
          app (as of 2026 they did finally create one in 2025)
        </p>
        <p>
          I built an unofficial alternative client app that auto-authenticated users on the site by
          detecting if they were using the SIM card, i had a Google Play Developer Account and
          decided to publish it
        </p>
        <p>
          The app was actually pretty simple, as it allowed users to check their credit balance and
          other basic information such as data usage or call count.
        </p>
        <p>
          The application was launched on 12 April 2020 (mostly sure) and it grew in the following
          weeks and months at an impressive rate. In May 2020 it reached its peak at around 26,000
          total installs (unique installs probably) and around 2,000 daily users.
        </p>
        <p>
          It&apos;s still a mystery to me why there were so many installs but so few daily users but
          you must understand that i was far from surprised at the time (i was almost 12), also the
          fact that i received around 30 reviews per day (almost all positive) was amazing to me at
          the time.
        </p>
        <p>
          The story ended in August 2020 after Google updated the policy regarding linking third
          party sites in apps and that led to the app being delisted. It yet remains a fun story i
          like to remember and this is what brought me to the tech i&apos;m building today
        </p>
        <h4>
          A note to those in power: If the fact that this last story is here bothers you, I&apos;d
          much rather <Link to="/contact">you&apos;d shoot me an email</Link> rather than shoot me in
          real life. Thanks! (Also next time learn a thing or two about this thing called Freedom of
          Expression)
        </h4>
        <p>
          Before the Credit App i did do small experiments such as VBS scripts on Windows that
          optimized the user&apos;s computer by for example purging temp files but at the time i was
          too inexperienced to build anything meaningful
        </p>
        <p>
          During the pandemic i tried developing simple games and i had a nice time doing it, however
          nothing was published
        </p>
      </section>
    </Layout>
  );
}
