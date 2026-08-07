import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact - Luca Zani" },
      {
        name: "description",
        content:
          "Email is the only contact method that matters. What I want in my inbox, what I don't, and the languages I speak.",
      },
      { property: "og:title", content: "Contact - Luca Zani" },
      { property: "og:description", content: "Just email me." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <Layout back>
      <section>
        <h1>Contact</h1>
        <p>
          <strong>Email:</strong> luca (at) lucazani (dot) com
        </p>
        <p>
          <strong>Matrix:</strong>{" "}
          <a href="https://matrix.to/#/@ovtd:matrix.org" target="_blank" rel="noopener noreferrer">
            @ovtd:matrix.org
          </a>{" "}
          - I can read messages there, but you&apos;ll make me work harder than
          if you just email me.
        </p>
      </section>

      <section>
        <h2>Email me anytime</h2>
        <p>
          Seriously, just email me for anything. Code questions, project ideas, memes, tech
          discussions, or just to say hi. I&apos;m happy to chat.
        </p>
        <p>
          I only listed my email as the only contact method because i think email is the only
          universal and &quot;best&quot; way to communicate online. But if you prefer to reach me
          elsewhere, feel free to look me up under OverloadedTech on socials such as Reddit,
          Telegram, X or LinkedIn (ugh, who uses that, awful!) but i might take a little longer to
          respond
        </p>
        <p>
          Commercial, non-commercial, dumb, whatever. I don&apos;t care about formality.
        </p>
      </section>

      <section>
        <h2>What I want in my inbox</h2>
        <ul className="plain">
          <li>
            <span className="yes">✓</span> questions about my projects, my code, or something I wrote
          </li>
          <li>
            <span className="yes">✓</span> bug reports, including the annoying pedantic ones
          </li>
          <li>
            <span className="yes">✓</span> project ideas, collaborations, &quot;could this be
            built&quot;
          </li>
          <li>
            <span className="yes">✓</span> work: commercial or not, small or not
          </li>
          <li>
            <span className="yes">✓</span> corrections when I&apos;m wrong about something
          </li>
          <li>
            <span className="yes">✓</span> memes, weird links, &quot;hi&quot;
          </li>
          <li>
            <span className="yes">✓</span> legal threats: yes, really. send them straight to me by
            email. I read them, I answer them, and I&apos;d much rather deal with a lawyer in my
            inbox than anywhere else. see the note at the bottom of the projects page - I'd
            much rather you'd shoot me an email than shoot me in real life
          </li>
        </ul>
      </section>

      <section>
        <h2>What I don&apos;t</h2>
        <ul className="plain">
          <li>
            <span className="no">✗</span> spam, and anything intended to be clearly EVIL!!!™
          </li>
          <li>
            <span className="no">✗</span> SEO offers, backlink schemes, &quot;I noticed your
            website...&quot;
          </li>
          <li>
            <span className="no">✗</span> crypto, NFTs, and whatever the current version of that is
          </li>
          <li>
            <span className="no">✗</span> recruiter mail with no role, no company and no salary
          </li>
          <li>
            <span className="no">✗</span> six paragraphs of corporate throat-clearing before the ask
          </li>
        </ul>
      </section>

      <section>
        <h2>Languages</h2>
        <p>I speak Italian, German and English. Any of those three, go ahead.</p>
        <p className="small">
          You can write in another language too, of course - I&apos;ll just have to translate it, and
          errors may happen. Don&apos;t be surprised if I answer something slightly beside the point.
        </p>
      </section>
    </Layout>
  );
}
