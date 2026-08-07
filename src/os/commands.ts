import { spinAngle } from "./spin";
import { PAGES, pageByName } from "@/lib/site";
import {
  SERVICES,
  getState,
  logoutReset,
  openWindow,
  setState,
  updateWindow,
  type ServiceName,
  type TermLine,
  type ThemeName,
} from "./store";

export type Pending = null | { kind: "logout" } | { kind: "light" };

export type CmdResult = {
  lines: TermLine[];
  clear?: boolean;
  close?: boolean;
  pending?: Pending;
};

const out = (...v: string[]): TermLine[] => v.map((x) => ({ t: "out" as const, v: x }));
const err = (...v: string[]): TermLine[] => v.map((x) => ({ t: "err" as const, v: x }));
const dim = (...v: string[]): TermLine[] => v.map((x) => ({ t: "dim" as const, v: x }));

const THEMES: ThemeName[] = ["default", "green", "red", "cyan", "light", "aero"];

const HELP_ROWS: [string, string][] = [
  ["help", "this list"],
  ["ls", "list the pages served by this host"],
  ["open <page>", "navigate to a page"],
  
  ["cd <path>", "change directory"],
  ["clear", "clear the screen"],
  ["history [-c]", "commands typed in this terminal. -c wipes the list"],

  ["systemctl list-units", "list units on this host and their state"],
  ["systemctl status <unit>", "report the state of a unit"],
  ["systemctl start <unit>", "bring a unit up"],
  ["systemctl stop <unit>", "bring a unit down"],
  ["spin", "rotate the whole page. run it again to stand it back up"],
  ["spin -r", "same, counter clockwise"],
  ["spin -s <sec>", "seconds per turn (0.15-60). default 2. works while spinning"],
  ["spin -f", "freeze it at the current angle"],
  ["spin stop", "stand it back up from any state"],
  ["spin -h", "the full list of spin flags"],
  ["theme <name>", "default | green | red | cyan | light | aero"],
  ["theme custom", "open the colour panel"],
  ["lore", "what this machine is"],
  ["logout", "end the guest session and erase it"],
];

/* two columns are unreadable once the window is phone-width, so stack them */
function helpLines() {
  const narrow = typeof window !== "undefined" && window.innerWidth < 760;
  const body = HELP_ROWS.flatMap(([cmd, desc]) =>
    narrow ? [`  ${cmd}`, `      ${desc}`] : [`  ${cmd.padEnd(24)}${desc}`],
  );
  return [
    "available commands - arguments in <> are required, [] optional",
    "",
    ...body,
    "",
    "commands are case insensitive and may be prefixed with sudo.",
  ];
}


const LORE = [
  "this host runs one application in kiosk mode.",
  "",
  "lucazani.service is that application. it draws the site, it takes the whole",
  "screen, and it is the reason you cannot see anything else. it is the lock.",
  "",
  "duck.service is not part of the image. nobody deployed it. it starts on boot",
  "anyway and it has never once failed. the duck handed you this terminal, which",
  "was not hers to hand over. she is a friend, whatever the unit file implies.",
  "",
  "networking.service is what keeps the pages arriving. treat it accordingly.",
  "",
  "there is more of this machine than what is currently on screen. the way to see",
  "it is not written down anywhere. go and look.",
];

function unitOf(name: string): ServiceName | null {
  const n = name.toLowerCase();
  const full = (n.endsWith(".service") ? n : `${n}.service`) as ServiceName;
  return SERVICES.includes(full) ? full : null;
}

export type CmdCtx = {
  navigate: (path: string) => void;
  pathname: string;
  winId: number;
};

