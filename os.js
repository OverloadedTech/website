(function () {
  "use strict";

  const DUCK_ASCII = ["   __", " <(o )___", "  ( ._> /", "   `---'"].join("\n");

  function calcAge() {
    const birth = new Date(2008, 7, 18);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  }

  const PAGES = [
    { name: "home", path: "/", label: "lucazani.com" },
    { name: "projects", path: "/projects", label: "projects" },
    { name: "blog", path: "/blog", label: "blog" },
    { name: "likes", path: "/likes", label: "likes" },
    { name: "contact", path: "/contact", label: "contact" },
  ];

  const FILE_OF = {
    "/": "index.html",
    "/projects": "projects.html",
    "/blog": "blog.html",
    "/likes": "likes.html",
    "/contact": "contact.html",
    "/404": "404.html",
  };

  function fileOfPath(p) {
    if (p.startsWith("/blog/") && p.length > 6) return "posts/" + p.slice(6) + ".html";
    return FILE_OF[p] || "index.html";
  }

  function pageOfFile(p) {
    const base = String(p || "").split(/[?#]/)[0];
    const name = (base.split("/").pop() || "").toLowerCase();
    for (const [f, path] of Object.entries(FILE_OF)) {
      if (name === f) return path;
    }
    const m = name.match(/^([\w-]+)\.html$/);
    if (m && m[1] !== "index") return "/blog/" + m[1];
    return "/";
  }

  const CURRENT_PATH = pageOfFile(window.location.pathname);

  // number of leading directories the current page sits in; navigation must
  // walk back out of them when we are inside /posts/, or relative targets
  // like "index.html" would resolve against the wrong directory.
  function rootDepth() {
    const parts = (window.location.pathname || "").split("/").filter(Boolean);
    const dirs = parts.length ? parts.slice(0, -1) : [];
    return dirs.length;
  }

  function rootPrefix() {
    if (rootDepth() === 0) return "";
    return "../".repeat(rootDepth());
  }

  function navigate(path) {
    window.location.assign(rootPrefix() + fileOfPath(path));
  }

  function pageByName(name) {
    return PAGES.find((p) => p.name === name.replace(/^\/+|\.html$/g, "").toLowerCase());
  }

  function h(tag, props, kids) {
    const node = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === "class") node.className = v;
        else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
        else if (k === "html") node.innerHTML = v;
        else if (k.startsWith("on") && typeof v === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (k === "dataset") Object.assign(node.dataset, v);
        else node.setAttribute(k, v);
      }
    }
    const flat = Array.isArray(kids) ? kids.flat() : [kids];
    for (const kid of flat) {
      if (kid == null || kid === false) continue;
      node.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return node;
  }

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const APP_TITLES = {
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

  const APP_SIZE = {
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

  const SERVICES = [
    "lucazani.service",
    "duck.service",
    "networking.service",
    "storage.service",
  ];

  const THEMES = ["default", "green", "red", "cyan", "light", "aero"];

  const STORAGE_KEY = "guest@lucazani";

  function defaultState() {
    return {
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
    };
  }

  let state = defaultState();
  const listeners = new Set();
  const memoryStore = new Map();

  function storage() {
    try {
      if (typeof sessionStorage !== "undefined") return sessionStorage;
    } catch (e) {}
    return {
      getItem: (k) => memoryStore.get(k) ?? null,
      setItem: (k, v) => void memoryStore.set(k, v),
      removeItem: (k) => void memoryStore.delete(k),
    };
  }

  function purgeLegacy() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function persistable(s) {
    const p = { ...s };
    delete p.bsod;
    delete p.duckFight;
    delete p.kioskBooting;
    delete p.booted;
    delete p.mercy;
    delete p.mobileWarn;
    delete p.wallpaper;
    return p;
  }

  function persist() {
    try {
      storage().setItem(STORAGE_KEY, JSON.stringify(persistable(state)));
    } catch (e) {}
  }

  function emit() {
    listeners.forEach((l) => l());
  }

  function getState() {
    return state;
  }

  function setState(patch) {
    const p = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...p };
    persist();
    emit();
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function hydrate() {
    if (state.booted) return;
    purgeLegacy();
    try {
      const raw = storage().getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        state = { ...defaultState(), ...saved, booted: true };
        return;
      }
    } catch (e) {}
    state = { ...defaultState(), booted: true };
  }

  function logoutReset() {
    try {
      storage().removeItem(STORAGE_KEY);
    } catch (e) {}
    purgeLegacy();
    memoryStore.clear();
    state = { ...defaultState(), booted: true };
    emit();
  }

  function sessionIsDirty() {
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

  function openWindow(app, extra) {
    const s = getState();
    const live = s.windows.length;
    if (live >= 10) {
      setState({ mercy: true });
      return null;
    }
    const size = APP_SIZE[app];
    const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
    const vh = typeof window === "undefined" ? 800 : window.innerHeight;
    const small = vw < 760;
    const w = Math.min(size.w, vw - 40);
    const hh = Math.min(size.h, vh - 80);
    const offset = small ? 0 : (live % 6) * 26;
    const id = s.nextId;
    const win = {
      id,
      app,
      title: APP_TITLES[app],
      x: Math.max(12, vw - w - 40 - offset),
      y: Math.max(12, vh - hh - 60 - offset),
      w,
      h: hh,
      z: s.nextZ + 1,
      minimized: false,
      maximized: small,
      ...(app === "terminal" ? { lines: [], history: [] } : {}),
      ...(app === "browser" ? { url: "about:blank" } : {}),
      ...(app === "editor" ? { file: null, draft: "" } : {}),
      ...(extra || {}),
    };
    setState({
      windows: [...s.windows, win],
      nextId: id + 1,
      nextZ: s.nextZ + 1,
    });
    return id;
  }

  function updateWindow(id, patch) {
    setState((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));
  }

  function closeWindow(id) {
    setState((s) => {
      const windows = s.windows.filter((w) => w.id !== id);
      const stopSpin = windows.every((w) => w.app !== "terminal");
      return stopSpin
        ? { windows, spin: "none", spinAngle: 0 }
        : { windows };
    });
  }

  function focusWindow(id) {
    setState((s) => ({
      nextZ: s.nextZ + 1,
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, z: s.nextZ + 1, minimized: false } : w
      ),
    }));
  }

  function isMobileViewport() {
    return typeof window !== "undefined" && window.innerWidth < 760;
  }

  function isEmbedded() {
    return (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("embed")
    );
  }

  const INCEPTION_EVENT = "os:inception-duck";

  function requestTerminal() {
    if (isEmbedded()) {
      window.dispatchEvent(new CustomEvent(INCEPTION_EVENT));
      return;
    }
    const s = getState();
    if (isMobileViewport() && !s.mobileAck) {
      setState({ mobileWarn: true });
      return;
    }
    const existing = s.windows.find((w) => w.app === "terminal");
    if (existing) {
      setState({
        nextZ: s.nextZ + 1,
        windows: s.windows.map((w) =>
          w.id === existing.id ? { ...w, minimized: false, z: s.nextZ + 1 } : w
        ),
      });
      return;
    }
    openWindow("terminal");
  }

  function elAngle(el) {
    if (!el || typeof window === "undefined") return 0;
    const t = getComputedStyle(el).transform;
    if (!t || t === "none") return 0;
    try {
      const m = new DOMMatrixReadOnly(t);
      const deg = (Math.atan2(m.b, m.a) * 180) / Math.PI;
      return ((deg % 360) + 360) % 360;
    } catch (e) {
      return 0;
    }
  }

  function liveSpinAngle() {
    if (typeof document === "undefined") return 0;
    const el =
      document.querySelector(".spin-stage") || document.querySelector(".spin-root");
    return elAngle(el);
  }

  function unspinDeltaBy(dx, dy, deg) {
    if (!deg) return { x: dx, y: dy };
    const r = (-deg * Math.PI) / 180;
    return {
      x: dx * Math.cos(r) - dy * Math.sin(r),
      y: dx * Math.sin(r) + dy * Math.cos(r),
    };
  }

  function unspinAround(x, y, deg, cx, cy) {
    const d = unspinDeltaBy(x - cx, y - cy, deg);
    return { x: cx + d.x, y: cy + d.y };
  }

  function spinClass(spin) {
    return spin === "cw" ? "spin-cw" : spin === "ccw" ? "spin-ccw" : "";
  }

  function spinStyle(spin, angle, speed) {
    if (spin === "frozen") return { transform: `rotate(${angle}deg)` };
    if (spin === "cw" || spin === "ccw") {
      const delay = ((spin === "cw" ? angle : 360 - angle) / 360) * speed;
      return { animationDuration: `${speed}s`, animationDelay: `-${delay}s` };
    }
    return null;
  }

  const GLYPH_SVGS = {
    terminal:
      '<rect x="2.5" y="4" width="19" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 9.5 9.5 12l-3 2.5M12.5 15h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    kiosk:
      '<rect x="2.5" y="4" width="19" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.5 8h19M8 20.5h8M12 17v3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 11.5h6M6 14h9" opacity="0.65" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    browser:
      '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.3 9h17.4M3.3 15h17.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    editor:
      '<path d="M6 3h8l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 3v4h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12h6M9 15.5h6M9 8.5h2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    doom:
      '<path d="M12 3.5c-4 0-7 2.7-7 6.6 0 2.3.9 3.6.9 5.6 0 1.7 1.2 3 2.6 3 1 0 1.6-.6 1.9-1.4l.6-1.6h2l.6 1.6c.3.8.9 1.4 1.9 1.4 1.4 0 2.6-1.3 2.6-3 0-2 .9-3.3.9-5.6 0-3.9-3-6.6-7-6.6Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 10.2 10.8 11 9 11.9M15 10.2 13.2 11l1.8.9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    taskmgr:
      '<rect x="2.5" y="4" width="19" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 16l3-4 2.5 2.5L14 10l4 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.5 8h19" opacity="0.65" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    paint:
      '<path d="M12 3.5c-4.7 0-8.5 3.5-8.5 7.8 0 4.3 3.4 6.2 6 6.2 1.4 0 2-.7 2-1.5 0-.9-.9-1.2-.9-2.2 0-.8.7-1.5 1.7-1.5h2.2c3 0 5.5-2 5.5-4.6 0-2.5-3-4.2-8-4.2Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="10" r="1.05" fill="currentColor"/><circle cx="12" cy="8" r="1.05" fill="currentColor"/><circle cx="16" cy="10.5" r="1.05" fill="currentColor"/>',
    cube3d:
      '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 7.5 12 12l8-4.5M12 12v9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    manual:
      '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 0 4 20.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 7.5h7M8 11h5" opacity="0.7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    file:
      '<path d="M6.5 3h7l4.5 4.5V21h-11.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.5 3v4.5H18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 13h6M9 16.5h4" opacity="0.7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  function glyphSvg(name) {
    return GLYPH_SVGS[name] || GLYPH_SVGS.file;
  }

  function AppGlyph(name, cls) {
    return h("span", {
      class: cls ? "app-glyph " + cls : "app-glyph",
      "aria-hidden": "true",
      html:
        '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true" focusable="false">' +
        glyphSvg(name) +
        "</svg>",
    });
  }

  const SNAP_LABEL = {
    max: "full",
    left: "left half",
    right: "right half",
    top: "top half",
    bottom: "bottom half",
    tl: "top left",
    tr: "top right",
    bl: "bottom left",
    br: "bottom right",
  };

  const MIN_W = 260;
  const MIN_H = 160;
  const EDGE = 28;

  function chromeTop() {
    const el = document.querySelector(".desktop-topbar");
    return el ? Math.round(el.getBoundingClientRect().height) : 0;
  }

  function chromeBottom() {
    const el = document.querySelector(".taskbar");
    return el ? Math.round(el.getBoundingClientRect().height) : 0;
  }

  function zoneFor(x, y) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ct = chromeTop();
    const topMax = y <= ct + 10;
    const top = y <= ct + EDGE;
    const bottom = y >= h - chromeBottom() - EDGE;
    const left = x <= EDGE;
    const right = x >= w - EDGE;
    if (top && left) return "tl";
    if (top && right) return "tr";
    if (bottom && left) return "bl";
    if (bottom && right) return "br";
    if (topMax) return "max";
    if (top) return "top";
    if (bottom) return "bottom";
    if (left) return "left";
    if (right) return "right";
    return null;
  }

  function zoneGeom(z) {
    const t = chromeTop();
    const b = chromeBottom();
    const W = window.innerWidth;
    const H = window.innerHeight - t - b;
    const half = { w: Math.round(W / 2), h: Math.round(H / 2) };
    switch (z) {
      case "max":
        return { x: 0, y: t, w: W, h: H };
      case "left":
        return { x: 0, y: t, w: half.w, h: H };
      case "right":
        return { x: half.w, y: t, w: W - half.w, h: H };
      case "top":
        return { x: 0, y: t, w: W, h: half.h };
      case "bottom":
        return { x: 0, y: t + half.h, w: W, h: H - half.h };
      case "tl":
        return { x: 0, y: t, w: half.w, h: half.h };
      case "tr":
        return { x: half.w, y: t, w: W - half.w, h: half.h };
      case "bl":
        return { x: 0, y: t + half.h, w: half.w, h: H - half.h };
      case "br":
        return { x: half.w, y: t + half.h, w: W - half.w, h: H - half.h };
    }
  }

  const HELP_ROWS = [
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

  function helpLines() {
    const body = HELP_ROWS.map(
      ([cmd, desc]) => `  ${cmd.padEnd(24)}${desc}`.trimEnd()
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

  function out() {
    return Array.prototype.map.call(arguments, (x) => ({ t: "out", v: x }));
  }
  function err() {
    return Array.prototype.map.call(arguments, (x) => ({ t: "err", v: x }));
  }
  function dim() {
    return Array.prototype.map.call(arguments, (x) => ({ t: "dim", v: x }));
  }

  function unitOf(name) {
    const n = name.toLowerCase();
    const full = n.endsWith(".service") ? n : n + ".service";
    return SERVICES.includes(full) ? full : null;
  }

  function hash(s) {
    let hh = 0;
    for (let i = 0; i < s.length; i++) hh = (hh << 5) - hh + s.charCodeAt(i);
    return hh;
  }

  function startKiosk() {
    const s = getState();
    if (s.kioskBooting) return;
    setState((st) => ({
      services: { ...st.services, "lucazani.service": "active" },
      kioskBooting: true,
      cycled: st.cycled || st.services["lucazani.service"] === "inactive",
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

  function spinCmd(args) {
    const s = getState();
    let rev = false;
    let speed = null;
    for (let i = 0; i < args.length; i++) {
      const a = args[i].toLowerCase();
      if (a === "-r" || a === "--reverse") {
        rev = true;
        continue;
      }
      if (a === "-h" || a === "--help") return { lines: dim.apply(null, SPIN_HELP) };
      if (a === "stop" || a === "off" || a === "reset" || a === "0") {
        if (s.spin === "none")
          return { lines: err("spin: nothing is spinning") };
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
      if (raw === null)
        return { lines: err(`spin: unrecognized option '${a}'`, SPIN_USAGE) };
      const n = Number(raw);
      if (!raw || !Number.isFinite(n) || n <= 0)
        return { lines: err(`spin: -s: '${raw}' is not a positive number`, SPIN_USAGE) };
      speed = clamp(n, 0.15, 60);
    }
    const running = s.spin === "cw" || s.spin === "ccw";
    if ((running || s.spin === "frozen") && speed === null && !rev) {
      setState({ spin: "none", spinAngle: 0 });
      return { lines: dim("upright. nothing was reloaded.") };
    }
    if (running && rev && s.spin === "ccw" && speed === null) {
      setState({ spin: "none", spinAngle: 0 });
      return { lines: dim("upright. nothing was reloaded.") };
    }
    const next = speed ?? (running ? s.spinSpeed : DEFAULT_SPIN_SPEED);
    const from = running || s.spin === "frozen" ? liveSpinAngle() : 0;
    setState({ spin: rev ? "ccw" : "cw", spinAngle: from, spinSpeed: next });
    return {
      lines: dim(
        `${rev ? "spinning, counter clockwise" : "spinning"} - ${next}s per turn.`,
        "spin -s <sec> to change speed, spin -f to freeze, spin to stop."
      ),
    };
  }

  function themeCmd(args) {
    const s = getState();
    const name = (args[0] || "").toLowerCase();
    if (!name)
      return {
        lines: err("theme: missing name", `available: ${THEMES.join(", ")}, custom`),
      };
    if (name === "custom") {
      setState({ themePanel: true, theme: "custom" });
      return { lines: dim("colour panel open. close it and reopen with theme custom.") };
    }
    if (!THEMES.includes(name))
      return {
        lines: err(`theme: ${name}: no such theme`, `available: ${THEMES.join(", ")}, custom`),
      };
    if (s.theme === name)
      return { lines: err(`theme: ${name} is already applied`) };
    if (name === "light") {
      return {
        lines: out("light mode. this will forcibly illuminate your retinas."),
        pending: { kind: "light" },
      };
    }
    setState({ theme: name, themePanel: false });
    return { lines: dim(`theme: ${name}`) };
  }

  function systemctlCmd(args, ctx) {
    const s = getState();
    const sub = (args[0] || "").toLowerCase();
    if (sub === "list-utils" || sub === "list-units") {
      const rows = SERVICES.map((u) => {
        const st = s.services[u];
        return `  ${u.padEnd(22)} ${st === "active" ? "loaded active   running" : "loaded inactive dead"}`.trimEnd();
      });
      return {
        lines: [
          ...dim("  UNIT                   LOAD   ACTIVE  SUB"),
          ...out.apply(null, rows),
          ...dim(`  ${SERVICES.length} units listed.`),
        ],
      };
    }
    const target = args[1];
    if (!["start", "stop", "status", "restart"].includes(sub))
      return {
        lines: err(
          `systemctl: unknown operation '${sub || ""}'`,
          "usage: systemctl list-units | systemctl start|stop|status <unit>"
        ),
      };
    if (!target) return { lines: err(`systemctl ${sub}: missing unit name`) };
    const unit = unitOf(target);
    if (!unit) return { lines: err(`Unit ${target} could not be found.`) };
    const stateNow = s.services[unit];
    if (sub === "status") {
      const linesArr = [
        ...out(`● ${unit}`),
        ...dim(
          `     Loaded: loaded (/etc/systemd/system/${unit}; enabled)`,
          `     Active: ${stateNow === "active" ? "active (running)" : "inactive (dead)"}`,
          `   Main PID: ${unit === "duck.service" ? "1" : (Math.abs(hash(unit)) % 9000) + 400}`,
          unit === "duck.service" ? "      Notes: unit was not part of this image." : ""
        ),
      ].filter((l) => l.v !== "");
      return { lines: linesArr };
    }
    if (sub === "restart") {
      return {
        lines: err("systemctl: restart is not permitted for guest. stop, then start."),
      };
    }
    if (sub === "start") {
      if (stateNow === "active")
        return { lines: err(`Job for ${unit} failed: unit is already active.`) };
      if (unit === "lucazani.service") {
        startKiosk();
        return { lines: dim("Starting lucazani.service...") };
      }
      setState({ services: { ...s.services, [unit]: "active" } });
      return { lines: dim(`Starting ${unit}...`) };
    }
    if (stateNow === "inactive")
      return { lines: err(`Job for ${unit} failed: unit is not active.`) };
    if (unit === "duck.service") {
      setState({ duckFight: true });
      return {
        lines: err(
          "Failed to stop duck.service: operation not permitted.",
          "Failed to stop duck.service: operation not permitted.",
          "Failed to kill unit duck.service: no such process. unit still running."
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
        windows: [...st.stashed, ...st.windows],
        stashed: [],
      }));
      return { lines: dim("Stopping lucazani.service...") };
    }
    setState({ services: { ...s.services, [unit]: "inactive" } });
    return { lines: dim(`Stopping ${unit}...`) };
  }

  function histCmd(args, ctx) {
    const flag = (args[0] || "").toLowerCase();
    const win = getState().windows.find((w) => w.id === ctx.winId);
    const list = win ? win.history || [] : [];
    if (flag === "-c" || flag === "clear") {
      updateWindow(ctx.winId, { history: [] });
      return { lines: dim("history cleared.") };
    }
    if (flag && flag !== "-c" && flag !== "clear")
      return { lines: err(`history: ${flag}: unknown option`, "usage: history [-c]") };
    const all = [...list, "history"];
    if (all.length === 1) return { lines: dim("no commands yet.") };
    const width = String(all.length).length;
    return {
      lines: out.apply(
        null,
        all.map((c, i) => `  ${String(i + 1).padStart(width)}  ${c}`.trimEnd())
      ),
    };
  }

  function runCommand(raw, ctx) {
    let input = raw.trim();
    if (!input) return { lines: [] };
    if (/^sudo\s+/i.test(input)) input = input.replace(/^sudo\s+/i, "");
    const parts = input.split(/\s+/);
    const cmd = (parts[0] || "").toLowerCase();
    const args = parts.slice(1);
    const s = getState();
    const kiosk = s.services["lucazani.service"] === "active";
    switch (cmd) {
      case "help":
      case "?":
        return { lines: dim.apply(null, helpLines()) };
      case "clear":
        return { lines: [], clear: true };
      case "ls":
        return { lines: out(PAGES.map((p) => p.name).join("   ")) };
      case "cd":
        return {
          lines: err(
            `cd: ${args[0] || "/"}: permission denied`,
            "this session is confined."
          ),
        };
      case "whoami":
        return { lines: out("guest") };
      case "open": {
        if (!args[0]) return { lines: err("open: missing operand", "usage: open <page>") };
        const page = pageByName(args[0]);
        if (!page)
          return {
            lines: err(
              `open: ${args[0]}: no such page`,
              `try: ${PAGES.map((p) => p.name).join(", ")}`
            ),
          };
        if (!kiosk) {
          openWindow("browser", { url: page.path, title: `browser - ${page.name}` });
          return {
            lines: dim(
              `lucazani.service is not running; ${page.name} handed to the browser instead.`
            ),
          };
        }
        if (ctx.pathname === page.path)
          return { lines: err(`open: ${page.name}: already on this page`) };
        navigate(page.path);
        return { lines: dim(`opening ${page.name}...`) };
      }
      case "systemctl":
        return systemctlCmd(args, ctx);
      case "spin":
        return spinCmd(args);
      case "lore":
        return { lines: dim.apply(null, LORE) };
      case "theme":
        return themeCmd(args);
      case "logout":
        return {
          lines: out(
            "this deletes the guest user and everything recorded under it:",
            "  open windows, terminal history, desktop files and icon positions,",
            "  unit states and the current theme.",
            "the machine will come back up as if you had never been here."
          ),
          pending: { kind: "logout" },
        };
      case "history":
        return histCmd(args, ctx);
      case "exit":
        return { lines: [], close: true };
      default:
        return { lines: err(`${cmd}: command not found`, "type help.") };
    }
  }

  function applyPending(p, answer, winId) {
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

  const BANNER = [
    { t: "dim", v: "lucazani.com tty1 - guest session" },
    { t: "dim", v: "type help." },
    { t: "dim", v: "" },
  ];

  function terminalApp(win) {
    const root = h("div", { class: "term" });
    let linesEl = h("div", { class: "term-lines" });
    root.appendChild(linesEl);
    const input = h("input", {
      class: "term-input",
      type: "text",
      spellcheck: "false",
      autocomplete: "off",
      autocapitalize: "off",
      autocorrect: "off",
      "aria-label": "terminal input",
    });
    const promptEl = h("span", { class: "ps1" });
    const row = h("div", { class: "term-row" }, promptEl, input);
    root.appendChild(row);

    let pending = null;
    let hIdx = null;
    let value = "";
    let lastLinesKey = "";

    function renderLines() {
      const w = getState().windows.find((x) => x.id === win.id);
      const lines = w ? w.lines || [] : [];
      const key = lines.map((l) => l.t + ":" + l.v).join("\u0001");
      if (key === lastLinesKey) return;
      lastLinesKey = key;
      const frag = document.createDocumentFragment();
      for (const l of lines) {
        frag.appendChild(h("div", { class: l.t }, l.v || "\u00a0"));
      }
      linesEl.replaceWith(frag);
      linesEl = frag;
      root.scrollTop = root.scrollHeight;
    }

    function sync() {
      const w = getState().windows.find((x) => x.id === win.id);
      if (!w) return;
      const hist = w.history || [];
      void hist;
      renderLines();
      const vis = getState().windows.filter((x) => !x.minimized);
      const top = vis.length ? vis.reduce((a, b) => (b.z > a.z ? b : a)).id : null;
      if (pending) {
        promptEl.textContent = "continue? [y/N]\u00a0";
      } else {
        promptEl.textContent = "";
        const p1 = h("span", {}, "guest@lucazani:");
        const p2 = h("span", { class: "path" }, "~");
        const p3 = h("span", {}, "$\u00a0");
        promptEl.appendChild(p1);
        promptEl.appendChild(p2);
        promptEl.appendChild(p3);
      }
      if (!getState().kioskBooting && top === win.id && document.activeElement !== input) {
        input.focus({ preventScroll: true });
      }
    }

    const un = subscribe(sync);

    function push(next, clear) {
      const w = getState().windows.find((x) => x.id === win.id);
      if (!w) return;
      const base = clear ? [] : w.lines || [];
      updateWindow(win.id, { lines: [...base, ...next].slice(-400) });
    }

    function submit() {
      const raw = value;
      value = "";
      hIdx = null;
      input.value = "";
      const echoed = [
        { t: "in", v: `${pending ? "" : "guest@lucazani:~$ "}${raw}` },
      ];
      if (pending) {
        const res = applyPending(pending, raw, win.id);
        pending = null;
        push([...echoed, ...res, { t: "dim", v: "" }]);
        sync();
        return;
      }
      if (!raw.trim()) {
        push(echoed);
        return;
      }
      const result = runCommand(raw, {
        navigate: (p) => navigate(p),
        pathname: CURRENT_PATH,
        winId: win.id,
      });
      if (result.close) {
        closeWindow(win.id);
        return;
      }
      if (result.clear) {
        updateWindow(win.id, { lines: [] });
      } else {
        push([...echoed, ...result.lines, { t: "dim", v: "" }]);
      }
      if (raw.trim() && !result.close) {
        const w = getState().windows.find((x) => x.id === win.id);
        const hist = w ? w.history || [] : [];
        updateWindow(win.id, { history: [...hist, raw.trim()].slice(-80) });
      }
      if (result.pending) pending = result.pending;
      sync();
    }

    function onKey(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
        return;
      }
      const w = getState().windows.find((x) => x.id === win.id);
      const hist = w ? w.history || [] : [];
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (hist.length === 0) return;
        const idx = hIdx === null ? hist.length - 1 : Math.max(0, hIdx - 1);
        hIdx = idx;
        value = hist[idx] || "";
        input.value = value;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (hIdx === null) return;
        const idx = hIdx + 1;
        if (idx >= hist.length) {
          hIdx = null;
          value = "";
          input.value = "";
        } else {
          hIdx = idx;
          value = hist[idx] || "";
          input.value = value;
        }
      }
    }

    input.addEventListener("keydown", onKey);
    input.addEventListener("input", () => {
      value = input.value;
    });
    root.addEventListener("click", () => input.focus());

    const w = getState().windows.find((x) => x.id === win.id);
    if (w && (!w.lines || w.lines.length === 0)) {
      updateWindow(win.id, { lines: BANNER });
    }
    renderLines();
    setTimeout(sync, 0);

    return {
      root,
      destroy: () => {
        un();
      },
    };
  }

  function doomApp() {
    const wrap = h("div", { class: "app-pad" });
    const goBtn = h(
      "button",
      {
        class: "mini-btn",
        onclick: () => {
          wrap.innerHTML = "";
          wrap.appendChild(
            h("iframe", {
              title: "doom",
              src: "https://archive.org/embed/DoomsharewareEpisode",
              allow: "autoplay; fullscreen; gamepad; keyboard-map; pointer-lock",
              tabindex: "0",
              style: {
                display: "block",
                width: "100%",
                height: "100%",
                border: 0,
                background: "#000",
              },
            })
          );
          const f = wrap.querySelector("iframe");
          if (f) {
            f.focus();
            f.contentWindow && f.contentWindow.focus();
          }
        },
      },
      "start doom"
    );
    wrap.appendChild(h("p", {}, "DOOM (shareware, 1993). Runs in a DOS emulator inside this window."));
    wrap.appendChild(h("p", { class: "small" }, "arrows move · ctrl fire · space use · esc menu"));
    wrap.appendChild(goBtn);
    return { root: wrap };
  }

  const MANUAL = [
    {
      title: "what this is",
      body: [
        "lucazani.com is a normal personal site with a second layer hidden behind it: a small desktop environment that runs entirely in your browser. Nothing is installed, nothing leaves your machine.",
        "The site itself is served by a fictional unit called lucazani.service. While that unit is active you see the site. Stop it and the desktop underneath becomes visible.",
      ],
    },
    {
      title: "getting in and out",
      body: [
        "The duck in the footer is the escape hatch: it opens a terminal over the site.",
        "In the terminal, `systemctl stop lucazani.service` drops you to the desktop. `systemctl start lucazani.service` puts the site back and stashes your open windows behind it - they return the next time you stop the unit.",
        "`logout` ends the guest session and erases everything that was saved.",
      ],
    },
    {
      title: "the desktop",
      body: [
        "Double click an icon to open an app. Drag icons to rearrange them; positions are remembered.",
        "The taskbar at the bottom toggles windows; middle click a task to close it.",
        "The menu at the top left lists every app plus any files you saved in mousepad.",
      ],
    },
    {
      title: "windows",
      body: [
        "Drag the title bar to move, drag an edge or corner to resize.",
        "Double click the title bar to maximize or restore.",
        "Drag a window to a screen edge to snap it: top edge maximizes, just below it snaps to the top half, sides give you halves, corners give you quarters. Drag a snapped window away to tear it off again.",
        "Ten windows is the limit. Ask for an eleventh and the machine will say something about it.",
      ],
    },
    {
      title: "apps",
      body: [
        "terminal - the whole machine is driven from here. Type `help`.",
        "Kiosk - lucazani.com in a window. The ⛶ button next to minimize reloads the whole browser into kiosk mode. The escape hatch does not nest: try it in there and a duck flies over to say so.",
        "browser - tabbed, with history and an address bar. Some sites refuse to be framed; that is them, not this.",
        "mousepad - a text editor. Saved files appear on the desktop.",
        "paint - open it from the desktop or the start menu. Canvas with pencil, brush, eraser, shapes, fill, spray, text and an eyedropper. Import by file, drag-and-drop or paste; export PNG or JPG; `set as desktop` hangs your drawing on the wall until the page reloads.",
        "geometry.gl - spin, colour and deform solids. Drag to rotate, scroll to zoom, double click to reset.",
        "doom - shareware DOOM in a DOS emulator. Click it and play.",
        "task manager - running units and windows, killable.",
      ],
    },
    {
      title: "themes",
      body: [
        "`theme <name>` switches between default, green, red, cyan, light and aero.",
        "`theme custom bg=#111 fg=#ccc accent=#e8c87a panel=#181818` sets any subset of colours; flags like `--bg #111` work too.",
      ],
    },
    {
      title: "how not to go crazy",
      body: [
        "Nothing here can break your computer, and nothing here is a real system. Crashes, blue screens and angry ducks are part of the furniture.",
        "If a state gets stuck, `logout` in the terminal resets everything to a clean guest session.",
      ],
    },
  ];

  function manualApp() {
    let active = 0;
    let query = "";
    const root = h("div", { class: "manual" });
    const navEl = h("aside", { class: "manual-nav" });
    const bodyEl = h("div", { class: "manual-body" });
    const search = h("input", {
      class: "manual-search",
      type: "text",
      spellcheck: "false",
      placeholder: "search",
      "aria-label": "search the manual",
    });

    function listMatches(q) {
      return q
        ? MANUAL.map((s, i) => i).filter((i) => {
            const sec = MANUAL[i];
            return (
              sec.title.toLowerCase().includes(q) ||
              sec.body.some((l) => l.toLowerCase().includes(q))
            );
          })
        : MANUAL.map((_, i) => i);
    }

    function renderNav() {
      const q = query.trim().toLowerCase();
      const matches = listMatches(q);
      const ul = h("ul");
      MANUAL.forEach((s, i) => {
        const btn = h(
          "button",
          {
            type: "button",
            class: i === active ? "is-active" : "",
            disabled: !matches.includes(i),
            onclick: () => {
              if (matches.includes(i)) {
                active = i;
                render();
              }
            },
          },
          h("span", { class: "manual-nav-num" }, String(i + 1).padStart(2, "0")),
          h("span", {}, s.title)
        );
        ul.appendChild(h("li", {}, btn));
      });
      navEl.innerHTML = "";
      navEl.appendChild(search);
      navEl.appendChild(h("div", { class: "manual-nav-label" }, "chapters"));
      navEl.appendChild(ul);
    }

    function renderBody() {
      const q = query.trim().toLowerCase();
      const matches = listMatches(q);
      const current = MANUAL[matches.includes(active) ? active : matches[0] ?? 0] || MANUAL[0];
      const currentIndex = MANUAL.indexOf(current);
      bodyEl.innerHTML = "";
      bodyEl.appendChild(
        h("div", { class: "manual-crumb" }, `manual / ${String(currentIndex + 1).padStart(2, "0")} ${current.title}`)
      );
      bodyEl.appendChild(h("h2", { class: "manual-title" }, current.title));
      current.body.forEach((line) => bodyEl.appendChild(h("p", {}, line)));
      const pager = h(
        "div",
        { class: "manual-pager" },
        h(
          "button",
          {
            type: "button",
            class: "mini-btn",
            disabled: currentIndex === 0,
            onclick: () => {
              active = currentIndex - 1;
              render();
            },
          },
          "prev"
        ),
        h("span", { class: "manual-count" }, `${currentIndex + 1} / ${MANUAL.length}`),
        h(
          "button",
          {
            type: "button",
            class: "mini-btn",
            disabled: currentIndex === MANUAL.length - 1,
            onclick: () => {
              active = currentIndex + 1;
              render();
            },
          },
          "next"
        )
      );
      bodyEl.appendChild(pager);
    }

    function render() {
      renderNav();
      renderBody();
    }

    search.addEventListener("input", () => {
      query = search.value;
      render();
    });
    render();
    root.appendChild(navEl);
    root.appendChild(bodyEl);
    return { root };
  }

  const QUICK = [
    { label: "home", url: "/" },
    { label: "blog", url: "/blog" },
    { label: "projects", url: "/projects" },
    { label: "likes", url: "/likes" },
    { label: "contact", url: "/contact" },
    { label: "wikipedia", url: "https://en.m.wikipedia.org/" },
    { label: "bananawiki", url: "https://bananawiki.com/" },
  ];

  const SEARCH_SCHEME = "search:";
  const NEW_TAB = "about:blank";

  function looksLikeUrl(str) {
    return (
      /^https?:\/\//i.test(str) ||
      (!/\s/.test(str) && /^[\w-]+(\.[\w-]+)+(\/|$|[:?#])/.test(str))
    );
  }

  function tabLabel(u) {
    if (u === NEW_TAB) return "new tab";
    if (u.startsWith(SEARCH_SCHEME)) return "search: " + u.slice(SEARCH_SCHEME.length);
    if (u.startsWith("/"))
      return u === "/" ? "lucazani.com" : u.slice(1).replace(/^blog\//, "blog: ");
    return u.replace(/^https?:\/\//, "").split("/")[0];
  }

  let tabSeq = 0;
  function mkTab(url) {
    return { id: "t" + ++tabSeq, hist: [url], pos: 0, nonce: 0 };
  }

  function decodeSearch(s) {
    return s
      .replace(/<[^>]*>/g, "")
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseSearch(html) {
    const hits = [];
    const linkRe =
      /<a[^>]*href=["']([^"']+)["'][^>]*class=["'](?:result-link|result__a)["'][^>]*>([\s\S]*?)<\/a>/g;
    const altRe =
      /<a[^>]*class=["'](?:result-link|result__a)["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/g;
    const snipRe = /class=["'](?:result-snippet|result__snippet)["'][^>]*>([\s\S]*?)<\/(?:td|a)>/g;
    const snippets = [];
    let m;
    while ((m = snipRe.exec(html))) snippets.push(decodeSearch(m[1]));
    let i = 0;
    const links = [];
    while ((m = linkRe.exec(html))) links.push(m);
    while ((m = altRe.exec(html))) links.push(m);
    for (m of links) {
      let href = m[1].replace(/&amp;/g, "&");
      const redirect = href.match(/[?&]uddg=([^&]+)/);
      if (redirect) href = decodeURIComponent(redirect[1]);
      if (href.startsWith("//")) href = "https:" + href;
      const title = decodeSearch(m[2]);
      if (!title || !/^https?:/.test(href)) {
        i++;
        continue;
      }
      hits.push({ title, url: href, snippet: snippets[i] || "" });
      i++;
    }
    return hits.slice(0, 20);
  }

  function embedSrc(u) {
    const f = fileOfPath(u);
    const q = f.includes("?") ? "&" : "?";
    return rootPrefix() + f + q + "embed=1";
  }

  function browserApp(win) {
    let tabs = [mkTab(win.url && win.url !== NEW_TAB ? win.url : NEW_TAB)];
    let active = 0;
    const root = h("div", {
      style: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 },
    });

    const tabbar = h("div", { class: "browser-tabs" });
    const toolbar = h("div", { class: "browser-toolbar" });
    const bookmarks = h("div", { class: "browser-bookmarks" });
    const view = h("div", {
      style: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" },
    });
    root.appendChild(tabbar);
    root.appendChild(toolbar);
    root.appendChild(bookmarks);
    root.appendChild(view);

    function urlOf() {
      const tab = tabs[Math.min(active, tabs.length - 1)];
      return tab.hist[tab.pos];
    }

    function patch(fn) {
      tabs = tabs.map((t, i) => (i === active ? fn(t) : t));
      render();
    }

    function go(raw) {
      let u = raw.trim();
      if (!u) return;
      if (!u.startsWith("/") && u !== NEW_TAB && !u.startsWith(SEARCH_SCHEME)) {
        if (!looksLikeUrl(u)) u = SEARCH_SCHEME + u;
        else if (!/^https?:\/\//i.test(u)) u = "https://" + u;
      }
      patch((t) => ({ ...t, hist: [...t.hist.slice(0, t.pos + 1), u], pos: t.pos + 1 }));
    }

    function renderSearch(query, container) {
      container.innerHTML = "";
      container.appendChild(h("div", { class: "search-head" }, h("strong", {}, query)));
      const el = container;
      fetch(
        "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query),
        { headers: { accept: "text/html" } }
      )
        .then((r) => {
          if (!r.ok) throw new Error("upstream returned " + r.status);
          return r.text();
        })
        .then((html) => {
          const hits = parseSearch(html);
          if (hits.length === 0) throw new Error("no results");
          renderHits(el, query, hits);
        })
        .catch(() => {
          el.appendChild(
            h(
              "div",
              { class: "search-empty" },
              h("p", { class: "small" }, "search failed from here - the engines block cross-site calls. try it directly:"),
              h(
                "button",
                {
                  class: "search-hit-title",
                  onclick: () =>
                    window.open(
                      "https://duckduckgo.com/?q=" + encodeURIComponent(query),
                      "_blank",
                      "noopener,noreferrer"
                    ),
                },
                "open this search on duckduckgo.com"
              )
            )
          );
        });
    }

    function renderHits(el, query, hits) {
      el.innerHTML = "";
      el.appendChild(
        h("div", { class: "search-head" }, h("strong", {}, query), h("span", { class: "small" }, hits.length + " results"))
      );
      const ol = h("ol", { class: "search-hits" });
      hits.forEach((hh) => {
        ol.appendChild(
          h(
            "li",
            {},
            h(
              "button",
              { class: "search-hit-title", onclick: () => go(hh.url) },
              hh.title
            ),
            h("span", { class: "search-hit-url" }, hh.url.replace(/^https?:\/\//, "").slice(0, 90)),
            hh.snippet ? h("p", {}, hh.snippet) : null
          )
        );
      });
      el.appendChild(ol);
    }

    function renderView() {
      const u = urlOf();
      view.innerHTML = "";
      if (u === NEW_TAB) {
        const home = h("div", { class: "search-home" });
        const qInput = h("input", { type: "text", placeholder: "search the web", "aria-label": "search the web" });
        const form = h(
          "form",
          {
            class: "search-home-form",
            onsubmit: (e) => {
              e.preventDefault();
              const v = qInput.value.trim();
              if (v) go(SEARCH_SCHEME + v);
            },
          },
          qInput,
          h("button", { type: "submit", class: "mini-btn" }, "search")
        );
        const dial = h("div", { class: "browser-dial" });
        QUICK.forEach((item) => {
          dial.appendChild(
            h(
              "button",
              { onclick: () => go(item.url) },
              item.label,
              h("span", {}, item.url)
            )
          );
        });
        home.appendChild(h("div", { class: "search-home-mark" }, "duck search"));
        home.appendChild(form);
        home.appendChild(dial);
        view.appendChild(home);
        setTimeout(() => qInput.focus(), 0);
        return;
      }
      if (u.startsWith(SEARCH_SCHEME)) {
        const page = h("div", { class: "search-page" });
        view.appendChild(page);
        renderSearch(u.slice(SEARCH_SCHEME.length), page);
        return;
      }
      if (u.startsWith("/")) {
        view.appendChild(
          h("iframe", {
            title: "browser",
            src: embedSrc(u),
            style: { flex: 1, width: "100%", border: 0, background: "var(--bg)" },
          })
        );
        return;
      }
      const ext = h("div", { style: { position: "relative", flex: 1, minHeight: 0, display: "flex" } });
      ext.appendChild(
        h("iframe", {
          title: "browser",
          src: u,
          referrerpolicy: "no-referrer",
          sandbox: "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin",
          style: { flex: 1, width: "100%", border: 0, background: "var(--bg)" },
        })
      );
      view.appendChild(ext);
    }

    function render() {
      const u = urlOf();
      updateWindow(win.id, { url: u, title: "browser - " + tabLabel(u) });

      tabbar.innerHTML = "";
      tabs.forEach((t, i) => {
        const tb = h(
          "div",
          {
            class:
              "browser-tab" +
              (i === active ? " is-active" : ""),
            title: "drag to reorder, middle click to close",
            onmousedown: (e) => {
              if (e.button === 1) {
                e.preventDefault();
                closeTab(i);
              } else setActive(i);
            },
          },
          h("span", {}, tabLabel(t.hist[t.pos])),
          h(
            "button",
            {
              "aria-label": "close tab",
              onclick: (e) => {
                e.stopPropagation();
                closeTab(i);
              },
            },
            "x"
          )
        );
        tabbar.appendChild(tb);
      });
      tabbar.appendChild(
        h("button", { class: "browser-newtab", "aria-label": "new tab", onclick: newTab }, "+")
      );

      toolbar.innerHTML = "";
      const tab = tabs[Math.min(active, tabs.length - 1)];
      toolbar.appendChild(
        h("button", { class: "mini-btn", onclick: back, disabled: tab.pos === 0, "aria-label": "back" }, "<")
      );
      toolbar.appendChild(
        h("button", { class: "mini-btn", onclick: fwd, disabled: tab.pos >= tab.hist.length - 1, "aria-label": "forward" }, ">")
      );
      toolbar.appendChild(h("button", { class: "mini-btn", onclick: reload, "aria-label": "reload" }, "r"));
      toolbar.appendChild(h("button", { class: "mini-btn", onclick: () => go("/"), "aria-label": "home" }, "home"));
      const addr = h("input", {
        type: "text",
        spellcheck: "false",
        placeholder: "search, /blog, or https://...",
        "aria-label": "address",
      });
      addr.value = u === NEW_TAB ? "" : u;
      addr.addEventListener("keydown", (e) => {
        if (e.key === "Enter") go(addr.value);
      });
      toolbar.appendChild(addr);
      if (!u.startsWith("/") && u !== NEW_TAB && !u.startsWith(SEARCH_SCHEME)) {
        toolbar.appendChild(
          h("a", { class: "mini-btn", href: u, target: "_blank", rel: "noopener noreferrer", title: "open this page outside the frame" }, "\u2197")
        );
      }

      bookmarks.innerHTML = "";
      QUICK.forEach((q) => {
        bookmarks.appendChild(
          h("button", { onclick: () => go(q.url) }, q.label)
        );
      });

      renderView();
    }

    function setActive(i) {
      active = i;
      render();
    }
    function back() {
      patch((t) => ({ ...t, pos: Math.max(0, t.pos - 1) }));
    }
    function fwd() {
      patch((t) => ({ ...t, pos: Math.min(t.hist.length - 1, t.pos + 1) }));
    }
    function reload() {
      patch((t) => ({ ...t, nonce: t.nonce + 1 }));
    }
    function newTab() {
      tabs = [...tabs, mkTab(NEW_TAB)];
      active = tabs.length - 1;
      render();
    }
    function closeTab(i) {
      if (tabs.length === 1) {
        tabs = [mkTab(NEW_TAB)];
        active = 0;
      } else {
        tabs = tabs.filter((_, k) => k !== i);
        active = i < active ? active - 1 : Math.min(active, tabs.length - 1);
      }
      render();
    }

    render();
    return { root };
  }

  function editorApp(win) {
    let name = win.file || "untitled.txt";
    const files = getState().files;
    let text = win.draft ?? (win.file ? files[win.file] || "" : "");
    const root = h("div", { style: { display: "flex", flexDirection: "column", height: "100%" } });
    const nameInput = h("input", { type: "text", spellcheck: "false", "aria-label": "file name" });
    nameInput.value = name;
    const saveBtn = h("button", { class: "mini-btn" }, "save");
    root.appendChild(
      h("div", { class: "editor-toolbar" }, nameInput, saveBtn)
    );
    const area = h("textarea", { class: "editor-area", spellcheck: "false", "aria-label": "text" });
    area.value = text;
    area.addEventListener("input", () => {
      text = area.value;
      updateWindow(win.id, { draft: text });
    });
    saveBtn.addEventListener("click", () => {
      name = nameInput.value.trim() || "untitled.txt";
      setState((s) => ({ files: { ...s.files, [name]: text } }));
      updateWindow(win.id, { file: name, draft: text, title: "mousepad - " + name });
      saveBtn.textContent = "saved";
      setTimeout(() => (saveBtn.textContent = "save"), 1400);
    });
    root.appendChild(area);
    return { root };
  }

  function taskManagerApp() {
    const root = h("div", { class: "app-pad taskmgr" });

    function render() {
      const s = getState();
      root.innerHTML = "";
      const t1 = h("table", {},
        h("thead", {}, h("tr", {},
          h("th", {}, "unit"),
          h("th", {}, "state")
        )),
        h("tbody", {}, SERVICES.map((u) =>
          h("tr", {},
            h("td", {}, u),
            h("td", {},
              h("span", { class: "dot " + (s.services[u] === "active" ? "on" : "off") }),
              s.services[u]
            )
          )
        ))
      );
      const t2 = h("table", { style: { marginTop: 14 } },
        h("thead", {}, h("tr", {},
          h("th", {}, "process"),
          h("th", {}, "pid"),
          h("th", {})
        )),
        h("tbody", {},
          s.windows.map((w) =>
            h("tr", {},
              h("td", {}, w.title),
              h("td", {}, 1000 + w.id),
              h("td", {}, h("button", { class: "mini-btn", onclick: () => closeWindow(w.id) }, "end task"))
            )
          ),
          s.windows.length === 0 ? h("tr", {}, h("td", { colspan: 3 }, "no user processes.")) : null
        )
      );
      root.appendChild(t1);
      root.appendChild(t2);
    }

    const un = subscribe(render);
    render();
    return { root, destroy: un };
  }

  function kioskApp(win) {
    const root = h("iframe", {
      title: "Kiosk",
      src: embedSrc(win.url || "/"),
      style: { width: "100%", height: "100%", border: 0, background: "var(--bg)" },
    });
    return { root };
  }

  const SHAPES = {
    cube: {
      label: "cube",
      verts: [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
      ],
      faces: [
        [4, 5, 6, 7],
        [1, 0, 3, 2],
        [5, 1, 2, 6],
        [0, 4, 7, 3],
        [3, 7, 6, 2],
        [0, 1, 5, 4],
      ],
    },
    tetra: {
      label: "tetrahedron",
      verts: [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]],
      faces: [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]],
    },
    octa: {
      label: "octahedron",
      verts: [[1.3, 0, 0], [-1.3, 0, 0], [0, 1.3, 0], [0, -1.3, 0], [0, 0, 1.3], [0, 0, -1.3]],
      faces: [
        [0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4],
        [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5],
      ],
    },
    pyramid: {
      label: "pyramid",
      verts: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [0, 1.2, 0]],
      faces: [[0, 1, 2, 3], [3, 2, 4], [2, 1, 4], [1, 0, 4], [0, 3, 4]],
    },
    prism: {
      label: "prism",
      verts: [
        [-1, -1, -1], [1, -1, -1], [0, 1, -1],
        [-1, -1, 1], [1, -1, 1], [0, 1, 1],
      ],
      faces: [[3, 4, 5], [2, 1, 0], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]],
    },
  };

  const PALETTE = ["#e8c87a", "#7ad0e8", "#e87a9c", "#9ce87a", "#b07ae8", "#e8a67a", "#7ae8c0", "#d8d8d8"];

  function faceTriangles(shape) {
    return shape.faces.map((f) => {
      const tris = [];
      for (let i = 1; i < f.length - 1; i++)
        tris.push([...shape.verts[f[0]], ...shape.verts[f[i]], ...shape.verts[f[i + 1]]]);
      return tris;
    });
  }

  function hexToRgb(hex) {
    const hh = hex.replace("#", "");
    const n = parseInt(hh.length === 3 ? hh.split("").map((c) => c + c).join("") : hh, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function geoApp() {
    const root = h("div", { style: { display: "flex", flexDirection: "column", height: "100%" } });
    const canvas = h("canvas", { title: "drag to rotate · wheel to zoom · double click to reset", style: { flex: 1, width: "100%", display: "block", minHeight: 0, cursor: "grab", touchAction: "none" } });
    root.appendChild(canvas);

    const live = { shapeKey: "cube", speed: 1, running: true, bg: "#080808", faceColors: SHAPES.cube.faces.map((_, i) => PALETTE[i % PALETTE.length]) };
    const orbit = { yaw: 0.6, pitch: 0.35, zoom: 1, dragging: false };

    function pickShape(k) {
      live.shapeKey = k;
      live.faceColors = SHAPES[k].faces.map((_, i) => PALETTE[i % PALETTE.length]);
    }
    function setAll(c) {
      live.faceColors = SHAPES[live.shapeKey].faces.map(() => c);
    }

    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
      orbit.dragging = true;
      let px = e.clientX;
      let py = e.clientY;
      const k = (2 * Math.PI) / Math.max(200, canvas.clientWidth);
      const move = (ev) => {
        if (ev.pointerId !== e.pointerId) return;
        orbit.yaw -= (ev.clientX - px) * k;
        orbit.pitch = Math.max(-1.45, Math.min(1.45, orbit.pitch - (ev.clientY - py) * k));
        px = ev.clientX;
        py = ev.clientY;
      };
      const up = (ev) => {
        if (ev.pointerId !== e.pointerId) return;
        orbit.dragging = false;
        canvas.style.cursor = "grab";
        canvas.releasePointerCapture?.(e.pointerId);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    });

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      orbit.zoom = Math.max(0.3, Math.min(3, orbit.zoom * Math.exp(-dy * 0.0015)));
    }, { passive: false });

    canvas.addEventListener("dblclick", () => {
      orbit.yaw = 0.6;
      orbit.pitch = 0.35;
      orbit.zoom = 1;
    });

    const gl = canvas.getContext("webgl");
    let controls = null;
    if (gl) {
      const vs = "attribute vec3 p; attribute vec3 c; uniform mat4 m; varying vec3 vc; void main(){ vc=c; gl_Position = m * vec4(p,1.0); }";
      const fs = "precision mediump float; varying vec3 vc; void main(){ gl_FragColor = vec4(vc,1.0); }";
      const sh = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(prog);
      gl.useProgram(prog);
      const pBuf = gl.createBuffer();
      const cBuf = gl.createBuffer();
      const pLoc = gl.getAttribLocation(prog, "p");
      const cLoc = gl.getAttribLocation(prog, "c");
      gl.enableVertexAttribArray(pLoc);
      gl.enableVertexAttribArray(cLoc);
      const mLoc = gl.getUniformLocation(prog, "m");
      gl.enable(gl.DEPTH_TEST);

      let count = 0;
      let builtFor = "";
      const build = () => {
        const s = SHAPES[live.shapeKey];
        const tris = faceTriangles(s);
        const pos = [];
        const col = [];
        tris.forEach((face, fi) => {
          const [r, g, b] = hexToRgb(live.faceColors[fi] || "#e8c87a");
          face.forEach((t) => {
            pos.push(...t);
            for (let kk = 0; kk < 3; kk++) {
              const shade = 0.72 + 0.28 * ((fi % 4) / 3);
              col.push(r * shade, g * shade, b * shade);
            }
          });
        });
        count = pos.length / 3;
        gl.bindBuffer(gl.ARRAY_BUFFER, pBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(col), gl.STATIC_DRAW);
        builtFor = live.shapeKey + live.faceColors.join(",");
      };
      build();
      let raf = 0;
      let t = 0;
      let last = performance.now();
      const draw = () => {
        const now = performance.now();
        const dt = (now - last) / 1000;
        last = now;
        if (live.running && !orbit.dragging) t += dt * live.speed;
        if (builtFor !== live.shapeKey + live.faceColors.join(",")) build();
        const w = canvas.clientWidth || 300;
        const hh = canvas.clientHeight || 300;
        canvas.width = w;
        canvas.height = hh;
        gl.viewport(0, 0, w, hh);
        const [br, bgc, bb] = hexToRgb(live.bg);
        gl.clearColor(br, bgc, bb, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const a = t * 0.8 + orbit.yaw;
        const b = orbit.pitch;
        const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
        const sc = 0.42 * orbit.zoom;
        const asp = hh / w;
        const m = [
          ca * sc * asp, sa * sb * sc, -sa * cb * sc, 0,
          0, cb * sc, sb * sc, 0,
          sa * sc * asp, -ca * sb * sc, ca * cb * sc, 0,
          0, 0, 0, 1,
        ];
        gl.uniformMatrix4fv(mLoc, false, new Float32Array(m));
        gl.bindBuffer(gl.ARRAY_BUFFER, pBuf);
        gl.vertexAttribPointer(pLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuf);
        gl.vertexAttribPointer(cLoc, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, count);
        raf = requestAnimationFrame(draw);
      };
      draw();

      const controlsEl = h("div", { class: "geo-controls" });
      const shapesRow = h("div", { class: "geo-row" });
      Object.entries(SHAPES).forEach(([k, s]) => {
        const btn = h("button", { class: "mini-btn", onclick: () => { pickShape(k); rerender(); } }, s.label);
        if (k === live.shapeKey) btn.dataset.active = "";
        shapesRow.appendChild(btn);
      });
      const runBtn = h("button", { class: "mini-btn", onclick: () => { live.running = !live.running; runBtn.textContent = live.running ? "stop" : "resume"; } }, "stop");
      const speedRange = h("input", { type: "range", min: 0, max: 4, step: 0.05, value: 1 });
      const speedVal = h("span", { class: "geo-val" }, "1.00x");
      speedRange.addEventListener("input", () => {
        live.speed = Number(speedRange.value);
        speedVal.textContent = live.speed.toFixed(2) + "x";
      });
      const bgColor = h("input", { type: "color", value: "#080808" });
      bgColor.addEventListener("input", () => { live.bg = bgColor.value; });
      const objColor = h("input", { type: "color", value: live.faceColors[0] || "#e8c87a" });
      objColor.addEventListener("input", () => { setAll(objColor.value); rerender(); });
      let perFace = true;
      const faceBtn = h("button", { class: "mini-btn", onclick: () => { perFace = !perFace; faceBtn.textContent = perFace ? "hide faces" : "per-face colors"; rerender(); } }, "hide faces");
      const facesRow = h("div", { class: "geo-row geo-faces" });
      function rerender() {
        facesRow.innerHTML = "";
        if (!perFace) return;
        SHAPES[live.shapeKey].faces.forEach((_, i) => {
          const f = h("input", { type: "color", value: live.faceColors[i] || "#e8c87a" });
          f.addEventListener("input", () => {
            const next = SHAPES[live.shapeKey].faces.map((__, j) => live.faceColors[j] || "#e8c87a");
            next[i] = f.value;
            live.faceColors = next;
          });
          facesRow.appendChild(h("label", { class: "small" }, String(i + 1), f));
        });
        shapesRow.querySelectorAll(".mini-btn").forEach((b) => {
          b.dataset.active = b.textContent === SHAPES[live.shapeKey].label ? "" : undefined;
          if (b.textContent !== SHAPES[live.shapeKey].label) delete b.dataset.active;
        });
        objColor.value = live.faceColors[0] || "#e8c87a";
      }
      rerender();
      controlsEl.appendChild(shapesRow);
      controlsEl.appendChild(h("div", { class: "geo-row" }, runBtn, h("label", { class: "small" }, "speed", speedRange, speedVal)));
      controlsEl.appendChild(h("div", { class: "geo-row" }, h("label", { class: "small" }, "background", bgColor), h("label", { class: "small" }, "object", objColor), faceBtn));
      controlsEl.appendChild(facesRow);
      root.appendChild(controlsEl);
    }
    return { root };
  }

  const PAINT_TOOLS = [
    { id: "pencil", label: "pencil", hint: "hard 1px-style freehand line" },
    { id: "brush", label: "brush", hint: "soft round freehand stroke" },
    { id: "eraser", label: "eraser", hint: "paint back to white" },
    { id: "line", label: "line", hint: "drag a straight line" },
    { id: "rect", label: "rect", hint: "drag a rectangle" },
    { id: "ellipse", label: "oval", hint: "drag an ellipse" },
    { id: "fill", label: "fill", hint: "flood fill an area with the colour" },
    { id: "spray", label: "spray", hint: "airbrush speckle" },
    { id: "text", label: "text", hint: "click to drop a text box, drag it around, then place it" },
    { id: "picker", label: "pick", hint: "eyedropper: take a colour off the canvas" },
  ];

  const PAINT_SWATCHES = [
    "#000000", "#3a3a3a", "#7a7a7a", "#cccccc", "#ffffff",
    "#e8c87a", "#d0783c", "#c0392b", "#8e2f6f", "#5b4bd6",
    "#2f7fd0", "#2fb3b3", "#3fae5a", "#9bd04a", "#f2e14c",
  ];

  const PW = 960;
  const PH = 640;
  const MAX_HISTORY = 40;

  function paintApp() {
    const base = h("canvas", { width: PW, height: PH });
    const over = h("canvas", { width: PW, height: PH, class: "paint-overlay" });
    const wrap = h("div", { class: "paint-canvas-wrap" }, base, over);
    const stage = h("div", { class: "paint-stage" }, wrap);
    const fileIn = h("input", { type: "file", accept: "image/*", hidden: true });
    const statusEl = h("span", {}, "0, 0");

    const live = { tool: "brush", color: "#e8c87a", size: 6, opacity: 1, filled: false, fontSize: 28 };
    let draft = null;
    let scale = 1;
    let undoStack = [];
    let redoStack = [];

    const ctx = () => base.getContext("2d", { willReadFrequently: true });
    const ocx = () => over.getContext("2d");

    function snapshot() {
      const c = ctx();
      if (!c) return;
      undoStack.push(c.getImageData(0, 0, PW, PH));
      if (undoStack.length > MAX_HISTORY) undoStack.shift();
      redoStack = [];
      updateDepth();
    }

    function updateDepth() {
      document.getElementById("paint-undo-" + (base.dataset.win || "")).disabled = undoStack.length === 0;
      document.getElementById("paint-redo-" + (base.dataset.win || "")).disabled = redoStack.length === 0;
    }

    function doUndo() {
      const c = ctx();
      const prev = undoStack.pop();
      if (!c || !prev) return;
      redoStack.push(c.getImageData(0, 0, PW, PH));
      c.putImageData(prev, 0, 0);
      updateDepth();
    }

    function doRedo() {
      const c = ctx();
      const next = redoStack.pop();
      if (!c || !next) return;
      undoStack.push(c.getImageData(0, 0, PW, PH));
      c.putImageData(next, 0, 0);
      updateDepth();
    }

    function clearAll() {
      const c = ctx();
      if (!c) return;
      snapshot();
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, PW, PH);
    }

    function loadFile(file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const c = ctx();
        if (c) {
          snapshot();
          c.fillStyle = "#ffffff";
          c.fillRect(0, 0, PW, PH);
          const k = Math.min(PW / img.width, PH / img.height);
          const w = img.width * k;
          const hh = img.height * k;
          c.drawImage(img, (PW - w) / 2, (PH - hh) / 2, w, hh);
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }

    function setAsDesktop() {
      setState({ wallpaper: base.toDataURL("image/png") });
      statusEl.textContent = "set as desktop (clears on reload)";
    }

    function exportAs(type) {
      let url;
      if (type === "image/jpeg") {
        const flat = document.createElement("canvas");
        flat.width = PW;
        flat.height = PH;
        const fc = flat.getContext("2d");
        fc.fillStyle = "#ffffff";
        fc.fillRect(0, 0, PW, PH);
        fc.drawImage(base, 0, 0);
        url = flat.toDataURL(type, 0.92);
      } else {
        url = base.toDataURL(type);
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = "paint-" + Date.now() + "." + (type === "image/png" ? "png" : "jpg");
      a.click();
    }

    window.addEventListener("paste", (e) => {
      const item = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith("image/"));
      const f = item && item.getAsFile();
      if (f) {
        e.preventDefault();
        loadFile(f);
      }
    });

    function measure() {
      scale = base.getBoundingClientRect().width / PW || 1;
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(base);

    const font = (px) => `${px}px ui-monospace, "SFMono-Regular", Menlo, monospace`;

    function commitDraft() {
      const c = ctx();
      if (!c || !draft) return;
      if (draft.value.trim()) {
        const l = live;
        snapshot();
        c.globalAlpha = l.opacity;
        c.fillStyle = l.color;
        c.font = font(l.fontSize);
        c.textBaseline = "top";
        draft.value.split("\n").forEach((line, i) => {
          c.fillText(line, draft.x, draft.y + i * l.fontSize * 1.2);
        });
        c.globalAlpha = 1;
      }
      draft = null;
      stage.querySelector(".paint-text-draft")?.remove();
    }

    function pos(e) {
      const r = base.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * PW,
        y: ((e.clientY - r.top) / r.height) * PH,
      };
    }

    function stroke(c, t) {
      const l = live;
      c.globalAlpha = l.opacity;
      c.lineWidth = l.size;
      c.lineCap = t === "pencil" ? "butt" : "round";
      c.lineJoin = "round";
      c.strokeStyle = t === "eraser" ? "#ffffff" : l.color;
      c.fillStyle = t === "eraser" ? "#ffffff" : l.color;
    }

    function floodFill(c, sx, sy, hex) {
      const img = c.getImageData(0, 0, PW, PH);
      const d = img.data;
      const idx = (x, y) => (y * PW + x) * 4;
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      if (x0 < 0 || y0 < 0 || x0 >= PW || y0 >= PH) return;
      const start = idx(x0, y0);
      const target = [d[start], d[start + 1], d[start + 2], d[start + 3]];
      const rgb = [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
        255,
      ];
      if (target.every((v, i) => v === rgb[i])) return;
      const tol = 32;
      const match = (i) =>
        Math.abs(d[i] - target[0]) <= tol &&
        Math.abs(d[i + 1] - target[1]) <= tol &&
        Math.abs(d[i + 2] - target[2]) <= tol &&
        Math.abs(d[i + 3] - target[3]) <= tol;
      const stack = [[x0, y0]];
      while (stack.length) {
        const [x, y] = stack.pop();
        let yy = y;
        while (yy >= 0 && match(idx(x, yy))) yy--;
        yy++;
        let left = false;
        let right = false;
        for (; yy < PH && match(idx(x, yy)); yy++) {
          const i = idx(x, yy);
          d[i] = rgb[0];
          d[i + 1] = rgb[1];
          d[i + 2] = rgb[2];
          d[i + 3] = 255;
          if (x > 0) {
            const m = match(idx(x - 1, yy));
            if (m && !left) stack.push([x - 1, yy]);
            left = m;
          }
          if (x < PW - 1) {
            const m = match(idx(x + 1, yy));
            if (m && !right) stack.push([x + 1, yy]);
            right = m;
          }
        }
      }
      c.putImageData(img, 0, 0);
    }

    base.addEventListener("pointerdown", (e) => {
      const c = ctx();
      const oc = ocx();
      if (!c || !oc) return;
      e.preventDefault();
      const l = live;
      const p = pos(e);
      if (l.tool === "picker") {
        const d = c.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
        const hex = "#" + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
        live.color = hex;
        updateBar();
        return;
      }
      if (l.tool === "fill") {
        snapshot();
        floodFill(c, p.x, p.y, l.color);
        return;
      }
      if (l.tool === "text") {
        if (draft) commitDraft();
        else {
          draft = { x: p.x, y: p.y, value: "" };
          const dbox = h("div", { class: "paint-text-draft", style: { left: draft.x * scale, top: draft.y * scale } });
          const ta = h("textarea", { rows: 1, placeholder: "type…", style: { color: l.color, opacity: l.opacity, fontSize: l.fontSize * scale } });
          const placeBtn = h("button", { class: "mini-btn", onclick: commitDraft }, "place");
          const dropBtn = h("button", { class: "mini-btn", onclick: () => { draft = null; dbox.remove(); } }, "drop");
          ta.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" && !ev.shiftKey) {
              ev.preventDefault();
              commitDraft();
            }
            if (ev.key === "Escape") {
              ev.preventDefault();
              draft = null;
              dbox.remove();
            }
          });
          ta.addEventListener("input", () => {
            if (draft) draft.value = ta.value;
          });
          const grip = h("div", { class: "paint-text-grip", title: "drag to move" }, "move");
          grip.addEventListener("pointerdown", (ev) => {
            if (!draft) return;
            ev.preventDefault();
            grip.setPointerCapture(ev.pointerId);
            const startX = ev.clientX;
            const startY = ev.clientY;
            const ox = draft.x;
            const oy = draft.y;
            const move = (mEv) => {
              const s = scale || 1;
              draft.x = ox + (mEv.clientX - startX) / s;
              draft.y = oy + (mEv.clientY - startY) / s;
              dbox.style.left = draft.x * s + "px";
              dbox.style.top = draft.y * s + "px";
            };
            const up = (uEv) => {
              grip.releasePointerCapture?.(uEv.pointerId);
              window.removeEventListener("pointermove", move);
              window.removeEventListener("pointerup", up);
            };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
          });
          dbox.appendChild(grip);
          dbox.appendChild(ta);
          dbox.appendChild(placeBtn);
          dbox.appendChild(dropBtn);
          wrap.appendChild(dbox);
          setTimeout(() => ta.focus(), 0);
        }
        return;
      }
      snapshot();
      base.setPointerCapture(e.pointerId);
      const startP = p;
      let last = p;
      const shapeTool = l.tool === "line" || l.tool === "rect" || l.tool === "ellipse";

      const drawShape = (target, to) => {
        stroke(target, l.tool);
        target.beginPath();
        if (l.tool === "line") {
          target.moveTo(startP.x, startP.y);
          target.lineTo(to.x, to.y);
          target.stroke();
        } else if (l.tool === "rect") {
          const x = Math.min(startP.x, to.x);
          const y = Math.min(startP.y, to.y);
          const w = Math.abs(to.x - startP.x);
          const hh = Math.abs(to.y - startP.y);
          target.rect(x, y, w, hh);
          l.filled ? target.fill() : target.stroke();
        } else {
          const cx = (startP.x + to.x) / 2;
          const cy = (startP.y + to.y) / 2;
          target.ellipse(cx, cy, Math.abs(to.x - startP.x) / 2, Math.abs(to.y - startP.y) / 2, 0, 0, Math.PI * 2);
          l.filled ? target.fill() : target.stroke();
        }
        target.globalAlpha = 1;
      };

      const freehand = (to) => {
        if (l.tool === "spray") {
          stroke(c, l.tool);
          for (let i = 0; i < 24; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * l.size * 1.6;
            c.fillRect(to.x + Math.cos(a) * r, to.y + Math.sin(a) * r, 1, 1);
          }
          c.globalAlpha = 1;
          return;
        }
        stroke(c, l.tool);
        if (l.tool === "brush") c.shadowBlur = 0;
        c.beginPath();
        c.moveTo(last.x, last.y);
        c.lineTo(to.x, to.y);
        c.stroke();
        c.globalAlpha = 1;
        last = to;
      };

      if (!shapeTool) freehand(p);

      const move = (ev) => {
        const to = pos(ev);
        statusEl.textContent = Math.round(to.x) + ", " + Math.round(to.y);
        if (shapeTool) {
          oc.clearRect(0, 0, PW, PH);
          drawShape(oc, to);
        } else {
          freehand(to);
        }
      };
      const up = (ev) => {
        const to = pos(ev);
        if (shapeTool) {
          oc.clearRect(0, 0, PW, PH);
          drawShape(c, to);
        }
        base.releasePointerCapture?.(e.pointerId);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    });

    stage.addEventListener("dragover", (e) => e.preventDefault());
    stage.addEventListener("drop", (e) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f && f.type.startsWith("image/")) loadFile(f);
    });

    const undoBtn = h("button", { class: "mini-btn", id: "paint-undo-" + (winIdSeq++), onclick: doUndo }, "undo");
    const redoBtn = h("button", { class: "mini-btn", id: "paint-redo-" + (winIdSeq++), onclick: doRedo }, "redo");

    let barRefs = {};
    function updateBar() {
      if (barRefs.color) barRefs.color.value = live.color;
    }

    const toolRow = h("div", { class: "paint-tools" });
    const toolBtns = {};
    PAINT_TOOLS.forEach((t) => {
      const b = h("button", { class: "mini-btn paint-tool", title: t.hint, onclick: () => { live.tool = t.id; syncTools(); } }, t.label);
      toolBtns[t.id] = b;
      toolRow.appendChild(b);
    });
    function syncTools() {
      Object.entries(toolBtns).forEach(([id, b]) => {
        if (id === live.tool) b.dataset.active = "";
        else delete b.dataset.active;
      });
      filledBtn && (filledBtn.style.display = live.tool === "rect" || live.tool === "ellipse" ? "" : "none");
      ptCtrl && (ptCtrl.style.display = live.tool === "text" ? "" : "none");
    }
    const colorInput = h("input", { type: "color", value: live.color });
    colorInput.addEventListener("input", () => { live.color = colorInput.value; });
    const sizeRange = h("input", { type: "range", min: 1, max: 64, value: 6 });
    const sizeVal = h("span", { class: "geo-val" }, "6px");
    sizeRange.addEventListener("input", () => { live.size = Number(sizeRange.value); sizeVal.textContent = live.size + "px"; });
    const alphaRange = h("input", { type: "range", min: 5, max: 100, value: 100 });
    const alphaVal = h("span", { class: "geo-val" }, "100%");
    alphaRange.addEventListener("input", () => { live.opacity = Number(alphaRange.value) / 100; alphaVal.textContent = alphaRange.value + "%"; });
    let filledBtn = null;
    filledBtn = h("button", { class: "mini-btn", onclick: () => { live.filled = !live.filled; filledBtn.textContent = live.filled ? "filled" : "outline"; } }, "outline");
    filledBtn.dataset.active = "";
    let ptCtrl = null;
    const ptRange = h("input", { type: "range", min: 10, max: 96, value: 28 });
    const ptVal = h("span", { class: "geo-val" }, "28");
    ptRange.addEventListener("input", () => { live.fontSize = Number(ptRange.value); ptVal.textContent = ptRange.value; });
    ptCtrl = h("label", { class: "small" }, "pt", ptRange, ptVal);

    const bar1 = h("div", { class: "paint-bar" },
      toolRow,
      h("div", { class: "paint-sep" }),
      h("label", { class: "small" }, "colour", colorInput),
      h("label", { class: "small" }, "size", sizeRange, sizeVal),
      h("label", { class: "small" }, "alpha", alphaRange, alphaVal),
      filledBtn,
      ptCtrl
    );
    const swatchRow = h("div", { class: "paint-swatches" });
    PAINT_SWATCHES.forEach((s) => {
      swatchRow.appendChild(h("button", { class: "swatch", style: { background: s }, title: s, onclick: () => { live.color = s; updateBar(); } }));
    });
    const bar2 = h("div", { class: "paint-bar" },
      swatchRow,
      h("div", { class: "paint-sep" }),
      undoBtn,
      redoBtn,
      h("button", { class: "mini-btn", onclick: clearAll }, "clear"),
      h("div", { class: "paint-sep" }),
      h("button", { class: "mini-btn", onclick: () => fileIn.click() }, "import"),
      h("button", { class: "mini-btn", onclick: () => exportAs("image/png") }, "export png"),
      h("button", { class: "mini-btn", onclick: () => exportAs("image/jpeg") }, "export jpg"),
      h("button", { class: "mini-btn", onclick: setAsDesktop, title: "hang this drawing on the desktop until the page reloads" }, "set as desktop"),
      fileIn
    );
    fileIn.addEventListener("change", () => {
      const f = fileIn.files?.[0];
      if (f) loadFile(f);
      fileIn.value = "";
    });
    barRefs.color = colorInput;
    syncTools();
    updateDepth();

    const root = h("div", { class: "paint" }, bar1, bar2, stage,
      h("div", { class: "paint-status" },
        h("span", {}, "brush"),
        h("span", {}, PW + "\u00d7" + PH),
        statusEl,
        h("span", { class: "dim" }, "hover a tool for what it does · drop or paste an image to import")
      )
    );

    const c = ctx();
    if (c) {
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, PW, PH);
    }
    return { root };
  }

  let winIdSeq = 1;

  const ICONS = [
    { key: "terminal", label: "terminal", glyph: "terminal", app: "terminal" },
    { key: "site", label: "Kiosk", glyph: "kiosk", app: "kiosk", url: "/" },
    { key: "browser", label: "browser", glyph: "browser", app: "browser" },
    { key: "editor", label: "mousepad", glyph: "editor", app: "editor" },
    { key: "doom", label: "doom", glyph: "doom", app: "doom" },
    { key: "taskmgr", label: "task manager", glyph: "taskmgr", app: "taskmgr" },
    { key: "paint", label: "paint", glyph: "paint", app: "paint" },
    { key: "cube", label: "geometry.gl", glyph: "cube3d", app: "cube3d" },
    { key: "manual", label: "manual", glyph: "manual", app: "manual" },
  ];

  const COL = 100;
  const ROW = 96;

  function desktopApp() {
    const root = h("div", { class: "desktop" });
    let menuOpen = false;
    let ctx = null;
    let props = null;
    let sel = [];
    let band = null;
    let offset = null;

    const topbar = h("div", { class: "desktop-topbar" });
    const iconsArea = h("div", { class: "desktop-icons" });
    const taskbar = h("div", { class: "taskbar" });
    const clockEl = h("span", { class: "topbar-clock" });

    function tick() {
      clockEl.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    tick();
    setInterval(tick, 20000);

    function fileIcons() {
      return Object.keys(getState().files).map((f) => ({
        key: "file:" + f,
        label: f,
        glyph: "file",
        app: "editor",
      }));
    }

    function allIcons() {
      return [...ICONS, ...fileIcons()];
    }

    function posOf(key, i) {
      const saved = getState().icons[key];
      return saved || { col: Math.floor(i / 6), row: i % 6 };
    }

    function launch(icon) {
      if (icon.key.startsWith("file:")) {
        const f = icon.key.slice(5);
        openWindow("editor", { file: f, draft: getState().files[f] || "", title: "mousepad - " + f });
        return;
      }
      openWindow(icon.app, icon.url ? { url: icon.url, title: icon.label } : {});
    }

    function renderTopbar() {
      topbar.innerHTML = "";
      const menuBtn = h("button", { class: "start-btn" + (menuOpen ? " open" : ""), "aria-expanded": menuOpen ? "true" : "false", onclick: () => { menuOpen = !menuOpen; renderTopbar(); } },
        h("span", { class: "start-glyph", "aria-hidden": true }, "\u25a4"),
        "menu"
      );
      topbar.appendChild(menuBtn);
      topbar.appendChild(h("span", { class: "topbar-sep", "aria-hidden": true }));
      topbar.appendChild(h("span", { class: "topbar-right" }, clockEl));
      if (menuOpen) {
        const scrim = h("div", { class: "start-scrim", onclick: () => { menuOpen = false; renderTopbar(); } });
        const menu = h("div", { class: "start-menu" });
        const items = allIcons();
        items.forEach((i) => {
          menu.appendChild(h("button", { onclick: () => { menuOpen = false; renderTopbar(); launch(i); } }, AppGlyph(i.glyph, "mglyph"), i.label));
        });
        topbar.appendChild(scrim);
        topbar.appendChild(menu);
      }
    }

    function renderIcons() {
      iconsArea.innerHTML = "";
      iconsArea.style.backgroundImage = getState().wallpaper ? "url(" + getState().wallpaper + ")" : "";
      if (getState().wallpaper) iconsArea.dataset.wall = "";
      else delete iconsArea.dataset.wall;
      iconsArea.appendChild(h("div", { class: "desktop-topbar-hidden", style: { display: "none" } }));
      const all = allIcons();
      all.forEach((icon, i) => {
        const p = posOf(icon.key, i);
        const moving = offset && offset.keys.includes(icon.key);
        const btn = h("button", {
          class: "dicon" + (moving ? " dragging" : "") + (sel.includes(icon.key) ? " is-selected" : ""),
          "data-key": icon.key,
          style: {
            left: p.col * COL + 12,
            top: p.row * ROW + 10,
            transform: moving ? "translate3d(" + offset.dx + "px, " + offset.dy + "px, 0)" : undefined,
          },
          ondblclick: () => launch(icon),
          oncontextmenu: (e) => openCtx(e, icon),
          onpointerdown: (e) => onIconDown(e, icon),
        }, AppGlyph(icon.glyph, "glyph"), h("span", {}, icon.label));
        iconsArea.appendChild(btn);
      });
      iconsArea.appendChild(h("pre", { class: "duck-big", style: { position: "absolute", right: 24, bottom: 20, opacity: 0.5 } }, DUCK_ASCII));
    }

    function renderTaskbar() {
      taskbar.innerHTML = "";
      const windows = getState().windows;
      if (windows.length === 0) {
        taskbar.appendChild(h("span", { class: "small", style: { opacity: 0.55 } }, "double click an icon."));
        return;
      }
      windows.forEach((w) => {
        const t = h("button", {
          class: "task" + (w.minimized ? "" : " active"),
          title: "click to toggle, middle click to close",
          onclick: () => (w.minimized ? focusWindow(w.id) : updateWindow(w.id, { minimized: true })),
          onauxclick: (e) => {
            if (e.button === 1) closeWindow(w.id);
          },
        }, w.title);
        taskbar.appendChild(t);
      });
    }

    function render() {
      renderTopbar();
      renderIcons();
      renderTaskbar();
    }

    function layoutBox(el) {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    }

    function onAreaDown(e) {
      if (e.button !== 0) return;
      if (e.target.closest && e.target.closest(".dicon")) return;
      const rect = layoutBox(iconsArea);
      const additive = e.shiftKey || e.ctrlKey || e.metaKey;
      const base = additive ? sel : [];
      if (!additive) sel = [];
      const sx = e.clientX;
      const sy = e.clientY;
      let dragging = false;
      const move = (ev) => {
        const p = { x: ev.clientX, y: ev.clientY };
        if (!dragging && Math.abs(p.x - sx) + Math.abs(p.y - sy) < 4) return;
        dragging = true;
        const x = Math.min(sx, p.x) - rect.left;
        const y = Math.min(sy, p.y) - rect.top;
        const w = Math.abs(p.x - sx);
        const hh = Math.abs(p.y - sy);
        band = { x, y, w, h: hh };
        renderIcons();
        const hit = [];
        iconsArea.querySelectorAll(".dicon").forEach((el) => {
          const b = layoutBox(el);
          const inside =
            b.left + b.width > Math.min(sx, p.x) &&
            b.left < Math.max(sx, p.x) &&
            b.top + b.height > Math.min(sy, p.y) &&
            b.top < Math.max(sy, p.y);
          if (inside && el.dataset.key) hit.push(el.dataset.key);
        });
        sel = [...new Set([...base, ...hit])];
        renderIcons();
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        band = null;
        renderIcons();
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    }

    function onIconDown(e, icon) {
      if (e.button !== 0) return;
      const additive = e.shiftKey || e.ctrlKey || e.metaKey;
      const group = additive
        ? sel.includes(icon.key)
          ? sel.filter((k) => k !== icon.key)
          : [...sel, icon.key]
        : sel.includes(icon.key)
          ? sel
          : [icon.key];
      sel = group;
      if (additive && !group.includes(icon.key)) {
        renderIcons();
        return;
      }
      renderIcons();
      const startX = e.clientX;
      const startY = e.clientY;
      let moved = false;
      let last = { x: 0, y: 0 };
      const all = allIcons();
      const move = (ev) => {
        const d = { x: ev.clientX - startX, y: ev.clientY - startY };
        last = d;
        if (!moved && Math.abs(d.x) + Math.abs(d.y) <= 6) return;
        moved = true;
        offset = { keys: group, dx: d.x, dy: d.y };
        renderIcons();
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        offset = null;
        renderIcons();
        if (!moved) return;
        const dc = Math.round(last.x / COL);
        const dr = Math.round(last.y / ROW);
        if (dc === 0 && dr === 0) return;
        setState((s) => {
          const next = { ...s.icons };
          for (const k of group) {
            const i = all.findIndex((a) => a.key === k);
            const p = s.icons[k] || { col: Math.floor(i / 6), row: i % 6 };
            next[k] = { col: Math.max(0, p.col + dc), row: Math.max(0, p.row + dr) };
          }
          return { icons: next };
        });
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    }

    function openCtx(e, icon) {
      e.preventDefault();
      e.stopPropagation();
      if (icon && !sel.includes(icon.key)) sel = [icon.key];
      if (!icon) sel = [];
      menuOpen = false;
      ctx = { x: e.clientX, y: e.clientY, icon: icon || null };
      renderTopbar();
      renderCtx();
    }

    function renderCtx() {
      document.querySelectorAll(".ctx-scrim, .ctx-menu, .ctx-props").forEach((el) => el.remove());
      if (!ctx) return;
      const files = getState().files;
      const scrim = h("div", { class: "ctx-scrim", onclick: () => { ctx = null; renderCtx(); }, oncontextmenu: (e) => { e.preventDefault(); ctx = null; renderCtx(); } });
      const menu = h("div", { class: "ctx-menu", style: { left: Math.min(ctx.x, window.innerWidth - 190), top: Math.min(ctx.y, window.innerHeight - 220) } });
      if (ctx.icon) {
        const icon = ctx.icon;
        menu.appendChild(h("span", { class: "ctx-title" }, icon.label));
        menu.appendChild(h("button", { onclick: () => { launch(icon); closeCtx(); } }, "open"));
        if (icon.key.startsWith("file:")) {
          menu.appendChild(h("button", { onclick: () => { openWindow("editor", { file: icon.label, draft: files[icon.label] || "", title: "mousepad - " + icon.label }); closeCtx(); } }, "edit in mousepad"));
          menu.appendChild(h("button", { onclick: () => { deleteFile(icon); closeCtx(); } }, "delete"));
        } else {
          menu.appendChild(h("button", { onclick: () => { openWindow(icon.app, icon.url ? { url: icon.url, title: icon.label } : {}); closeCtx(); } }, "open new instance"));
        }
        menu.appendChild(h("button", { onclick: () => { setState((s) => { const n = { ...s.icons }; delete n[icon.key]; return { icons: n }; }); closeCtx(); } }, "reset position"));
        menu.appendChild(h("span", { class: "ctx-sep" }));
        menu.appendChild(h("button", { onclick: () => { props = { icon, body: propsBody(icon) }; closeCtx(); renderProps(); } }, "properties"));
      } else {
        menu.appendChild(h("span", { class: "ctx-title" }, "desktop"));
        menu.appendChild(h("button", { onclick: () => { newFile(); closeCtx(); } }, "new text file"));
        menu.appendChild(h("button", { onclick: () => { openWindow("terminal", {}); closeCtx(); } }, "open terminal"));
        menu.appendChild(h("button", { onclick: () => { setState(() => ({ icons: {} })); closeCtx(); } }, "tidy icons"));
        menu.appendChild(h("span", { class: "ctx-sep" }));
        menu.appendChild(h("button", { onclick: () => { setState(() => ({ wallpaper: null })); closeCtx(); } }, "clear wallpaper"));
        menu.appendChild(h("button", { onclick: () => { openWindow("taskmgr", {}); closeCtx(); } }, "task manager"));
      }
      document.body.appendChild(scrim);
      document.body.appendChild(menu);
    }

    function closeCtx() {
      ctx = null;
      renderCtx();
    }

    function propsBody(icon) {
      const isFile = icon.key.startsWith("file:");
      const p = getState().icons[icon.key];
      if (isFile) {
        return [
          ["name", icon.label],
          ["type", "text/plain"],
          ["size", new Blob([getState().files[icon.label] || ""]).size + " bytes"],
          ["lines", String((getState().files[icon.label] || "").split("\n").length)],
          ["opens with", "mousepad"],
          ["position", p ? "col " + p.col + ", row " + p.row : "auto"],
        ];
      }
      return [
        ["name", icon.label],
        ["type", "application"],
        ["unit", icon.app + ".app"],
        ["exec", "/usr/bin/" + icon.app],
        ["position", p ? "col " + p.col + ", row " + p.row : "auto"],
      ];
    }

    function deleteFile(icon) {
      const f = icon.label;
      setState((s) => {
        const next = { ...s.files };
        delete next[f];
        const nextIcons = { ...s.icons };
        delete nextIcons[icon.key];
        return { files: next, icons: nextIcons };
      });
    }

    function newFile() {
      let name = "untitled.txt";
      setState((s) => {
        let n = 1;
        name = "untitled.txt";
        while (name in s.files) name = "untitled-" + ++n + ".txt";
        return { files: { ...s.files, [name]: "" } };
      });
      openWindow("editor", { file: name, draft: "", title: "mousepad - " + name });
    }

    function renderProps() {
      document.querySelectorAll(".ctx-props").forEach((el) => el.remove());
      if (!props) return;
      let pos = { x: Math.max(20, Math.round(window.innerWidth / 2 - 190)), y: Math.max(40, Math.round(window.innerHeight / 2 - 160)) };
      const win = h("div", { class: "ctx-props is-window", style: { left: pos.x, top: pos.y } });
      const head = h("div", { class: "ctx-props-head" }, h("span", {}, props.icon.label + " - properties"), h("button", { class: "mini-btn", onclick: () => { props = null; win.remove(); } }, "x"));
      const dl = h("dl");
      props.body.forEach(([k, v]) => {
        dl.appendChild(h("div", {}, h("dt", {}, k), h("dd", {}, v)));
      });
      head.addEventListener("pointerdown", (e) => {
        if (e.target.closest && e.target.closest("button")) return;
        const drag = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
        head.setPointerCapture(e.pointerId);
        const move = (ev) => {
          pos = {
            x: Math.min(window.innerWidth - 80, Math.max(0, ev.clientX - drag.dx)),
            y: Math.min(window.innerHeight - 40, Math.max(0, ev.clientY - drag.dy)),
          };
          win.style.left = pos.x + "px";
          win.style.top = pos.y + "px";
        };
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      });
      win.appendChild(head);
      win.appendChild(dl);
      document.body.appendChild(win);
    }

    iconsArea.addEventListener("pointerdown", onAreaDown);
    iconsArea.addEventListener("contextmenu", (e) => openCtx(e, null));

    const un = subscribe(() => {
      renderTopbar();
      renderIcons();
      renderTaskbar();
    });

    root.appendChild(topbar);
    root.appendChild(iconsArea);
    root.appendChild(taskbar);
    render();
    return { root, destroy: un };
  }

  function windowFrameApp(win, extraButtons) {
    const root = h("div", { class: "win" });
    const bodyEl = h("div", { class: "win-body" });
    const titleEl = h("span", { class: "win-title" });
    const bar = h("div", { class: "win-bar" }, titleEl);

    const drag = useDragState(win.id, root, bar, win.app);
    root.appendChild(bar);
    root.appendChild(bodyEl);

    const buttonsEl = h("div", { class: "win-btns" });
    if (extraButtons) {
      Object.values(extraButtons).forEach((b) => buttonsEl.appendChild(b));
    }
    const minBtn = h("button", { title: "minimize", onclick: () => updateWindow(win.id, { minimized: true }) }, "_");
    const maxBtn = h("button", { title: "maximize", onclick: () => drag.toggleMax() }, "\u25a1");
    const closeBtn = h("button", { class: "x", title: "close", onclick: () => closeWindow(win.id) }, "\u2715");
    buttonsEl.appendChild(minBtn);
    buttonsEl.appendChild(maxBtn);
    buttonsEl.appendChild(closeBtn);
    bar.appendChild(buttonsEl);
    buttonsEl.addEventListener("pointerdown", (e) => e.stopPropagation());

    const grips = {};
    ["n", "s", "e", "w", "nw", "ne", "sw", "se"].forEach((g) => {
      const grip = h("div", { class: "win-grip g-" + g });
      grip.addEventListener("pointerdown", (e) => drag.begin(e, g));
      root.appendChild(grip);
      grips[g] = grip;
    });

    function sync() {
      const w = getState().windows.find((x) => x.id === win.id);
      if (!w) return;
      titleEl.textContent = w.title;
      maxBtn.textContent = w.maximized ? "\u2750" : "\u25a1";
      maxBtn.title = w.maximized ? "restore" : "maximize";
      const spun = win.app !== "terminal" && getState().spin !== "none";
      root.className = "win" + (spun ? " win-spin " + spinClass(getState().spin) : "");
      if (spun) {
        Object.assign(root.style, spinStyle(getState().spin, getState().spinAngle, getState().spinSpeed));
      } else {
        root.style.animationDuration = "";
        root.style.animationDelay = "";
        root.style.transform = "";
      }
      if (w.minimized) {
        root.style.display = "none";
        return;
      }
      root.style.display = "";
      if (w.maximized) {
        root.style.left = "0";
        root.style.top = "var(--os-top)";
        root.style.width = "100%";
        root.style.height = "calc(100% - var(--os-top) - var(--os-bottom))";
        root.style.zIndex = String(w.z);
      } else if (!drag.active()) {
        root.style.left = w.x + "px";
        root.style.top = w.y + "px";
        root.style.width = w.w + "px";
        root.style.height = w.h + "px";
        root.style.zIndex = String(w.z);
      }
    }

    root.addEventListener("pointerdown", () => focusWindow(win.id));
    bar.addEventListener("dblclick", drag.toggleMax);

    const un = subscribe(sync);
    sync();
    return { root, bodyEl, sync, destroy: un };
  }

  function useDragState(id, root, bar, app) {
    let geom = { x: 0, y: 0, w: 0, h: 0 };
    let restore = { x: 0, y: 0, w: 0, h: 0 };
    let snapped = false;
    let dragRef = null;

    const syncGeom = () => {
      const w = getState().windows.find((x) => x.id === id);
      if (w && !dragRef) {
        geom = { x: w.x, y: w.y, w: w.w, h: w.h };
      }
      return w;
    };

    bar.addEventListener("pointerdown", (e) => begin(e, "move"));

    function begin(e, mode) {
      if (e.button !== 0) return;
      e.preventDefault();
      focusWindow(id);
      syncGeom();
      const w = getState().windows.find((x) => x.id === id);
      const start = { ...geom };
      if (mode !== "move") snapped = false;
      const tearOff = mode === "move" && w && (w.maximized || snapped);
      dragRef = { mode, sx: e.clientX, sy: e.clientY, start, tearOff, armed: false };
      e.target.setPointerCapture?.(e.pointerId);
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    }

    function elAngleOf() {
      return elAngle(root);
    }

    function P(e) {
      const deg = elAngleOf();
      if (!deg) return { x: e.clientX, y: e.clientY };
      const r = root.getBoundingClientRect();
      return unspinAround(e.clientX, e.clientY, deg, r.left + r.width / 2, r.top + r.height / 2);
    }

    function D(dx, dy) {
      return unspinDeltaBy(dx, dy, elAngleOf());
    }

    function move(e) {
      const d = dragRef;
      if (!d) return;
      const delta = D(e.clientX - d.sx, e.clientY - d.sy);
      let dx = delta.x;
      let dy = delta.y;
      if (!d.armed) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        d.armed = true;
        if (d.tearOff) {
          const r = restore;
          const p = P(e);
          d.start = {
            w: r.w,
            h: r.h,
            x: Math.round(p.x - r.w / 2),
            y: Math.max(chromeTop(), Math.round(p.y - 16)),
          };
          d.sx = e.clientX;
          d.sy = e.clientY;
          dx = 0;
          dy = 0;
          d.tearOff = false;
          snapped = false;
          const g = d.start;
          geom = g;
          apply(g);
          updateWindow(id, { maximized: false, ...g });
        }
      }
      const s = d.start;
      let next = { ...s };
      switch (d.mode) {
        case "move": {
          next = { ...s, x: s.x + dx, y: s.y + dy };
          const p = P(e);
          const z = zoneFor(p.x, p.y);
          if (z) showSnap(z);
          else hideSnap();
          break;
        }
        case "e":
          next.w = Math.max(MIN_W, s.w + dx);
          break;
        case "s":
          next.h = Math.max(MIN_H, s.h + dy);
          break;
        case "w":
          next.w = Math.max(MIN_W, s.w - dx);
          next.x = s.x + (s.w - next.w);
          break;
        case "n":
          next.h = Math.max(MIN_H, s.h - dy);
          next.y = s.y + (s.h - next.h);
          break;
        case "se":
          next.w = Math.max(MIN_W, s.w + dx);
          next.h = Math.max(MIN_H, s.h + dy);
          break;
        case "ne":
          next.w = Math.max(MIN_W, s.w + dx);
          next.h = Math.max(MIN_H, s.h - dy);
          next.y = s.y + (s.h - next.h);
          break;
        case "sw":
          next.w = Math.max(MIN_W, s.w - dx);
          next.x = s.x + (s.w - next.w);
          next.h = Math.max(MIN_H, s.h + dy);
          break;
        case "nw":
          next.w = Math.max(MIN_W, s.w - dx);
          next.x = s.x + (s.w - next.w);
          next.h = Math.max(MIN_H, s.h - dy);
          next.y = s.y + (s.h - next.h);
          break;
        default:
          return;
      }
      geom = next;
      apply(next);
    }

    function apply(g) {
      root.style.left = g.x + "px";
      root.style.top = g.y + "px";
      root.style.width = g.w + "px";
      root.style.height = g.h + "px";
    }

    function showSnap(z) {
      let el = document.querySelector(".snap-preview");
      if (!el) {
        el = h("div", { class: "snap-preview" });
        document.body.appendChild(el);
      }
      const g = zoneGeom(z);
      el.style.left = g.x + "px";
      el.style.top = g.y + "px";
      el.style.width = g.w + "px";
      el.style.height = g.h + "px";
      let label = el.querySelector(".snap-label");
      if (!label) {
        label = h("span", { class: "snap-label" }, "");
        el.appendChild(label);
      }
      label.textContent = SNAP_LABEL[z];
    }

    function hideSnap() {
      document.querySelectorAll(".snap-preview").forEach((el) => el.remove());
    }

    function up() {
      if (!dragRef) return;
      const wasMove = dragRef.mode === "move";
      const armed = dragRef.armed;
      const startGeom = dragRef.start;
      dragRef = null;
      const z = snapShown();
      hideSnap();
      if (!armed) return;
      if (wasMove && z) {
        restore = startGeom;
        snapped = true;
        const g = zoneGeom(z);
        geom = g;
        apply(g);
        updateWindow(id, { ...g, maximized: false });
        return;
      }
      updateWindow(id, geom);
    }

    function snapShown() {
      const el = document.querySelector(".snap-preview");
      return el ? "snap" : null;
    }

    function toggleMax() {
      const w = getState().windows.find((x) => x.id === id);
      if (!w) return;
      if (w.maximized) {
        snapped = false;
        const g = clampGeom(restore);
        restore = g;
        updateWindow(id, { maximized: false, ...g });
        geom = g;
        apply(g);
      } else {
        if (!snapped) restore = { ...geom };
        updateWindow(id, { maximized: true });
      }
    }

    function active() {
      return !!dragRef;
    }

    return { begin, toggleMax, active };
  }

  function clampGeom(g) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.max(240, Math.min(g.w, vw - 24));
    const hh = Math.max(160, Math.min(g.h, vh - 80));
    return {
      w,
      h: hh,
      x: Math.max(0, Math.min(g.x, vw - w)),
      y: Math.max(0, Math.min(g.y, vh - hh)),
    };
  }

  function appFactory(app, win) {
    switch (app) {
      case "terminal":
        return terminalApp(win);
      case "doom":
        return doomApp();
      case "browser":
        return browserApp(win);
      case "editor":
        return editorApp(win);
      case "taskmgr":
        return taskManagerApp();
      case "cube3d":
        return geoApp();
      case "paint":
        return paintApp();
      case "manual":
        return manualApp();
      case "kiosk":
        return kioskApp(win);
      default:
        return { root: h("div", {}) };
    }
  }

  const WINDOW_APPS = {
    terminal: "guest@lucazani: ~",
  };

  function osLayer() {
    const layer = h("div", { class: "os-layer" });
    const frames = new Map();
    const appRefs = new Map();

    function sync() {
      const s = getState();
      const kiosk = s.services["lucazani.service"] === "active";
      layer.className = "os-layer" + (kiosk ? " no-chrome" : "");
      const alive = new Set(s.windows.map((w) => w.id));
      for (const [id, entry] of frames) {
        if (!alive.has(id)) {
          entry.frame.remove();
          appRefs.get(id)?.destroy?.();
          appRefs.delete(id);
          frames.delete(id);
        }
      }
      s.windows.forEach((w) => {
        if (!frames.has(w.id)) {
          const win = { ...w };
          const extraButtons = {};
          if (w.app === "kiosk") {
            extraButtons.full = h("button", { class: "full-mode", title: "full mode - reload the site in kiosk mode", onclick: () => startKiosk() }, "\u2b36");
          }
          const frame = windowFrameApp(win, extraButtons);
          const app = appFactory(w.app, win);
          frame.bodyEl.appendChild(app.root);
          layer.appendChild(frame.root);
          frames.set(w.id, frame);
          appRefs.set(w.id, app);
        }
      });
      frames.forEach((f, id) => f.sync());
    }

    const un = subscribe(sync);
    sync();
    return { root: layer, destroy: un };
  }

  function bsodOverlay() {
    const root = h("div", { class: "overlay-full", style: { display: "none" } });
    let count = 10;
    let timer = null;
    function show() {
      count = 10;
      root.style.display = "";
      render();
      timer = setInterval(() => {
        count--;
        render();
        if (count <= 0) clearInterval(timer);
      }, 1000);
      setTimeout(() => logoutReset(), 10500);
    }
    function hide() {
      if (timer) clearInterval(timer);
      root.style.display = "none";
    }
    function render() {
      root.innerHTML = "";
      root.appendChild(
        h("div", { class: "bsod" },
          h("h2", {}, ":( the host lost its network"),
          h("p", {}, "networking.service was stopped by user ", h("strong", {}, "guest"), ". everything this machine shows arrives over that unit, so there is nothing left to show."),
          h("p", {}, "the machine will be reimaged in ", h("strong", {}, String(Math.max(count, 0))), " seconds. the guest session will not survive it."),
          h("p", { style: { marginTop: 14, opacity: 0.7 } }, "STOP CODE: DUCK_WAS_RIGHT"),
          h("button", { class: "mini-btn", style: { marginTop: 16 }, onclick: () => logoutReset() }, "reimage now")
        )
      );
    }
    const un = subscribe(() => {
      const on = getState().bsod;
      if (on) show();
      else hide();
    });
    return { root, destroy: un };
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

  function duckFightOverlay() {
    const root = h("div", { style: { display: "none" } });
    let hits = 0;
    let hp = 100;
    let friend = false;
    let pos = { x: 0, y: 0, r: 0 };
    let log = ["duck.service: active (running) since boot"];

    function render() {
      root.innerHTML = "";
      if (friend) {
        root.className = "duckfight is-friend";
        root.appendChild(h("pre", { class: "duck-big duck-friend" }, DUCK_ASCII));
        root.appendChild(h("p", { style: { position: "relative", maxWidth: "46ch" } }, "she takes the bread. no hurry, no grudge."));
        root.appendChild(h("p", { class: "small", style: { position: "relative", opacity: 0.85, maxWidth: "52ch" } }, "she is the one who opened the door out of the kiosk in the first place. a fair trade: a slice of bread for an escape route. duck.service stays up, and you two are friends now."));
        root.appendChild(h("button", { class: "mini-btn", style: { position: "relative" }, onclick: () => setState({ duckFight: false }) }, "go back, on good terms"));
        return;
      }
      root.className = "duckfight";
      root.appendChild(h("div", { class: "crack" }));
      const duckEl = h("div", { class: "duck-roam", style: { transform: "translate3d(" + pos.x + "vw, " + pos.y + "vh, 0) rotate(" + pos.r + "deg)" } });
      duckEl.appendChild(h("pre", { class: "duck-big" }, DUCK_ASCII));
      root.appendChild(duckEl);
      root.appendChild(h("div", { class: "flames" }));
      root.appendChild(
        h("div", { class: "duck-hp" },
          h("div", { class: "duck-hp-label" }, h("span", {}, "duck.service (PID 1)"), h("span", {}, hp + "%")),
          h("div", { class: "duck-hp-track" }, h("div", { class: "duck-hp-fill", style: { width: hp + "%" } }))
        )
      );
      const logEl = h("div", { class: "duck-log" });
      log.forEach((l) => logEl.appendChild(h("div", { class: l.startsWith("$") ? "duck-log-cmd" : undefined }, l)));
      root.appendChild(logEl);
      const weaponsEl = h("div", { class: "duck-weapons" });
      WEAPONS.forEach((w) => {
        weaponsEl.appendChild(h("button", { class: "mini-btn", onclick: () => strike(w) }, w.cmd));
      });
      root.appendChild(weaponsEl);
      root.appendChild(h("p", { class: "small", style: { position: "relative", opacity: 0.75 } }, "attempts: " + hits + " - kills: 0" + (hits >= 8 ? " - the duck is not tired." : "")));
      root.appendChild(h("button", { class: "mini-btn" + (hits >= 4 ? " duck-give-up" : ""), style: { position: "relative" }, onclick: () => { friend = true; log.push("duck.service: bread received. hostilities ended."); render(); } }, "give it bread"));
    }

    function strike(w) {
      const n = hits + 1;
      hits = n;
      pos = {
        x: (Math.random() - 0.5) * 2 * 34,
        y: (Math.random() - 0.5) * 2 * 16,
        r: (Math.random() - 0.5) * 2 * 14,
      };
      hp = Math.max(1, hp - w.dmg);
      log = [...log, "$ " + w.cmd, w.log, TAUNTS[n % TAUNTS.length]].slice(-9);
      render();
    }

    function start() {
      hits = 0;
      hp = 100;
      friend = false;
      pos = { x: 0, y: 0, r: 0 };
      log = ["duck.service: active (running) since boot"];
      render();
    }

    const un = subscribe(() => {
      const on = getState().duckFight;
      if (on) {
        if (root.style.display === "none") start();
        root.style.display = "";
      } else {
        root.style.display = "none";
      }
    });

    let healIv = setInterval(() => {
      if (getState().duckFight && !friend && hp < 100) {
        hp = Math.min(100, hp + 7);
        render();
      }
    }, 380);
    let roamIv = setInterval(() => {
      if (getState().duckFight && !friend) {
        pos = {
          x: (Math.random() - 0.5) * 2 * 34,
          y: (Math.random() - 0.5) * 2 * 16,
          r: (Math.random() - 0.5) * 2 * 10,
        };
        render();
      }
    }, 900);

    return {
      root,
      destroy: () => {
        un();
        clearInterval(healIv);
        clearInterval(roamIv);
      },
    };
  }

  function mercyOverlay() {
    const root = h("div", { class: "mercy", style: { display: "none" } });
    function render() {
      root.innerHTML = "";
      root.appendChild(
        h("div", { class: "box" },
          h("p", {}, h("strong", {}, "mercy."), " ten windows is enough. this whole thing is state in a browser tab, not a workstation."),
          h("p", { class: "small" }, "close something first."),
          h("button", { class: "mini-btn", onclick: () => setState({ mercy: false }) }, "fine")
        )
      );
    }
    const un = subscribe(() => {
      root.style.display = getState().mercy ? "" : "none";
      if (getState().mercy) render();
    });
    render();
    return { root, destroy: un };
  }

  function mobileWarnOverlay() {
    const root = h("div", { class: "mobile-warn", style: { display: "none" } });
    function render() {
      root.innerHTML = "";
      root.appendChild(
        h("div", { class: "box" },
          h("p", {}, h("strong", {}, "this is a desktop toy."), " draggable windows, a terminal and DOOM on a phone screen will be cramped."),
          h("p", { class: "small" }, "It still works if you want to try."),
          h("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
            h("button", { class: "mini-btn", onclick: () => { setState({ mobileWarn: false, mobileAck: true }); requestTerminal(); } }, "continue anyway"),
            h("button", { class: "mini-btn", onclick: () => setState({ mobileWarn: false }) }, "back to the site")
          )
        )
      );
    }
    const un = subscribe(() => {
      root.style.display = getState().mobileWarn ? "" : "none";
      if (getState().mobileWarn) render();
    });
    render();
    return { root, destroy: un };
  }

  function kbNodes() {
    const age = calcAge();
    return [
      { t: "brand", v: "lucazani.com" },
      { t: "nav", v: ["projects", "blog", "likes", "contact"] },
      { t: "rule" },
      { t: "h1", v: "Luca Zani" },
      { t: "p", v: age + " y/o developer from Bolzano, Italy. Backend-focused but full-stack when needed. I write code, solder, 3D print, and build cool things." },
      { t: "small", v: "(yes, the age is auto updated, check it out on 18 August midnight)" },
      { t: "p", v: "Feel free to reach out anytime" },
      { t: "h2", v: "What I'm Building" },
      { t: "h3", v: "BananaWiki (2026)" },
      { t: "p", v: "A private wiki platform: Markdown pages with history, Kanban boards, Canvas diagrams, built-in chat and 33 toggleable plugins." },
      { t: "btn", v: "read more \u2192" },
      { t: "h3", v: "Wicked Agent" },
      { t: "p", v: "Open-source, asynchronous coding agent you can host on your own VPS. Inspired by Devin AI." },
      { t: "btn", v: "read more \u2192" },
      { t: "h3", v: "Unnamed Engine" },
      { t: "p", v: "A game engine experiment. Still learning, still exploring." },
      { t: "btn", v: "read more \u2192" },
      { t: "h2", v: "A Note on the Rest" },
      { t: "p", v: "90-95% of what I build is an experiment. Most of it ends up archived or deleted internally, because I only publish work I consider pseudo-significant." },
      { t: "rule" },
      { t: "foot", v: ["\u00a9 " + new Date().getFullYear() + " Luca Zani", "MIT", "source"] },
    ];
  }

  const T_TYPE = 780;
  const T_SETTLE = 3000;
  const T_OPEN = 3720;

  function kbLine(node, i) {
    const style = { "--kb-i": i };
    if (node.t === "rule") return h("div", { class: "kb-rule", style });
    if (node.t === "nav" || node.t === "foot") {
      const row = h("div", { class: "kb-row kb-" + node.t, style });
      node.v.forEach((w) => {
        row.appendChild(h("span", { class: "kb-word" }, h("i", { class: "kb-bar" }), h("em", { class: "kb-ink" }, w)));
      });
      return row;
    }
    return h("div", { class: "kb-el kb-" + node.t, style }, h("i", { class: "kb-bar" }), h("em", { class: "kb-ink" }, node.v));
  }

  function kioskBootOverlay() {
    const root = h("div", { style: { display: "none" } });
    let phase = null;
    let timers = [];

    function clearTimers() {
      timers.forEach(clearTimeout);
      timers = [];
    }

    function render() {
      clearTimers();
      if (!getState().kioskBooting) {
        phase = null;
        root.style.display = "none";
        return;
      }
      root.style.display = "";
      phase = "wire";
      timers.push(setTimeout(() => (phase = "type"), T_TYPE));
      timers.push(setTimeout(() => (phase = "settle"), T_SETTLE));
      timers.push(setTimeout(() => (phase = "open"), T_OPEN));

      root.className = "kiosk-build is-" + phase;
      root.innerHTML = "";
      root.appendChild(h("div", { class: "kb-guides" }));
      const page = h("div", { class: "kb-page" });
      kbNodes().forEach((n, i) => page.appendChild(kbLine(n, i)));
      root.appendChild(page);
      root.appendChild(h("div", { class: "kb-sweep" }));

      const iv = setInterval(() => {
        if (!root.isConnected || !getState().kioskBooting) {
          clearInterval(iv);
          return;
        }
        root.className = "kiosk-build is-" + phase;
        if (phase === "open") {
          clearInterval(iv);
          root.innerHTML = "";
          root.appendChild(h("div", { class: "kiosk-open" }));
        }
      }, 100);
      timers.push(setTimeout(() => clearInterval(iv), 10000));
    }

    const un = subscribe(render);
    return { root, destroy: () => { un(); clearTimers(); } };
  }

  function idleReset() {
    const IDLE_MS = 5 * 60 * 1000;
    let last = Date.now();
    const mark = () => (last = Date.now());
    ["mousedown", "keydown", "touchstart", "scroll", "wheel"].forEach((e) =>
      window.addEventListener(e, mark, { passive: true })
    );
    setInterval(() => {
      if (Date.now() - last > IDLE_MS && sessionIsDirty()) {
        last = Date.now();
        logoutReset();
        window.location.replace(rootPrefix() + "index.html");
      }
    }, 5000);
  }

  function inceptionDuck() {
    const root = h("div", { style: { display: "none" } });
    const LINES = [
      "hey. hey. you are inside a browser, inside a desktop, inside this site.",
      "opening the escape terminal in here would be an inception. we do not do that.",
      "one layer of me is plenty. go escape from the real page.",
    ];
    let line = 0;
    let on = false;
    let timer = null;
    const handler = () => {
      line = (line + 1) % LINES.length;
      on = false;
      requestAnimationFrame(() => {
        on = true;
        render();
      });
    };
    window.addEventListener(INCEPTION_EVENT, handler);
    function render() {
      if (timer) clearTimeout(timer);
      if (!on) {
        root.style.display = "none";
        return;
      }
      root.style.display = "";
      root.className = "inception-duck";
      root.innerHTML = "";
      root.appendChild(h("div", { class: "inception-duck-say", role: "status", "aria-live": "polite" }, LINES[line]));
      root.appendChild(h("pre", { class: "inception-duck-art", "aria-hidden": true }, DUCK_ASCII));
      timer = setTimeout(() => {
        on = false;
        render();
      }, 7200);
    }
    return { root, destroy: () => window.removeEventListener(INCEPTION_EVENT, handler) };
  }

  function themePanelApp() {
    const root = h("div", { class: "theme-panel", style: { display: "none" } });
    const fields = ["bg", "fg", "accent", "panel"];
    function render() {
      root.innerHTML = "";
      const s = getState();
      fields.forEach((f) => {
        const input = h("input", { type: "color", value: s.custom[f] });
        input.addEventListener("input", () => {
          setState({ custom: { ...getState().custom, [f]: input.value } });
        });
        root.appendChild(h("label", {}, f, input));
      });
    }
    const un = subscribe(() => {
      root.style.display = getState().themePanel ? "" : "none";
      if (getState().themePanel) render();
    });
    return { root, destroy: un };
  }

  function escapeFloatBtn() {
    const btn = h("button", { class: "mini-btn escape-float", style: { display: "none" }, onclick: () => requestTerminal() }, "terminal");
    function sync() {
      const s = getState();
      const kiosk = s.services["lucazani.service"] === "active";
      const hasTerminal = s.windows.some((w) => w.app === "terminal");
      btn.style.display = !kiosk && !hasTerminal ? "" : "none";
    }
    const un = subscribe(sync);
    sync();
    return { root: btn, destroy: un };
  }

  function applyTheme() {
    const s = getState();
    const rootEl = document.documentElement;
    rootEl.setAttribute("data-theme", s.theme);
    if (s.theme === "custom") {
      rootEl.style.setProperty("--c-bg", s.custom.bg);
      rootEl.style.setProperty("--c-fg", s.custom.fg);
      rootEl.style.setProperty("--c-accent", s.custom.accent);
      rootEl.style.setProperty("--c-panel", s.custom.panel);
    }
    if (s.spin === "none") rootEl.removeAttribute("data-spin");
    else rootEl.setAttribute("data-spin", "on");
  }

  function reflowViewport() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const small = vw < 760;
    setState((s) => ({
      windows: s.windows.map((w) => refit(w, vw, vh, small)),
      stashed: s.stashed.map((w) => refit(w, vw, vh, small)),
      mobileWarn: small ? s.mobileWarn : false,
    }));
  }

  function refit(w, vw, vh, small) {
    if (small) return { ...w, maximized: true };
    const width = Math.max(240, Math.min(w.w, vw - 24));
    const height = Math.max(160, Math.min(w.h, vh - 80));
    return {
      ...w,
      w: width,
      h: height,
      x: Math.max(0, Math.min(w.x, vw - width)),
      y: Math.max(0, Math.min(w.y, vh - height)),
    };
  }

  function boot() {
    if (isEmbedded()) {
      const duck = inceptionDuck();
      document.body.appendChild(duck.root);
      return;
    }
    hydrate();

    const desktop = desktopApp();
    const layer = osLayer();
    const bsod = bsodOverlay();
    const duckFight = duckFightOverlay();
    const mercy = mercyOverlay();
    const mobileWarn = mobileWarnOverlay();
    const kioskBoot = kioskBootOverlay();
    const themePanel = themePanelApp();
    const escapeFloat = escapeFloatBtn();

    const spinStage = document.createElement("div");
    spinStage.className = "spin-stage";

    document.body.appendChild(desktop.root);
    document.body.appendChild(layer.root);
    document.body.appendChild(bsod.root);
    document.body.appendChild(duckFight.root);
    document.body.appendChild(mercy.root);
    document.body.appendChild(mobileWarn.root);
    document.body.appendChild(kioskBoot.root);
    document.body.appendChild(themePanel.root);
    document.body.appendChild(escapeFloat.root);

    function syncChrome() {
      const s = getState();
      const kiosk = s.services["lucazani.service"] === "active";
      desktop.root.style.display = kiosk ? "none" : "";
      const termVisible = s.windows.some((w) => w.app === "terminal" && !w.minimized);
      document.body.classList.toggle("os-term-visible", termVisible);
      const spinRoot = document.querySelector(".spin-root");
      if (spinRoot) {
        spinRoot.className = "spin-root " + spinClass(s.spin);
        const st = spinStyle(s.spin, s.spinAngle, s.spinSpeed);
        if (st) Object.assign(spinRoot.style, st);
        else {
          spinRoot.style.animationDuration = "";
          spinRoot.style.animationDelay = "";
          spinRoot.style.transform = "";
        }
      }
      const creed = document.querySelector(".creed");
      if (creed) creed.style.display = s.cycled ? "" : "none";
      applyTheme();
    }

    const unChrome = subscribe(syncChrome);
    syncChrome();

    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(reflowViewport);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    document.addEventListener("click", (e) => {
      const duckBtn = e.target.closest(".duck-btn");
      if (duckBtn) requestTerminal();
    });

    idleReset();

    const stopFns = [
      desktop.destroy,
      layer.destroy,
      bsod.destroy,
      duckFight.destroy,
      mercy.destroy,
      mobileWarn.destroy,
      kioskBoot.destroy,
      themePanel.destroy,
      escapeFloat.destroy,
      unChrome,
    ];
    window.__osCleanup = () => stopFns.forEach((fn) => fn());
  }

  window.LucaOs = {
    boot,
    requestTerminal,
    getState,
    setState,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
