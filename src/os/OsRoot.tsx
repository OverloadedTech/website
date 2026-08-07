import { useEffect, useState } from "react";
import { BrowserApp, DoomApp, EditorApp, GeoApp, KioskApp, ManualApp, TaskManagerApp } from "./apps";
import { PaintApp } from "./PaintApp";
import { Desktop } from "./Desktop";
import { Bsod, DuckFight, IdleReset, KioskBoot, Mercy, MobileWarn } from "./Overlays";
import { Terminal } from "./Terminal";
import { WindowFrame } from "./WindowFrame";
import { startKiosk } from "./commands";
import { requestTerminal } from "./actions";
import { InceptionDuck } from "./InceptionDuck";
import { SpinBox } from "./SpinBox";

import { hydrate, reflowViewport, useOs, type WinState } from "./store";

function AppBody({ win }: { win: WinState }) {
  switch (win.app) {
    case "terminal":
      return <Terminal win={win} />;
    case "doom":
      return <DoomApp />;
    case "browser":
      return <BrowserApp win={win} />;
    case "editor":
      return <EditorApp win={win} />;
    case "taskmgr":
      return <TaskManagerApp />;
    case "cube3d":
      return <GeoApp />;
    case "paint":
      return <PaintApp />;
    case "manual":
      return <ManualApp />;
    case "kiosk":
      return <KioskApp win={win} />;
    default:
      return null;
  }
}

export function OsRoot() {
  const [embedded, setEmbedded] = useState(false);
  const booted = useOs((s) => s.booted);
  const theme = useOs((s) => s.theme);
  const custom = useOs((s) => s.custom);
  const windows = useOs((s) => s.windows);
  const kiosk = useOs((s) => s.services["lucazani.service"] === "active");
  const spin = useOs((s) => s.spin);

  useEffect(() => {
    // Only hide the OS when *we* framed the page (kiosk/browser windows),
    // not when the whole site sits in someone else's iframe.
    if (new URLSearchParams(window.location.search).has("embed")) {
      setEmbedded(true);
      return;
    }
    hydrate();
  }, []);

  // desktop <-> mobile mid-session: refit every window so none is left
  // parked outside the viewport (the classic "hidden terminal" on phones)
  useEffect(() => {
    if (embedded) return;
    reflowViewport();
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(reflowViewport);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [embedded]);



  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (theme === "custom") {
      root.style.setProperty("--c-bg", custom.bg);
      root.style.setProperty("--c-fg", custom.fg);
      root.style.setProperty("--c-accent", custom.accent);
      root.style.setProperty("--c-panel", custom.panel);
    }
  }, [theme, custom]);

  // a rotated page overflows the viewport; kill scrollbars while it turns
  useEffect(() => {
    const root = document.documentElement;
    if (spin === "none") root.removeAttribute("data-spin");
    else root.setAttribute("data-spin", "on");
    return () => root.removeAttribute("data-spin");
  }, [spin]);

  if (embedded) return <InceptionDuck />;
  if (!booted) return null;


  // terminals stay upright: the way out must never spin
  const renderWin = (w: WinState) => (
    <WindowFrame
      key={w.id}
      win={w}
      extraButtons={
        w.app === "kiosk" ? (
          <button
            className="full-mode"
            title="full mode - reload the site in kiosk mode"
            onClick={() => startKiosk()}
          >
            ⛶
          </button>
        ) : undefined
      }
    >
      <AppBody win={w} />
    </WindowFrame>
  );

  return (
    <>
      {/* the desktop never spins: it is the stable floor under everything */}
      {!kiosk && <Desktop />}
      {/* windows each turn around their own centre (see WindowFrame), so they
          all share one honest stacking context */}
      <div className={`os-layer${kiosk ? " no-chrome" : ""}`}>{windows.map(renderWin)}</div>

      {!kiosk && windows.every((w) => w.app !== "terminal") && (
        <button className="mini-btn escape-float" onClick={() => requestTerminal()}>
          terminal
        </button>
      )}
      {/* the rebuild turns with everything else when the machine is spinning */}
      <SpinBox className="spin-kiosk">
        <KioskBoot />
      </SpinBox>

      <DuckFight />
      <Bsod />
      <Mercy />
      <MobileWarn />
      <IdleReset />
    </>
  );
}
