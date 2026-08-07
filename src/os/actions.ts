import { getState, openWindow, setState } from "./store";
import { INCEPTION_EVENT } from "./InceptionDuck";

export function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < 760;
}

/** True inside our own frames (browser app / kiosk app render the site with ?embed=1). */
export function isEmbedded() {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("embed")
  );
}

/** Opens a terminal, warning first on small screens. */
export function requestTerminal() {
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
        w.id === existing.id ? { ...w, minimized: false, z: s.nextZ + 1 } : w,
      ),
    });
    return;
  }
  openWindow("terminal");
}