export function runCommand(raw: string, ctx: CmdCtx): CmdResult {
  let input = raw.trim();
  if (!input) return { lines: [] };
  if (/^sudo\s+/i.test(input)) input = input.replace(/^sudo\s+/i, "");
  const parts = input.split(/\s+/);
  const cmd = (parts[0] ?? "").toLowerCase();
  const args = parts.slice(1);
  const s = getState();
  const kiosk = s.services["lucazani.service"] === "active";

  switch (cmd) {
    case "help":
    case "?":
      return { lines: dim(...helpLines()) };

    case "clear":
      return { lines: [], clear: true };

    case "ls":
      return {
        lines: out(PAGES.map((p) => p.name).join("   ")),
      };

    case "cd":
      return {
        lines: err(`cd: ${args[0] ?? "/"}: permission denied`, "this session is confined."),
      };

    case "whoami":
      return { lines: out("guest") };

    case "open": {
      if (!args[0]) return { lines: err("open: missing operand", "usage: open <page>") };
      const page = pageByName(args[0]);
      if (!page)
        return {
          lines: err(`open: ${args[0]}: no such page`, `try: ${PAGES.map((p) => p.name).join(", ")}`),
        };
      if (!kiosk) {
        openWindow("browser", { url: page.path, title: `browser - ${page.name}` });
        return {
          lines: dim(
            `lucazani.service is not running; ${page.name} handed to the browser instead.`,
          ),
        };
      }
      if (ctx.pathname === page.path)
        return { lines: err(`open: ${page.name}: already on this page`) };
      ctx.navigate(page.path);
      return { lines: dim(`opening ${page.name}...`) };
    }

    case "systemctl":
      return systemctl(args, ctx);


    case "spin":
      return spin(args);

    case "lore":
      return { lines: dim(...LORE) };

    case "theme":
      return theme(args);

    case "logout":
      return {
        lines: out(
          "this deletes the guest user and everything recorded under it:",
          "  open windows, terminal history, desktop files and icon positions,",
          "  unit states and the current theme.",
          "the machine will come back up as if you had never been here.",
        ),
        pending: { kind: "logout" },
      };

    case "history":
      return histCmd(args, ctx);


    case "exit":
      return { lines: [], close: true };


/** history [-c] - the commands typed in *this* terminal. Survives kiosk restarts. */
function histCmd(args: string[], ctx: CmdCtx): CmdResult {
  const flag = (args[0] ?? "").toLowerCase();
  const win = getState().windows.find((w) => w.id === ctx.winId);
  const list = win?.history ?? [];

  if (flag === "-c" || flag === "clear") {
    updateWindow(ctx.winId, { history: [] });
    return { lines: dim("history cleared.") };
  }
  if (flag && flag !== "-c" && flag !== "clear")
    return { lines: err(`history: ${flag}: unknown option`, "usage: history [-c]") };

  // the running command is not in the list yet, so it is appended here
  const all = [...list, "history"];
  if (all.length === 1) return { lines: dim("no commands yet.") };
  const width = String(all.length).length;
  return {
    lines: out(...all.map((c, i) => `  ${String(i + 1).padStart(width)}  ${c}`)),
  };
}


    default:
      return { lines: err(`${cmd}: command not found`, "type help.") };
  }
}

