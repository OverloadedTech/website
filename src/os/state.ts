import { useEffect, useReducer, useRef } from "preact/hooks";

// never saved anywhere, a reload resets all of it

export type Theme = "default" | "green" | "red" | "cyan" | "light" | "aero" | "custom";
export type Unit = "lucazani.service" | "duck.service" | "networking.service" | "storage.service";
export type App =
  | "terminal"
  | "kiosk"
  | "browser"
  | "mousepad"
  | "doom"
  | "taskmgr"
  | "paint"
  | "geometry"
  | "manual"
  | "colours";
export type SpinMode = "off" | "cw" | "ccw" | "frozen";
export type Overlay = null | "bsod" | "duck" | "mercy" | "mobile";

export type Win = {
  id: number;
  app: App;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  min: boolean;
  max: boolean;
  url?: string;
  file?: string;
};

export type State = {
  theme: Theme;
  custom: { bg: string; fg: string; accent: string; panel: string };
  units: Record<Unit, boolean>;
  wins: Win[];
  // hidden behind the kiosk until lucazani.service stops
  stash: Win[];
  nextId: number;
  topZ: number;
  icons: Record<string, { col: number; row: number }>;
  files: Record<string, string>;
  spin: { mode: SpinMode; angle: number; speed: number };
  overlay: Overlay;
  booting: boolean;
  mobileOk: boolean;
  // been to the desktop and back, shows the footer line
  cycled: boolean;
  wallpaper: string | null;
};

export const UNITS: Unit[] = [
  "lucazani.service",
  "duck.service",
  "networking.service",
  "storage.service",
];

const fresh = (): State => ({
  theme: "default",
  custom: { bg: "#121110", fg: "#d4cfc3", accent: "#f0bf4c", panel: "#1a1917" },
  units: {
    "lucazani.service": true,
    "duck.service": true,
    "networking.service": true,
    "storage.service": true,
  },
  wins: [],
  stash: [],
  nextId: 1,
  topZ: 10,
  icons: {},
  files: {},
  spin: { mode: "off", angle: 0, speed: 2 },
  overlay: null,
  booting: false,
  mobileOk: false,
  cycled: false,
  wallpaper: null,
});

let state = fresh();
const subs = new Set<() => void>();

export const get = () => state;

export function set(patch: Partial<State> | ((s: State) => Partial<State>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  subs.forEach((fn) => fn());
}

export function subscribe(fn: () => void) {
  subs.add(fn);
  return () => void subs.delete(fn);
}

export function reset() {
  state = fresh();
  subs.forEach((fn) => fn());
}

// only rerenders when the picked value changes
export function useOs<T>(pick: (s: State) => T): T {
  const value = pick(state);
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const latest = useRef({ pick, value });
  latest.current = { pick, value };
  useEffect(
    () =>
      subscribe(() => {
        const { pick, value } = latest.current;
        if (!Object.is(pick(state), value)) rerender(0);
      }),
    [],
  );
  return value;
}

export const kioskOn = () => state.units["lucazani.service"];
export const isPhone = () => window.innerWidth < 760;

const TITLES: Record<App, string> = {
  terminal: "guest@lucazani: ~",
  kiosk: "Kiosk",
  browser: "browser",
  mousepad: "mousepad",
  doom: "doom",
  taskmgr: "task manager",
  paint: "paint",
  geometry: "geometry.gl",
  manual: "manual",
  colours: "theme custom",
};

const SIZES: Record<App, [number, number]> = {
  terminal: [720, 440],
  kiosk: [900, 600],
  browser: [820, 560],
  mousepad: [560, 420],
  doom: [680, 460],
  taskmgr: [560, 440],
  paint: [880, 640],
  geometry: [520, 520],
  manual: [720, 560],
  colours: [300, 280],
};

export const MAX_WINDOWS = 10;

export function openWindow(app: App, extra: Partial<Win> = {}) {
  const s = state;
  if (s.wins.length >= MAX_WINDOWS) {
    set({ overlay: "mercy" });
    return;
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(SIZES[app][0], vw - 40);
  const h = Math.min(SIZES[app][1], vh - 80);
  const step = isPhone() ? 0 : (s.wins.length % 6) * 26;
  const win: Win = {
    id: s.nextId,
    app,
    title: TITLES[app],
    x: Math.max(12, vw - w - 40 - step),
    y: Math.max(12, vh - h - 60 - step),
    w,
    h,
    z: s.topZ + 1,
    min: false,
    max: isPhone(),
    ...extra,
  };
  set({ wins: [...s.wins, win], nextId: win.id + 1, topZ: win.z });
}

export function updateWindow(id: number, patch: Partial<Win>) {
  set((s) => ({ wins: s.wins.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
}

export function focusWindow(id: number) {
  set((s) => {
    const win = s.wins.find((w) => w.id === id);
    if (!win || (win.z === s.topZ && !win.min)) return {};
    return {
      topZ: s.topZ + 1,
      wins: s.wins.map((w) => (w.id === id ? { ...w, z: s.topZ + 1, min: false } : w)),
    };
  });
}

export function closeWindow(id: number) {
  set((s) => {
    const wins = s.wins.filter((w) => w.id !== id);
    // no terminal left = no way to stop the spin
    if (!wins.some((w) => w.app === "terminal")) {
      return { wins, spin: { ...s.spin, mode: "off" as const, angle: 0 } };
    }
    return { wins };
  });
}

export function requestTerminal() {
  const s = state;
  if (isPhone() && !s.mobileOk) {
    set({ overlay: "mobile" });
    return;
  }
  const term = s.wins.find((w) => w.app === "terminal");
  if (term) focusWindow(term.id);
  else openWindow("terminal");
}

// terminals stay, everything else hides behind the kiosk
export function startKiosk() {
  if (state.booting) return;
  set((s) => ({
    units: { ...s.units, "lucazani.service": true },
    booting: true,
    cycled: s.cycled || !s.units["lucazani.service"],
    wins: s.wins.filter((w) => w.app === "terminal"),
    stash: [...s.stash, ...s.wins.filter((w) => w.app !== "terminal" && w.app !== "kiosk")],
  }));
  setTimeout(() => set({ booting: false }), 4300);
}

export const dirty = () =>
  state.wins.length > 0 ||
  state.stash.length > 0 ||
  state.cycled ||
  state.theme !== "default" ||
  state.spin.mode !== "off";

let wasPhone: boolean | null = null;
let lastW = 0;

export function refit() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const phone = vw < 760;
  // phone keyboard only changes the height, ignore that
  if (phone && wasPhone && vw === lastW) return;
  const grew = wasPhone === true && !phone;
  wasPhone = phone;
  lastW = vw;

  const fit = (w: Win): Win => {
    if (phone) return { ...w, max: true };
    const width = Math.max(240, Math.min(w.w, vw - 24));
    const height = Math.max(160, Math.min(w.h, vh - 80));
    return {
      ...w,
      max: grew ? false : w.max,
      w: width,
      h: height,
      x: Math.max(0, Math.min(w.x, vw - width)),
      y: Math.max(0, Math.min(w.y, vh - height)),
    };
  };
  set((s) => ({
    wins: s.wins.map(fit),
    stash: s.stash.map(fit),
    overlay: s.overlay === "mobile" && !phone ? null : s.overlay,
  }));
}
