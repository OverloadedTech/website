import { go } from "../page/nav";
import { siteAngle } from "./spin";
import {
  UNITS,
  get,
  kioskOn,
  openWindow,
  reset,
  set,
  startKiosk,
  type Theme,
  type Unit,
} from "./state";

export type Line = { k: "in" | "out" | "err" | "dim"; t: string };
export type Pending = null | "logout" | "light";
export type Result = { lines: Line[]; clear?: boolean; close?: boolean; ask?: Pending };
export type Ctx = { history: string[]; clearHistory: () => void };

const out = (...t: string[]): Line[] => t.map((t) => ({ k: "out", t }));
const err = (...t: string[]): Line[] => t.map((t) => ({ k: "err", t }));
const dim = (...t: string[]): Line[] => t.map((t) => ({ k: "dim", t }));

export const PAGES: [string, string][] = [
  ["home", "/"],
  ["projects", "/projects/"],
  ["blog", "/blog/"],
  ["likes", "/likes/"],
  ["contact", "/contact/"],
];

const THEMES: Theme[] = ["default", "green", "red", "cyan", "light", "aero"];

const HELP: [string, string][] = [
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
  ["theme <name>", THEMES.join(" | ")],
  ["theme custom", "pick your own colours (or: theme custom bg=#111 accent=#fc0)"],
  ["lore", "what this machine is"],
  ["logout", "end the guest session and erase it"],
];

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

function help() {
  // two columns don't fit on a phone, so stack them there
  const narrow = window.innerWidth < 760;
  const rows = HELP.flatMap(([cmd, what]) =>
    narrow ? [`  ${cmd}`, `      ${what}`] : [`  ${cmd.padEnd(24)}${what}`],
  );
  return dim(
    "available commands - arguments in <> are required, [] optional",
    "",
    ...rows,
    "",
    "commands are case insensitive and may be prefixed with sudo.",
  );
}

export function run(raw: string, ctx: Ctx): Result {
  const words = raw
    .trim()
    .replace(/^sudo\s+/i, "")
    .split(/\s+/);
  const cmd = words[0].toLowerCase();
  const args = words.slice(1);

  switch (cmd) {
    case "":
      return { lines: [] };
    case "help":
    case "?":
      return { lines: help() };
    case "clear":
      return { lines: [], clear: true };
    case "exit":
      return { lines: [], close: true };
    case "ls":
      return { lines: out(PAGES.map((p) => p[0]).join("   ")) };
    case "cd":
      return {
        lines: err(`cd: ${args[0] ?? "/"}: permission denied`, "this session is confined."),
      };
    case "whoami":
      return { lines: out("guest") };
    case "lore":
      return { lines: dim(...LORE) };
    case "open":
      return open(args[0]);
    case "systemctl":
      return systemctl(args);
    case "spin":
      return spin(args);
    case "theme":
      return theme(args);
    case "history":
      return history(args[0], ctx);
    case "logout":
      return {
        lines: out(
          "this deletes the guest user and everything recorded under it:",
          "  open windows, terminal history, desktop files and icon positions,",
          "  unit states and the current theme.",
          "the machine will come back up as if you had never been here.",
        ),
        ask: "logout",
      };
    default:
      return { lines: err(`${cmd}: command not found`, "type help.") };
  }
}

export function answer(q: Pending, reply: string): Line[] {
  const yes = /^y(es)?$/i.test(reply.trim());
  if (q === "logout") {
    if (!yes) return dim("aborted. you are still guest.");
    setTimeout(reset, 60);
    return dim("session closed. guest deleted.");
  }
  if (q === "light") {
    if (!yes) return dim("wise. staying dark.");
    set({ theme: "light" });
    return dim("theme: light. eye folgoration accepted.");
  }
  return [];
}

function pageFor(name: string) {
  const n = name.toLowerCase().replace(/^\/+|\/+$|\.html$/g, "") || "home";
  return PAGES.find((p) => p[0] === n);
}

function open(name?: string): Result {
  if (!name) return { lines: err("open: missing operand", "usage: open <page>") };
  const page = pageFor(name);
  if (!page) {
    return {
      lines: err(`open: ${name}: no such page`, `try: ${PAGES.map((p) => p[0]).join(", ")}`),
    };
  }
  const [label, path] = page;
  if (!kioskOn()) {
    openWindow("browser", { url: path, title: `browser - ${label}` });
    return {
      lines: dim(`lucazani.service is not running; ${label} handed to the browser instead.`),
    };
  }
  if (location.pathname === path) return { lines: err(`open: ${label}: already on this page`) };
  go(path);
  return { lines: dim(`opening ${label}...`) };
}

