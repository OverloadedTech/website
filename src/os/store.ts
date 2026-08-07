import { useSyncExternalStore } from "react";

export type ThemeName = "default" | "green" | "red" | "cyan" | "light" | "aero" | "custom";

export type ServiceName =
  | "lucazani.service"
  | "duck.service"
  | "networking.service"
  | "storage.service";

export type AppId =
  | "terminal"
  | "doom"
  | "cube3d"
  | "browser"
  | "editor"
  | "taskmgr"
  | "kiosk"
  | "paint"
  | "manual";


export type TermLine = { t: "out" | "in" | "err" | "dim"; v: string };

export type WinState = {
  id: number;
  app: AppId;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  // per-app payload
  lines?: TermLine[];
  history?: string[];
  cwdUser?: string;
  url?: string;
  file?: string | null;
  draft?: string;
};

export type SpinMode = "none" | "cw" | "ccw" | "frozen";

export type CustomTheme = {
  bg: string;
  fg: string;
  accent: string;
  panel: string;
};

export type OsState = {
  booted: boolean;
  theme: ThemeName;
  custom: CustomTheme;
  services: Record<ServiceName, "active" | "inactive">;
  windows: WinState[];
  /** windows hidden behind the kiosk; restored when lucazani.service stops */
  stashed: WinState[];

  nextId: number;
  nextZ: number;
  icons: Record<string, { col: number; row: number }>;
  files: Record<string, string>;
  spin: SpinMode;
  spinAngle: number;
  /** seconds per full rotation */
  spinSpeed: number;

  themePanel: boolean;
  bsod: null | "network" | "duck";
  duckFight: boolean;
  kioskBooting: boolean;
  mercy: boolean;
  mobileWarn: boolean;
  mobileAck: boolean;
  /** true once the visitor has been through the desktop and come back to the site */
  cycled: boolean;
  /** paint drawing hung on the desktop; deliberately not persisted */
  wallpaper: string | null;
};

export const SERVICES: ServiceName[] = [
  "lucazani.service",
  "duck.service",
  "networking.service",
  "storage.service",
];

export const STORAGE_KEY = "guest@lucazani";

/**
 * Session-scoped storage on purpose: the guest session lives in sessionStorage,
 * so it dies with the tab and never lingers on a shared machine. Falls back to
 * an in-memory shim if storage is blocked (private mode, hardened browsers).
 */
const memoryStore = new Map<string, string>();

function store(): Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  try {
    if (typeof sessionStorage !== "undefined") return sessionStorage;
  } catch {
    /* blocked */
  }
  return {
    getItem: (k: string) => memoryStore.get(k) ?? null,
    setItem: (k: string, v: string) => void memoryStore.set(k, v),
    removeItem: (k: string) => void memoryStore.delete(k),
  };
}

/** Older builds persisted to localStorage; scrub any leftovers on this machine. */
function purgeLegacy() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

const defaultState = (): OsState => ({
  booted: false,
  theme: "default",
  custom: { bg: "#111111", fg: "#cccccc", accent: "#e8c87a", panel: "#181818" },
  services: {
    "lucazani.service": "active",
    "duck.service": "active",
    "networking.service": "active",
    "storage.service": "active",
  },
  windows: [],
  stashed: [],

  nextId: 1,
  nextZ: 10,
  icons: {},
  files: {},
  spin: "none",
  spinAngle: 0,
  spinSpeed: 2,

  themePanel: false,
  bsod: null,
  duckFight: false,
  kioskBooting: false,
  mercy: false,
  mobileWarn: false,
  mobileAck: false,
  cycled: false,
  wallpaper: null,
});

let state: OsState = defaultState();
const listeners = new Set<() => void>();

const persistable = (s: OsState) => {
  const { bsod, duckFight, kioskBooting, booted, mercy, mobileWarn, wallpaper, ...rest } = s;
  void wallpaper;
  void bsod;
  void duckFight;
  void kioskBooting;
  void booted;
  void mercy;
  void mobileWarn;
  return rest;
};

function persist() {
  try {
    store().setItem(STORAGE_KEY, JSON.stringify(persistable(state)));
  } catch {
    /* storage unavailable */
  }
}

