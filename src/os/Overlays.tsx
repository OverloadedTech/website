import { useEffect, useRef, useState } from "preact/hooks";
import { DUCK } from "./duck";
import { spinStyle } from "./spin";
import { dirty, requestTerminal, reset, set, useOs } from "./state";

// networking.service stopped
export function Bsod() {
  const [left, setLeft] = useState(10);
  useEffect(() => {
    const tick = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    const done = setTimeout(reset, 10_500);
    return () => (clearInterval(tick), clearTimeout(done));
  }, []);

  return (
    <div class="bsod">
      <div>
        <h2>:( the host lost its network</h2>
        <p>
          networking.service was stopped by user <b>guest</b>. everything this machine shows arrives
          over that unit, so there is nothing left to show.
        </p>
        <p>
          the machine will be reimaged in <b>{left}</b> seconds. the guest session will not survive
          it.
        </p>
        <p class="code">STOP CODE: DUCK_WAS_RIGHT</p>
        <button class="btn" onClick={reset}>
          reimage now
        </button>
      </div>
    </div>
  );
}

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

const wander = (r = 10) =>
  `translate(${(Math.random() - 0.5) * 68}vw, ${(Math.random() - 0.5) * 32}vh) rotate(${(Math.random() - 0.5) * 2 * r}deg)`;

// systemctl stop duck.service. she can't be stopped.
export function DuckFight() {
  const [hp, setHp] = useState(100);
  const [tries, setTries] = useState(0);
  const [hurt, setHurt] = useState(false);
  const [friends, setFriends] = useState(false);
  const [where, setWhere] = useState("none");
  const [log, setLog] = useState(["duck.service: active (running) since boot"]);

  // she heals, and she never stands still long enough to aim
  useEffect(() => {
    if (friends) return;
    const heal = setInterval(() => setHp((v) => Math.min(100, v + 7)), 380);
    const walk = setInterval(() => setWhere(wander()), 900);
    return () => (clearInterval(heal), clearInterval(walk));
  }, [friends]);

  const hit = (w: (typeof WEAPONS)[number]) => {
    const n = tries + 1;
    setTries(n);
    setHurt(true);
    setTimeout(() => setHurt(false), 220);
    setWhere(wander(14));
    setHp((v) => Math.max(1, v - w.dmg));
    setLog((l) => [...l, `$ ${w.cmd}`, w.log, TAUNTS[n % TAUNTS.length]].slice(-9));
  };

  if (friends) {
    return (
      <div class="duckfight friends">
        <pre class="big-duck">{DUCK}</pre>
        <p>she takes the bread. no hurry, no grudge.</p>
        <p class="small">
          she is the one who opened the door out of the kiosk in the first place. a fair trade: a
          slice of bread for an escape route. duck.service stays up, and you two are friends now.
        </p>
        <button class="btn" onClick={() => set({ overlay: null })}>
          go back, on good terms
        </button>
      </div>
    );
  }

  return (
    <>
      <div class="crack" />
      <div class={`duckfight${hurt ? " hurt" : ""}`}>
        <div class="flames" />
        <div class="roam" style={{ transform: where }}>
          <pre class={`big-duck${hurt ? " hit" : ""}`}>{DUCK}</pre>
        </div>
        <div class="hp">
          <div>
            <span>duck.service (PID 1)</span>
            <span>{hp}%</span>
          </div>
          <div class="track">
            <div style={{ width: `${hp}%` }} />
          </div>
        </div>
        <div class="log">
          {log.map((l, i) => (
            <div key={i} class={l.startsWith("$") ? "cmd" : ""}>
              {l}
            </div>
          ))}
        </div>
        <div class="weapons">
          {WEAPONS.map((w) => (
            <button key={w.cmd} class="btn" onClick={() => hit(w)}>
              {w.cmd}
            </button>
          ))}
        </div>
        <p class="small">
          attempts: {tries} - kills: 0{tries >= 8 && " - the duck is not tired."}
        </p>
        <button class={`btn${tries >= 4 ? " pulse" : ""}`} onClick={() => setFriends(true)}>
          give it bread
        </button>
      </div>
    </>
  );
}

export function Mercy() {
  return (
    <div class="modal">
      <div>
        <p>
          <b>mercy.</b> ten windows is enough. this whole thing is 80-odd kilobytes of JavaScript in
          a browser tab, not a workstation.
        </p>
        <p class="small">close something first.</p>
        <button class="btn" onClick={() => set({ overlay: null })}>
          fine
        </button>
      </div>
    </div>
  );
}

export function MobileWarn() {
  return (
    <div class="modal">
      <div>
        <p>
          <b>this is a desktop toy.</b> draggable windows, a terminal and DOOM on a phone screen
          will be cramped.
        </p>
        <p class="small">it still works if you want to try.</p>
        <p>
          <button
            class="btn"
            onClick={() => {
              set({ overlay: null, mobileOk: true });
              requestTerminal();
            }}
          >
            continue anyway
          </button>{" "}
          <button class="btn" onClick={() => set({ overlay: null })}>
            back to the site
          </button>
        </p>
      </div>
    </div>
  );
}

// systemctl start lucazani: a copy of the current page builds itself back up
const BITS =
  "header .home, header nav a, header .extras > *, main h1, main h2, main h3, main p, main li, main dt, main dd, footer p:first-child";

export function Rebuild() {
  const spin = useOs((s) => s.spin);
  const [phase, setPhase] = useState("wire");
  const page = useRef<HTMLDivElement>(null);
  const [html] = useState(() => document.querySelector("#site .page")?.innerHTML ?? "");
  const [offset] = useState(() => scrollY);

  useEffect(() => {
    page.current?.querySelectorAll<HTMLElement>(BITS).forEach((el, i) => {
      el.classList.add("bit");
      el.style.setProperty("--i", String(Math.min(i, 40)));
    });
    const t = [
      setTimeout(() => setPhase("type"), 780),
      setTimeout(() => setPhase("settle"), 3000),
      setTimeout(() => setPhase("open"), 3720),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <div class={`rebuild ${phase}`} style={spinStyle(spin)}>
      <div
        class="page"
        ref={page}
        style={{ marginTop: -offset }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div class="sweep" />
    </div>
  );
}

// 5 min idle wipes the session (public computers)
const IDLE = 5 * 60_000;

export function useIdleReset() {
  useEffect(() => {
    let last = Date.now();
    const poke = () => (last = Date.now());
    const events = ["pointerdown", "keydown", "touchstart", "scroll", "wheel"];
    events.forEach((e) => addEventListener(e, poke, { passive: true }));
    const check = setInterval(() => {
      if (Date.now() - last > IDLE && dirty()) {
        reset();
        location.replace("/");
      }
    }, 5000);
    return () => {
      events.forEach((e) => removeEventListener(e, poke));
      clearInterval(check);
    };
  }, []);
}

const INCEPTION = [
  "hey. hey. you are inside a browser, inside a desktop, inside this site.",
  "opening the escape terminal in here would be an inception. we do not do that.",
  "one layer of me is plenty. go escape from the real page.",
];

// inside the kiosk/browser frames the escape hatch doesn't nest
export function InceptionDuck() {
  const [count, setCount] = useState(0);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const show = () => {
      setCount((c) => c + 1);
      setOn(true);
    };
    addEventListener("inception", show);
    return () => removeEventListener("inception", show);
  }, []);
  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => setOn(false), 7200);
    return () => clearTimeout(t);
  }, [on, count]);

  if (!on) return null;
  return (
    <div class="flyby" key={count} role="status">
      <div class="say">{INCEPTION[(count - 1) % INCEPTION.length]}</div>
      <pre>{DUCK}</pre>
    </div>
  );
}