function history(flag = "", ctx: Ctx): Result {
  flag = flag.toLowerCase();
  if (flag === "-c" || flag === "clear") {
    ctx.clearHistory();
    return { lines: dim("history cleared.") };
  }
  if (flag) return { lines: err(`history: ${flag}: unknown option`, "usage: history [-c]") };
  // the history command itself isn't in the list yet
  const all = [...ctx.history, "history"];
  if (all.length === 1) return { lines: dim("no commands yet.") };
  const pad = String(all.length).length;
  return { lines: out(...all.map((c, i) => `  ${String(i + 1).padStart(pad)}  ${c}`)) };
}

function unitFrom(name: string): Unit | null {
  const n = name.toLowerCase();
  const full = (n.endsWith(".service") ? n : `${n}.service`) as Unit;
  return UNITS.includes(full) ? full : null;
}

function pid(unit: Unit) {
  if (unit === "duck.service") return 1;
  let h = 0;
  for (const c of unit) h = (h * 31 + c.charCodeAt(0)) | 0;
  return (Math.abs(h) % 9000) + 400;
}

function systemctl(args: string[]): Result {
  const s = get();
  const sub = (args[0] ?? "").toLowerCase();

  // the typo works too
  if (sub === "list-units" || sub === "list-utils") {
    return {
      lines: [
        ...dim("  UNIT                   LOAD   ACTIVE  SUB"),
        ...out(
          ...UNITS.map(
            (u) =>
              `  ${u.padEnd(22)} ${s.units[u] ? "loaded active   running" : "loaded inactive dead"}`,
          ),
        ),
        ...dim(`  ${UNITS.length} units listed.`),
      ],
    };
  }

  if (!["start", "stop", "status", "restart"].includes(sub)) {
    return {
      lines: err(
        `systemctl: unknown operation '${sub}'`,
        "usage: systemctl list-units | systemctl start|stop|status <unit>",
      ),
    };
  }
  if (!args[1]) return { lines: err(`systemctl ${sub}: missing unit name`) };
  const unit = unitFrom(args[1]);
  if (!unit) return { lines: err(`Unit ${args[1]} could not be found.`) };
  const active = s.units[unit];

  if (sub === "status") {
    const lines = [
      ...out(`● ${unit}`),
      ...dim(
        `     Loaded: loaded (/etc/systemd/system/${unit}; enabled)`,
        `     Active: ${active ? "active (running)" : "inactive (dead)"}`,
        `   Main PID: ${pid(unit)}`,
      ),
    ];
    if (unit === "duck.service")
      lines.push(...dim("      Notes: unit was not part of this image."));
    return { lines };
  }

  if (sub === "restart") {
    return { lines: err("systemctl: restart is not permitted for guest. stop, then start.") };
  }

  if (sub === "start") {
    if (active) return { lines: err(`Job for ${unit} failed: unit is already active.`) };
    if (unit === "lucazani.service") startKiosk();
    else set({ units: { ...s.units, [unit]: true } });
    return { lines: dim(`Starting ${unit}...`) };
  }

  if (!active) return { lines: err(`Job for ${unit} failed: unit is not active.`) };

  switch (unit) {
    case "duck.service":
      set({ overlay: "duck" });
      return {
        lines: err(
          "Failed to stop duck.service: operation not permitted.",
          "Failed to stop duck.service: operation not permitted.",
          "Failed to kill unit duck.service: no such process. unit still running.",
        ),
      };
    case "networking.service":
      set({ units: { ...s.units, [unit]: false } });
      setTimeout(() => set({ overlay: "bsod" }), 350);
      break;
    case "lucazani.service":
      set({ units: { ...s.units, [unit]: false }, wins: [...s.stash, ...s.wins], stash: [] });
      break;
    default:
      set({ units: { ...s.units, [unit]: false } });
  }
  return { lines: dim(`Stopping ${unit}...`) };
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
  "the site and every window turn together, and dragging still goes where you",
  "point. the terminal stays upright on purpose: the way out never spins.",
];