export function hydrate() {
  if (state.booted) return;
  purgeLegacy();
  // A reload always drops you back on the plain site: nothing survives the refresh.
  try {
    store().removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
  state = { ...defaultState(), booted: true };
  emit();
}

function emit() {
  listeners.forEach((l) => l());
}

export function setState(patch: Partial<OsState> | ((s: OsState) => Partial<OsState>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  persist();
  emit();
}

export function getState() {
  return state;
}

const serverSnapshot = defaultState();

export function useOs<T>(selector: (s: OsState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selector(state),
    () => selector(serverSnapshot),
  );
}

/* ---------- window helpers ---------- */

const APP_TITLES: Record<AppId, string> = {
  terminal: "guest@lucazani: ~",
  doom: "doom",
  cube3d: "geometry (webgl)",
  browser: "browser",
  editor: "mousepad",
  taskmgr: "task manager",
  kiosk: "Kiosk",
  paint: "paint",
  manual: "manual",
};

const APP_SIZE: Record<AppId, { w: number; h: number }> = {
  terminal: { w: 720, h: 440 },
  doom: { w: 680, h: 460 },
  cube3d: { w: 520, h: 520 },
  browser: { w: 820, h: 560 },
  editor: { w: 560, h: 420 },
  taskmgr: { w: 560, h: 440 },
  kiosk: { w: 900, h: 600 },
  paint: { w: 880, h: 640 },
  manual: { w: 720, h: 560 },
};

export const MAX_WINDOWS = 10;

export function openWindow(app: AppId, extra: Partial<WinState> = {}): number | null {
  const s = getState();
  const live = s.windows.length;
  if (live >= MAX_WINDOWS) {
    setState({ mercy: true });
    return null;
  }
  const size = APP_SIZE[app];
  const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const small = vw < 760;
  const w = Math.min(size.w, vw - 40);
  const h = Math.min(size.h, vh - 80);
  const offset = small ? 0 : (live % 6) * 26;
  const id = s.nextId;
  const win: WinState = {
    id,
    app,
    title: APP_TITLES[app],
    x: Math.max(12, vw - w - 40 - offset),
    y: Math.max(12, vh - h - 60 - offset),
    w,
    h,
    z: s.nextZ + 1,
    minimized: false,
    // phones have no room for free-floating windows: start them full-screen
    maximized: small,

    ...(app === "terminal" ? { lines: [], history: [] } : {}),
    ...(app === "browser" ? { url: "about:blank" } : {}),
    ...(app === "editor" ? { file: null, draft: "" } : {}),
    ...extra,
  };
  setState({ windows: [...s.windows, win], nextId: id + 1, nextZ: s.nextZ + 1 });
  return id;
}

export function updateWindow(id: number, patch: Partial<WinState>) {
  setState((s) => ({
    windows: s.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)),
  }));
}

export function closeWindow(id: number) {
  setState((s) => {
    const windows = s.windows.filter((w) => w.id !== id);
    // the terminal is the only way to stop the spin, so closing the last one
    // must stand the machine back up instead of leaving it stuck turning
    const stopSpin = windows.every((w) => w.app !== "terminal");
    return stopSpin
      ? { windows, spin: "none" as SpinMode, spinAngle: 0 }
      : { windows };
  });
}

export function focusWindow(id: number) {
  setState((s) => ({
    nextZ: s.nextZ + 1,
    windows: s.windows.map((w) => (w.id === id ? { ...w, z: s.nextZ + 1, minimized: false } : w)),
  }));
}

export function logoutReset() {
  try {
    store().removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
  purgeLegacy();
  memoryStore.clear();
  state = { ...defaultState(), booted: true };
  emit();
}

/**
 * True when the guest session has left something worth wiping - open windows,
 * a stashed kiosk, a non-default theme, or the "cycled" footer flag. Used by
 * the idle watchdog so a casual visitor who never touched the escape layer
 * never sees a "session cleared" notice (there is nothing to clear).
 */
export function sessionIsDirty(): boolean {
  const s = state;
  return (
    s.windows.length > 0 ||
    s.stashed.length > 0 ||
    s.cycled ||
    s.theme !== "default" ||
    s.spin !== "none" ||
    s.mobileAck
  );
}

/* ---------- viewport reflow ---------- */

export const MOBILE_BP = 760;

/** Re-fits one window to the current viewport, honouring the mobile breakpoint. */
function refit(w: WinState, vw: number, vh: number, small: boolean, wasSmall: boolean): WinState {
  // phones have no room for floating windows: force full screen while narrow,
  // and hand the window back its floating geometry when the screen grows again
  if (small) return { ...w, maximized: true };
  const next = { ...w, maximized: wasSmall ? false : w.maximized };
  const width = Math.max(240, Math.min(next.w, vw - 24));
  const height = Math.max(160, Math.min(next.h, vh - 80));
  return {
    ...next,
    w: width,
    h: height,
    // never let a window sit outside the screen: that is how "hidden" windows
    // appear after a resize and only show up again when the page is stretched
    x: Math.max(0, Math.min(next.x, vw - width)),
    y: Math.max(0, Math.min(next.y, vh - height)),
  };
}

let lastSmall: boolean | null = null;
let lastVw = 0;
let lastVh = 0;

/** Called on viewport resize / rotation: keeps every window reachable. */
export function reflowViewport() {
  if (typeof window === "undefined") return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const small = vw < MOBILE_BP;
  // On phones the on-screen keyboard and the collapsing URL bar fire `resize`
  // with the same width and a shorter height. Re-fitting there makes every
  // window jump mid-typing, so ignore height-only changes on small screens.
  const heightOnly = lastVw === vw && lastVh !== vh;
  if (small && heightOnly && lastSmall === true) {
    lastVh = vh;
    return;
  }
  const wasSmall = lastSmall ?? small;
  lastSmall = small;
  lastVw = vw;
  lastVh = vh;
  setState((s) => ({
    windows: s.windows.map((w) => refit(w, vw, vh, small, wasSmall)),
    stashed: s.stashed.map((w) => refit(w, vw, vh, small, wasSmall)),
    // the small-screen warning is meaningless once the window is wide again
    mobileWarn: small ? s.mobileWarn : false,
  }));
}

/** Clamps a floating geometry so it always lands fully inside the viewport. */
export function clampGeom(g: { x: number; y: number; w: number; h: number }) {
  if (typeof window === "undefined") return g;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.max(240, Math.min(g.w, vw - 24));
  const h = Math.max(160, Math.min(g.h, vh - 80));
  return {
    w,
    h,
    x: Math.max(0, Math.min(g.x, vw - w)),
    y: Math.max(0, Math.min(g.y, vh - h)),
  };
}

