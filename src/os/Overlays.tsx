import { useEffect, useRef, useState } from "react";
import { DUCK_ASCII, calcAge } from "@/lib/site";
import { logoutReset, sessionIsDirty, setState, useOs } from "./store";
import { requestTerminal } from "./actions";


/* -------- BSOD after killing networking -------- */

export function Bsod() {
  const bsod = useOs((s) => s.bsod);
  const [count, setCount] = useState(10);

  useEffect(() => {
    if (!bsod) return;
    setCount(10);
    const t = setInterval(() => setCount((c) => c - 1), 1000);
    const done = setTimeout(() => logoutReset(), 10500);
    return () => {
      clearInterval(t);
      clearTimeout(done);
    };
  }, [bsod]);

  if (!bsod) return null;

  return (
    <div className="overlay-full">
      <div className="bsod">
        <h2>:( the host lost its network</h2>
        <p>
          networking.service was stopped by user <strong>guest</strong>. everything this machine
          shows arrives over that unit, so there is nothing left to show.
        </p>
        <p>
          the machine will be reimaged in <strong>{Math.max(count, 0)}</strong> seconds. the guest
          session will not survive it.
        </p>
        <p style={{ marginTop: 14, opacity: 0.7 }}>STOP CODE: DUCK_WAS_RIGHT</p>
        <button className="mini-btn" style={{ marginTop: 16 }} onClick={() => logoutReset()}>
          reimage now
        </button>
      </div>
    </div>
  );
}

/* -------- unkillable duck -------- */

const TAUNTS = [
  "kill: (1) - Operation not permitted",
  "duck.service: main process exited, code=exited, status=0/SUCCESS",
  "duck.service: scheduled restart job, restart counter is at 2.",
  "duck.service: start request repeated too quickly, ignoring.",
  "duck.service: respawned as PID 1 (again)",
  "duck.service: watchdog reset, health nominal",
  "duck.service: quacked at the scheduler, priority raised",
  "duck.service: still running.",
];

const WEAPONS = [
  { cmd: "kill -9 1", dmg: 18, log: "sending SIGKILL to PID 1" },
  { cmd: "systemctl stop", dmg: 26, log: "requesting unit stop via dbus" },
  { cmd: "rm -rf /duck", dmg: 34, log: "unlinking /usr/lib/systemd/system/duck.service" },
  { cmd: "unplug the rack", dmg: 55, log: "cutting power to rack A3" },
];

export function DuckFight() {
  const on = useOs((s) => s.duckFight);
  const [hits, setHits] = useState(0);
  const [hp, setHp] = useState(100);
  const [hurt, setHurt] = useState(false);
  const [friend, setFriend] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, r: 0 });
  const [log, setLog] = useState<string[]>(["duck.service: active (running) since boot"]);

  useEffect(() => {
    if (!on) return;
    setHits(0);
    setHp(100);
    setFriend(false);
    setPos({ x: 0, y: 0, r: 0 });
    setLog(["duck.service: active (running) since boot"]);
  }, [on]);

  // it heals. always.
  useEffect(() => {
    if (!on || friend) return;
    const t = setInterval(() => setHp((v) => Math.min(100, v + 7)), 380);
    return () => clearInterval(t);
  }, [on, friend]);

  // it waddles around so you cannot even aim at it.
  useEffect(() => {
    if (!on || friend) return;
    const t = setInterval(() => {
      setPos({
        x: (Math.random() - 0.5) * 2 * 34,
        y: (Math.random() - 0.5) * 2 * 16,
        r: (Math.random() - 0.5) * 2 * 10,
      });
    }, 900);
    return () => clearInterval(t);
  }, [on, friend]);

  if (!on) return null;

  const duckStyle = {
    transform: `translate3d(${pos.x}vw, ${pos.y}vh, 0) rotate(${pos.r}deg)`,
  } as React.CSSProperties;

  if (friend) {
    return (
      <div className="duckfight is-friend">
        <pre className="duck-big duck-friend">{DUCK_ASCII}</pre>
        <p style={{ position: "relative", maxWidth: "46ch" }}>
          she takes the bread. no hurry, no grudge.
        </p>
        <p className="small" style={{ position: "relative", opacity: 0.85, maxWidth: "52ch" }}>
          she is the one who opened the door out of the kiosk in the first place. a fair
          trade: a slice of bread for an escape route. duck.service stays up, and you two
          are friends now.
        </p>
        <button
          className="mini-btn"
          style={{ position: "relative" }}
          onClick={() => setState({ duckFight: false })}
        >
          go back, on good terms
        </button>
      </div>
    );
  }

  const strike = (w: (typeof WEAPONS)[number]) => {
    const n = hits + 1;
    setHits(n);
    setHurt(true);
    setTimeout(() => setHurt(false), 220);
    setPos({
      x: (Math.random() - 0.5) * 2 * 34,
      y: (Math.random() - 0.5) * 2 * 16,
      r: (Math.random() - 0.5) * 2 * 14,
    });
    setHp((v) => {
      const next = Math.max(1, v - w.dmg);
      return next;
    });
    setLog((l) =>
      [...l, `$ ${w.cmd}`, w.log, TAUNTS[n % TAUNTS.length]!].slice(-9),
    );
  };

  return (
    <>
      <div className="crack" />
      <div className={`duckfight${hurt ? " is-hurt" : ""}`}>
        <div className="flames" />
        <div className="duck-roam" style={duckStyle}>
          <pre className={`duck-big${hurt ? " duck-hit" : ""}`}>{DUCK_ASCII}</pre>
        </div>

        <div className="duck-hp">
          <div className="duck-hp-label">
            <span>duck.service (PID 1)</span>
            <span>{hp}%</span>
          </div>
          <div className="duck-hp-track">
            <div className="duck-hp-fill" style={{ width: `${hp}%` }} />
          </div>
        </div>

        <div className="duck-log">
          {log.map((l, i) => (
            <div key={i} className={l.startsWith("$") ? "duck-log-cmd" : undefined}>
              {l}
            </div>
          ))}
        </div>

        <div className="duck-weapons">
          {WEAPONS.map((w) => (
            <button key={w.cmd} className="mini-btn" onClick={() => strike(w)}>
              {w.cmd}
            </button>
          ))}
        </div>

        <p className="small" style={{ position: "relative", opacity: 0.75 }}>
          attempts: {hits} - kills: 0
          {hits >= 8 ? " - the duck is not tired." : ""}
        </p>

        <button
          className={`mini-btn${hits >= 4 ? " duck-give-up" : ""}`}
          style={{ position: "relative" }}
          onClick={() => {
            setFriend(true);
            setLog((l) => [...l, "duck.service: bread received. hostilities ended."]);
          }}
        >
          give it bread
        </button>
      </div>
    </>
  );
}