function spin(args: string[]): Result {
  const now = get().spin;
  const upright = (): Result => {
    set({ spin: { ...now, mode: "off", angle: 0 } });
    return { lines: dim("upright. nothing was reloaded.") };
  };

  let reverse = false;
  let speed: number | null = null;

  for (let i = 0; i < args.length; i++) {
    const a = args[i].toLowerCase();
    if (a === "-r" || a === "--reverse") {
      reverse = true;
    } else if (a === "-h" || a === "--help") {
      return { lines: dim(...SPIN_HELP) };
    } else if (["stop", "off", "reset", "0"].includes(a)) {
      if (now.mode === "off") return { lines: err("spin: nothing is spinning") };
      return upright();
    } else if (a === "-f") {
      if (now.mode === "frozen")
        return { lines: err("spin: -f: already frozen", "spin to stand it back up.") };
      if (now.mode === "off") return { lines: err("spin: -f: nothing is spinning", "bad usage.") };
      const angle = siteAngle();
      set({ spin: { ...now, mode: "frozen", angle } });
      return { lines: dim(`stopped at ${angle.toFixed(1)}°. everything still works. mostly.`) };
    } else {
      // -s 3, --speed 3 and -s3 all work
      const raw =
        a === "-s" || a === "--speed" ? args[++i] : a.startsWith("-s") ? a.slice(2) : null;
      if (raw === null) return { lines: err(`spin: unrecognized option '${a}'`, SPIN_USAGE) };
      const n = Number(raw);
      if (!raw || !(n > 0))
        return { lines: err(`spin: -s: '${raw ?? ""}' is not a positive number`, SPIN_USAGE) };
      speed = Math.min(Math.max(n, 0.15), 60);
    }
  }

  const turning = now.mode === "cw" || now.mode === "ccw";
  // bare `spin` (and `spin -r` while already going ccw) is the off switch
  if ((turning || now.mode === "frozen") && speed === null && !reverse) return upright();
  if (now.mode === "ccw" && reverse && speed === null) return upright();

  const next = speed ?? (turning ? now.speed : 2);
  const angle = turning || now.mode === "frozen" ? siteAngle() : 0;
  set({ spin: { mode: reverse ? "ccw" : "cw", angle, speed: next } });
  return {
    lines: dim(
      `${reverse ? "spinning, counter clockwise" : "spinning"} - ${next}s per turn.`,
      "spin -s <sec> to change speed, spin -f to freeze, spin to stop.",
    ),
  };
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const long = (hex: string) =>
  hex.length === 4 ? "#" + [...hex.slice(1)].map((c) => c + c).join("") : hex.toLowerCase();

function theme(args: string[]): Result {
  const s = get();
  const name = (args[0] ?? "").toLowerCase();
  const list = `available: ${THEMES.join(", ")}, custom`;
  if (!name) return { lines: err("theme: missing name", list) };

  if (name === "custom") return customTheme(args.slice(1));

  if (!THEMES.includes(name as Theme)) return { lines: err(`theme: ${name}: no such theme`, list) };
  if (s.theme === name) return { lines: err(`theme: ${name} is already applied`) };
  if (name === "light") {
    return { lines: out("light mode. this will forcibly illuminate your retinas."), ask: "light" };
  }
  set({ theme: name as Theme });
  return { lines: dim(`theme: ${name}`) };
}

// theme custom bg=#111 fg=#ccc accent=#e8c87a panel=#181818
// theme custom --bg #111 --accent #fc0
function customTheme(args: string[]): Result {
  const s = get();
  const custom = { ...s.custom };
  for (let i = 0; i < args.length; i++) {
    let [key, value] = args[i].replace(/^--?/, "").split("=");
    if (value === undefined) value = args[++i] ?? "";
    key = key.toLowerCase();
    if (!(key in custom))
      return {
        lines: err(`theme: custom: unknown colour '${key}'`, "use bg, fg, accent or panel."),
      };
    if (!HEX.test(value))
      return { lines: err(`theme: custom: '${value}' is not a hex colour like #e8c87a`) };
    custom[key as keyof typeof custom] = long(value);
  }
  set({ theme: "custom", custom });
  if (args.length) return { lines: dim("theme: custom") };
  if (!s.wins.some((w) => w.app === "colours")) openWindow("colours");
  return { lines: dim("theme: custom. the colour window is open.") };
}
