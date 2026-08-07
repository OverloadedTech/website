import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { requestTerminal } from "@/os/actions";
import { getState, useOs } from "@/os/store";

export const Route = createFileRoute("/likes")({
  head: () => ({
    meta: [
      { title: "Likes - Luca Zani" },
      {
        name: "description",
        content:
          "Things I like: machines that work, open software, doubting everything, a docked Steam Deck and private money.",
      },
      { property: "og:title", content: "Likes - Luca Zani" },
      {
        property: "og:description",
        content: "Tech, setup, private money. Facts about me, without the biography.",

      },
    ],
  }),
  component: Likes,
});

const SAYINGS = [
  "quack.",
  "quack quack.",
  "bread, please.",
  "that tickles.",
  "again?",
  "ok, last one.",
];

type Piece = {
  id: number;
  x: number;
  y: number;
  dx: string;
  dy: string;
  fall: string;
  rot: string;
  char: string;
  color: string;
  size: number;
  delay: number;
  dur: number;
};

type Blast = { id: number; x: number; y: number };

function Likes() {
  const [bubble, setBubble] = useState<string | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [blasts, setBlasts] = useState<Blast[]>([]);
  const [poked, setPoked] = useState(0);
  const [flying, setFlying] = useState(false);
  const [flown, setFlown] = useState(false);
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const quack = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ox = rect.left + rect.width / 2;
    const oy = rect.top + rect.height / 2;
    // monospace glyphs + theme tokens, so the burst reads as a terminal
    // fragmenting instead of a rainbow
    const glyphs = [
      "*", "+", "/", "\\", "#", ">", "<", "=", "|", "~", "^",
      "0", "1", "{", "}", "[", "]", ":", ";", "%", "&", "$",
    ];
    const colors = [
      "var(--accent)", "var(--link)", "var(--fg-strong)",
      "var(--muted)", "var(--accent-dim)", "var(--term-ok)",
    ];

    const count = 54;
    const batch: Piece[] = Array.from({ length: count }, (_, i) => {
      seq.current += 1;
      // even angular spread with jitter, so it reads as a burst and not a spray
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.35;
      const power = 90 + Math.random() * 190;
      return {
        id: seq.current,
        x: ox,
        y: oy,
        dx: `${Math.round(Math.cos(angle) * power)}px`,
        dy: `${Math.round(Math.sin(angle) * power * 0.75)}px`,
        fall: `${Math.round(160 + Math.random() * 320)}px`,
        rot: `${Math.round(Math.random() * 1080 - 540)}deg`,
        char: glyphs[Math.floor(Math.random() * glyphs.length)] as string,
        color: colors[Math.floor(Math.random() * colors.length)] as string,
        size: 11 + Math.round(Math.random() * 15),
        delay: Math.random() * 0.06,
        dur: 1.1 + Math.random() * 0.9,
      };
    });

    seq.current += 1;
    const blast: Blast = { id: seq.current, x: ox, y: oy };

    setPieces((p) => [...p, ...batch]);
    setBlasts((b) => [...b, blast]);
    setPoked((n) => n + 1);
    setBubble(SAYINGS[Math.floor(Math.random() * SAYINGS.length)] ?? "quack.");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setBubble(null), 3200);

    const ids = new Set(batch.map((b) => b.id));
    setTimeout(() => setPieces((p) => p.filter((x) => !ids.has(x.id))), 2200);
    setTimeout(() => setBlasts((b) => b.filter((x) => x.id !== blast.id)), 700);

    // the duck takes off, vanishes, and hands you a terminal
    setFlying(true);
    setTimeout(() => {
      setFlown(true);
      setBubble(null);
      requestTerminal();
      // no terminal appeared (mobile warning, etc): bring the duck straight back
      setTimeout(() => {
        if (!getState().windows.some((w) => w.app === "terminal")) {
          setFlying(false);
          setFlown(false);
        }
      }, 400);
    }, 950);
  }, []);

  // the duck waddles back in as soon as its terminal is gone
  const hasTerminal = useOs((s) => s.windows.some((w) => w.app === "terminal"));
  useEffect(() => {
    if (!hasTerminal) {
      setFlying(false);
      setFlown(false);
    }
  }, [hasTerminal]);



  return (
    <Layout back>
      <section>
        <h1>Likes</h1>
        <p>
          Things I like, at roughly the level of detail a stranger should get. No biography, no
          &quot;my journey&quot;.
        </p>
      </section>

      <section>
        <h2>Tech</h2>
        <p>
          I like technology that works well. I praise the machine and I praise automation - what I
          don&apos;t like is AI taking executive decisions instead of humans. IBM put it better than
          I can, back in 1979:{" "}
          <strong>
            &quot;A computer can never be held accountable, therefore a computer must never make a
            management decision.&quot;
          </strong>{" "}
          That slide is older than most people currently ignoring it.
        </p>
        <p>
          I like and support open software. Directly, not as an aesthetic - orgs like the{" "}
          <a href="https://www.fsf.org/" target="_blank" rel="noopener noreferrer">
            FSF
          </a>{" "}
          and the{" "}
          <a href="https://www.eff.org/" target="_blank" rel="noopener noreferrer">
            EFF
          </a>{" "}
          do work that matters and they should be supported by people who benefit from it.
        </p>
        <p>
          I doubt everything as a principle. Governments, secret services, companies, other people -
          and my own things too, including the ones where doubting is against my interests. Talking
          is cheap. Facts are the real thing.
        </p>
      </section>

      <section>
        <h2>Setup</h2>
        <ul>
          <li>
            <strong>Phone</strong> - Nothing Phone (3a)
          </li>
          <li>
            <strong>Laptop</strong> - MacBook Air M4
          </li>
          <li>
            <strong>Desktop</strong> - a docked Steam Deck
          </li>
        </ul>
        <p className="small">
          Yes, a Steam Deck. It sits in a dock, it runs SteamOS, and it does software development
          perfectly well. And gaming, obviously. It&apos;s a Linux box with a handle.
        </p>
      </section>


      <section>
        <h2>Private money</h2>
        <p>
          I like tools that let people exchange and store value without
          surveillance or permission. Monero, in particular: real digital
          cash without surveillance or gatekeepers.
        </p>
      </section>

      <div className="duck-zone">
        {!flown && (
          <button
            onClick={quack}
            aria-label="poke the duck"
            className={`duck-poke${flying ? " flying" : ""}`}
            id="duck-button"
          >
            <span key={poked} className="duck-emoji" role="img" aria-hidden>
              🦆
            </span>
          </button>
        )}
        {bubble && <div className="bubble">{bubble}</div>}
        <span className="duck-hint">
          What is this? When will I stop putting random stuff everywhere?
        </span>
      </div>


      {(pieces.length > 0 || blasts.length > 0) && (
        <div className="confetti" aria-hidden>
          {blasts.map((b) => (
            <span key={b.id} className="shock" style={{ left: b.x, top: b.y }} />
          ))}
          {pieces.map((p) => (
            <i
              key={p.id}
              style={{
                left: p.x,
                top: p.y,
                color: p.color,
                fontSize: `${p.size}px`,
                animationDuration: `${p.dur}s`,
                animationDelay: `${p.delay}s`,
                ["--dx" as string]: p.dx,
                ["--dy" as string]: p.dy,
                ["--fall" as string]: p.fall,
                ["--rot" as string]: p.rot,
              }}
            >
              {p.char}
            </i>
          ))}
        </div>
      )}

    </Layout>
  );
}