function systemctl(args: string[], ctx: CmdCtx): CmdResult {
  const s = getState();
  const sub = (args[0] ?? "").toLowerCase();

  if (sub === "list-utils" || sub === "list-units") {
    const rows = SERVICES.map((u) => {
      const st = s.services[u];
      return `  ${u.padEnd(22)} ${st === "active" ? "loaded active   running" : "loaded inactive dead"}`;
    });
    return {
      lines: [
        ...dim("  UNIT                   LOAD   ACTIVE  SUB"),
        ...out(...rows),
        ...dim(`  ${SERVICES.length} units listed.`),
      ],
    };
  }

  const target = args[1];
  if (!["start", "stop", "status", "restart"].includes(sub))
    return {
      lines: err(
        `systemctl: unknown operation '${sub || ""}'`,
        "usage: systemctl list-units | systemctl start|stop|status <unit>",
      ),
    };
  if (!target) return { lines: err(`systemctl ${sub}: missing unit name`) };
  const unit = unitOf(target);
  if (!unit) return { lines: err(`Unit ${target} could not be found.`) };
  const state = s.services[unit];

  if (sub === "status") {
    return {
      lines: [
        ...out(`● ${unit}`),
        ...dim(
          `     Loaded: loaded (/etc/systemd/system/${unit}; enabled)`,
          `     Active: ${state === "active" ? "active (running)" : "inactive (dead)"}`,
          `   Main PID: ${unit === "duck.service" ? "1" : Math.abs(hash(unit)) % 9000 + 400}`,
          unit === "duck.service" ? "      Notes: unit was not part of this image." : "",
        ).filter((l) => l.v !== ""),
      ],
    };
  }

  if (sub === "restart") {
    return { lines: err("systemctl: restart is not permitted for guest. stop, then start.") };
  }

  if (sub === "start") {
    if (state === "active") return { lines: err(`Job for ${unit} failed: unit is already active.`) };
    if (unit === "lucazani.service") {
      startKiosk();
      return { lines: dim("Starting lucazani.service...") };
    }
    setState({ services: { ...s.services, [unit]: "active" } });
    return { lines: dim(`Starting ${unit}...`) };
  }

  // stop
  if (state === "inactive") return { lines: err(`Job for ${unit} failed: unit is not active.`) };

  if (unit === "duck.service") {
    setState({ duckFight: true });
    return {
      lines: err(
        "Failed to stop duck.service: operation not permitted.",
        "Failed to stop duck.service: operation not permitted.",
        "Failed to kill unit duck.service: no such process. unit still running.",
      ),
    };
  }

  if (unit === "networking.service") {
    setState({ services: { ...s.services, [unit]: "inactive" } });
    setTimeout(() => setState({ bsod: "network" }), 350);
    return { lines: dim("Stopping networking.service...") };
  }

  if (unit === "lucazani.service") {
    setState((st) => ({
      services: { ...st.services, [unit]: "inactive" },
      // everything that was hidden behind the kiosk comes back
      windows: [...st.stashed, ...st.windows],
      stashed: [],
    }));
    void ctx;
    return { lines: dim("Stopping lucazani.service...") };
  }

  setState({ services: { ...s.services, [unit]: "inactive" } });
  return { lines: dim(`Stopping ${unit}...`) };
}

/** Kiosk boot: spinner, then the fullscreen open animation. Safe to call twice. */
export function startKiosk() {
  const s = getState();
  if (s.kioskBooting) return;
  setState((st) => ({
    services: { ...st.services, "lucazani.service": "active" },
    kioskBooting: true,
    // coming back to the site after the desktop unlocks the footer creed
    cycled: st.cycled || st.services["lucazani.service"] === "inactive",
    // the kiosk owns the screen, but the escape terminal stays where it is:
    // it is the way back out, and its history goes with it
    windows: st.windows.filter((w) => w.app === "terminal"),
    stashed: [
      ...st.stashed,
      ...st.windows.filter((w) => w.app !== "kiosk" && w.app !== "terminal"),
    ],

  }));
  setTimeout(() => {
    setState({ kioskBooting: false });
  }, 4300);
}


const SPIN_USAGE = "usage: spin [-r] [-s <seconds-per-turn>] [-f] [stop] [-h]";
const SPIN_HELP = [
  "spin - rotate the entire machine. nothing reloads, nothing is lost.",
  "",
  "  spin           start spinning clockwise, or stand it back up if not upright",
  "  spin -r        spin counter clockwise",
  "  spin -s 0.5    set seconds per turn (0.15 - 60, default 2)",
  "  spin -r -s 8   flags combine",
  "  spin -f        freeze at the current angle and leave it there",
  "  spin stop      always upright again, from any state",
  "  spin -h        this text",
  "",
  "the site, the desktop and every window turn together, and the pointer is",
  "corrected for the angle, so dragging icons and windows still goes where you",
  "point. overlays stay upright on purpose: the way out never spins.",
];
const DEFAULT_SPIN_SPEED = 2;

