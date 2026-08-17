import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { AgeCounter } from "@/components/AgeCounter";
import { Confetti } from "@/components/Confetti";
import { BirthdayNote } from "@/components/BirthdayNote";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Luca Zani - developer from Bolzano" },
      {
        name: "description",
        content:
          "Backend-focused developer from Bolzano, Italy. BananaWiki, Wicked Agent, and a pile of experiments that never made it out.",
      },
      { property: "og:title", content: "Luca Zani - developer from Bolzano" },
      {
        property: "og:description",
        content: "Backend-focused developer from Bolzano. I write code, solder, 3D print.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Layout>
      <Confetti />
      <section>
        <h1>Luca Zani</h1>
        <BirthdayNote />
        <p>
          <AgeCounter /> y/o developer from Bolzano, Italy. Backend-focused but full-stack when needed.
          I write code, solder, 3D print, and build cool things.
        </p>
        <p className="small">(yes, the age is auto updated, check it out on 18 August midnight)</p>
        <p>
          Feel free to <Link to="/contact">reach out anytime</Link>
        </p>
      </section>

      <section>
        <h2>What I&apos;m Building</h2>

        <div className="project">
          <h3>BananaWiki (2026)</h3>
          <p>
            A private wiki platform: Markdown pages with history, Kanban boards, Canvas diagrams,
            built-in chat and 33 toggleable plugins. Multi-tenant hosting, EU data, free and
            non-commercial. Independent project living at{" "}
            <a href="https://bananawiki.com" target="_blank" rel="noopener noreferrer">
              bananawiki.com
            </a>
            .
          </p>

          <Link to="/projects" hash="bananawiki" className="btn">
            read more →
          </Link>
        </div>

        <div className="project">
          <h3>Wicked Agent</h3>
          <p>
            Open-source, asynchronous coding agent you can host on your own VPS. Inspired by Devin
            AI.
          </p>
          <Link to="/projects" hash="wicked-agent" className="btn">
            read more →
          </Link>
        </div>

        <div className="project">
          <h3>Unnamed Engine</h3>
          <p>A game engine experiment. Still learning, still exploring.</p>
          <Link to="/projects" hash="unnamed-engine" className="btn">
            read more →
          </Link>
        </div>

        <div className="project">
          <h3>TrentinoTranslate</h3>
          <p>
            A proof of concept translator for the Trentino dialect. Abandoned in June 2023, now
            getting rebuilt.
          </p>
          <Link to="/projects" hash="trentinotranslate" className="btn">
            read more →
          </Link>
        </div>
      </section>

      <section>
        <h2>A Note on the Rest</h2>
        <p>
          90-95% of what I build is an experiment. Simple or complex, most of it ends up archived or
          deleted internally, because I only publish work I consider pseudo-significant. Sorry about
          that - it&apos;s something I&apos;m trying to get better at.
        </p>
      </section>

      <section>
        <h2>Older Projects</h2>
        <ul>
          <li>
            <Link to="/projects" hash="emulators">
              Various Emulators for Teachers
            </Link>{" "}
            (Sep-Dec 2025) - 3D mechanical simulators for school
          </li>
          <li>
            <Link to="/projects" hash="redditzilla">
              Redditzilla
            </Link>{" "}
            (2025) - Automated Reddit video generator
          </li>
          <li>
            <Link to="/projects" hash="empty-character">
              Empty Character
            </Link>{" "}
            (2021) - Empty character app on the Play Store
          </li>
          <li>
            <Link to="/projects" hash="phone-credit">
              Phone Credit App
            </Link>{" "}
            (2020) - Unofficial carrier client that hit ~26k installs
          </li>
        </ul>
      </section>

      <section>
        <h2>Various Links</h2>
        <ul>
          <li>
            <a href="https://bananawiki.com" target="_blank" rel="noopener noreferrer">
              BananaWiki
            </a>
          </li>
          <li>
            <a href="https://emptycharacterapp.web.app" target="_blank" rel="noopener noreferrer">
              Empty Character Site
            </a>
          </li>
          <li>
            <a
              href="https://linkedin.com/in/OverloadedTech"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn (You don&apos;t want to go there, right?)
            </a>
          </li>
          <li>
            <a href="https://reddit.com/u/OverloadedTech" target="_blank" rel="noopener noreferrer">
              Reddit
            </a>
          </li>
          <li>
            <Link to="/likes">Things I like</Link>
          </li>
          <li>
            <Link to="/contact">Contact Me</Link>
          </li>
        </ul>
      </section>
    </Layout>
  );
}