/* -------- too many windows -------- */

export function Mercy() {
  const on = useOs((s) => s.mercy);
  if (!on) return null;
  return (
    <div className="mercy">
      <div className="box">
        <p>
          <strong>mercy.</strong> ten windows is enough. this whole thing is React state in a
          browser tab, not a workstation.
        </p>
        <p className="small">close something first.</p>
        <button className="mini-btn" onClick={() => setState({ mercy: false })}>
          fine
        </button>
      </div>
    </div>
  );
}

/* -------- small screen warning -------- */

export function MobileWarn() {
  const on = useOs((s) => s.mobileWarn);
  if (!on) return null;
  return (
    <div className="mobile-warn">
      <div className="box">
        <p>
          <strong>this is a desktop toy.</strong> draggable windows, a terminal and DOOM on a phone
          screen will be cramped.
        </p>
        <p className="small">It still works if you want to try.</p>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            className="mini-btn"
            onClick={() => {
              setState({ mobileWarn: false, mobileAck: true });
              requestTerminal();
            }}
          >
            continue anyway
          </button>

          <button className="mini-btn" onClick={() => setState({ mobileWarn: false })}>
            back to the site
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------- kiosk restart: the page rebuilds itself --------
 * Instead of abstract boxes, this is a real replica of the homepage - same
 * markup, same classes, same widths - caught mid-construction:
 *   1. wire   : every element is a measured skeleton bar, laid out top-down
 *   2. type   : bars fill with their real text, wiped in left to right
 *   3. settle : the construction skin burns off and the page snaps into place
 *   4. open   : the live site takes the screen
 */

type KbNode =
  | { t: "brand"; v: string }
  | { t: "nav"; v: string[] }
  | { t: "h1"; v: string }
  | { t: "h2"; v: string }
  | { t: "h3"; v: string }
  | { t: "p"; v: string }
  | { t: "small"; v: string }
  | { t: "btn"; v: string }
  | { t: "rule" }
  | { t: "foot"; v: string[] };

/** Mirrors src/routes/index.tsx, trimmed to what fits one screen. */
function kbNodes(): KbNode[] {
  return [
    { t: "brand", v: "lucazani.com" },
    { t: "nav", v: ["projects", "blog", "likes", "contact"] },
    { t: "rule" },
    { t: "h1", v: "Luca Zani" },
    {
      t: "p",
      v: `${calcAge()} y/o developer from Bolzano, Italy. Backend-focused but full-stack when needed. I write code, solder, 3D print, and build cool things.`,
    },
    { t: "small", v: "(yes, the age is auto updated, check it out on 18 August midnight)" },
    { t: "p", v: "Feel free to reach out anytime" },
    { t: "h2", v: "What I'm Building" },
    { t: "h3", v: "BananaWiki (2026)" },
    {
      t: "p",
      v: "A private wiki platform: Markdown pages with history, Kanban boards, Canvas diagrams, built-in chat and 33 toggleable plugins.",
    },
    { t: "btn", v: "read more →" },
    { t: "h3", v: "Wicked Agent" },
    {
      t: "p",
      v: "Open-source, asynchronous coding agent you can host on your own VPS. Inspired by Devin AI.",
    },
    { t: "btn", v: "read more →" },
    { t: "h3", v: "Unnamed Engine" },
    { t: "p", v: "A game engine experiment. Still learning, still exploring." },
    { t: "btn", v: "read more →" },
    { t: "h2", v: "A Note on the Rest" },
    {
      t: "p",
      v: "90-95% of what I build is an experiment. Most of it ends up archived or deleted internally, because I only publish work I consider pseudo-significant.",
    },
    { t: "rule" },
    { t: "foot", v: [`© ${new Date().getFullYear()} Luca Zani`, "MIT", "source"] },
  ];
}

/* beats, in ms */
const T_TYPE = 780;
const T_SETTLE = 3000;
const T_OPEN = 3720;

function KbLine({ node, i }: { node: KbNode; i: number }) {
  const style = { "--kb-i": i } as React.CSSProperties;

  if (node.t === "rule") return <div className="kb-rule" style={style} />;

  if (node.t === "nav" || node.t === "foot") {
    return (
      <div className={`kb-row kb-${node.t}`} style={style}>
        {node.v.map((w) => (
          <span key={w} className="kb-word">
            <i className="kb-bar" />
            <em className="kb-ink">{w}</em>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`kb-el kb-${node.t}`} style={style}>
      <i className="kb-bar" />
      <em className="kb-ink">{node.v}</em>
    </div>
  );
}

export function KioskBoot() {
  const booting = useOs((s) => s.kioskBooting);
  const [phase, setPhase] = useState<"wire" | "type" | "settle" | "open" | null>(null);

  useEffect(() => {
    if (!booting) {
      setPhase(null);
      return;
    }
    setPhase("wire");
    const timers = [
      setTimeout(() => setPhase("type"), T_TYPE),
      setTimeout(() => setPhase("settle"), T_SETTLE),
      setTimeout(() => setPhase("open"), T_OPEN),
    ];
    return () => timers.forEach(clearTimeout);
  }, [booting]);

  if (!booting || !phase) return null;
  if (phase === "open") return <div className="kiosk-open" />;

  const nodes = kbNodes();

  return (
    <div className={`kiosk-build is-${phase}`}>
      <div className="kb-guides" />
      <div className="kb-page">
        {nodes.map((n, i) => (
          <KbLine key={`${n.t}-${i}`} node={n} i={i} />
        ))}
      </div>
      <div className="kb-sweep" />
    </div>
  );
}




/* -------- idle session watchdog (public-PC hygiene) --------
 * The guest session lives in sessionStorage, so it dies with the tab anyway.
 * This watchdog is the second layer: if the tab sits untouched for IDLE_MS and
 * the session has anything worth wiping, erase it and reload straight back into
 * kiosk mode. No notice, no button - the machine simply comes back up clean. */
const IDLE_MS = 5 * 60 * 1000;

export function IdleReset() {
  const booted = useOs((s) => s.booted);
  const last = useRef(Date.now());

  useEffect(() => {
    if (!booted) return;
    const mark = () => {
      last.current = Date.now();
    };
    const evts: (keyof WindowEventMap)[] = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "wheel",
    ];
    evts.forEach((e) => window.addEventListener(e, mark, { passive: true }));

    const iv = setInterval(() => {
      if (Date.now() - last.current > IDLE_MS && sessionIsDirty()) {
        last.current = Date.now();
        logoutReset();
        // hard reload so the site comes back up in kiosk mode, as on first visit
        window.location.replace("/");
      }
    }, 5000);

    return () => {
      evts.forEach((e) => window.removeEventListener(e, mark));
      clearInterval(iv);
    };
  }, [booted]);

  return null;
}