function spin(args: string[]): CmdResult {
  const s = getState();
  let rev = false;
  let speed: number | null = null;

  for (let i = 0; i < args.length; i++) {
    const a = (args[i] ?? "").toLowerCase();
    if (a === "-r" || a === "--reverse") {
      rev = true;
      continue;
    }
    if (a === "-h" || a === "--help") return { lines: dim(...SPIN_HELP) };
    // always-available way out, whatever state the page is in
    if (a === "stop" || a === "off" || a === "reset" || a === "0") {
      if (s.spin === "none") return { lines: err("spin: nothing is spinning") };
      setState({ spin: "none", spinAngle: 0 });
      return { lines: dim("upright. nothing was reloaded.") };
    }
    if (a === "-f") {
      if (s.spin === "frozen")
        return { lines: err("spin: -f: already frozen", "spin to stand it back up.") };
      if (s.spin === "none")
        return { lines: err("spin: -f: nothing is spinning", "bad usage.") };
      const angle = liveSpinAngle();
      setState({ spin: "frozen", spinAngle: angle });
      return { lines: dim(`stopped at ${angle.toFixed(1)}°. everything still works. mostly.`) };
    }
    const raw = a === "-s" || a === "--speed" ? args[++i] : a.startsWith("-s") ? a.slice(2) : null;
    if (raw === null) return { lines: err(`spin: unrecognized option '${a}'`, SPIN_USAGE) };
    const n = Number(raw);
    if (!raw || !Number.isFinite(n) || n <= 0)
      return { lines: err(`spin: -s: '${raw ?? ""}' is not a positive number`, SPIN_USAGE) };
    speed = Math.min(Math.max(n, 0.15), 60);
  }

  const running = s.spin === "cw" || s.spin === "ccw";

  // bare `spin` is the off switch for anything that is not upright,
  // frozen included - otherwise a frozen page had no way back.
  if ((running || s.spin === "frozen") && speed === null && !rev) {
    setState({ spin: "none", spinAngle: 0 });
    return { lines: dim("upright. nothing was reloaded.") };
  }

  // `spin -r` while already going counter clockwise is also an off switch
  if (running && rev && s.spin === "ccw" && speed === null) {
    setState({ spin: "none", spinAngle: 0 });
    return { lines: dim("upright. nothing was reloaded.") };
  }

  const next = speed ?? (running ? s.spinSpeed : DEFAULT_SPIN_SPEED);
  // resume from wherever it is right now instead of snapping to 0.
  const from = running || s.spin === "frozen" ? liveSpinAngle() : 0;
  setState({ spin: rev ? "ccw" : "cw", spinAngle: from, spinSpeed: next });
  return {
    lines: dim(
      `${rev ? "spinning, counter clockwise" : "spinning"} - ${next}s per turn.`,
      "spin -s <sec> to change speed, spin -f to freeze, spin to stop.",
    ),
  };
}

/** Current on-screen rotation of the escape layer, in degrees 0-360. */
function liveSpinAngle(): number {
  return spinAngle();
}


function theme(args: string[]): CmdResult {
  const s = getState();
  const name = (args[0] ?? "").toLowerCase();
  if (!name)
    return {
      lines: err("theme: missing name", `available: ${THEMES.join(", ")}, custom`),
    };
  if (name === "custom") {
    setState({ themePanel: true, theme: "custom" });
    return { lines: dim("colour panel open. close it and reopen with theme custom.") };
  }
  if (!THEMES.includes(name as ThemeName))
    return { lines: err(`theme: ${name}: no such theme`, `available: ${THEMES.join(", ")}, custom`) };
  if (s.theme === name) return { lines: err(`theme: ${name} is already applied`) };
  if (name === "light") {
    return {
      lines: out("light mode. this will forcibly illuminate your retinas."),
      pending: { kind: "light" },
    };
  }
  setState({ theme: name as ThemeName, themePanel: false });
  return { lines: dim(`theme: ${name}`) };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

export function applyPending(p: Pending, answer: string, winId: number): TermLine[] {
  const yes = /^y(es)?$/i.test(answer.trim());
  if (!p) return [];
  if (p.kind === "logout") {
    if (!yes) return dim("aborted. you are still guest.");
    setTimeout(() => logoutReset(), 60);
    return dim("session closed. guest deleted.");
  }
  if (p.kind === "light") {
    if (!yes) return dim("wise. staying dark.");
    setState({ theme: "light", themePanel: false });
    void winId;
    return dim("theme: light. eye folgoration accepted.");
  }
  return [];
}

export { updateWindow };
