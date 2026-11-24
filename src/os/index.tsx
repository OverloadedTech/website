import { render } from "preact";
import { useEffect } from "preact/hooks";
import { Browser } from "./apps/Browser";
import { Geometry } from "./apps/Geometry";
import { Paint } from "./apps/Paint";
import { Colours, Doom, Kiosk, Manual, Mousepad, TaskManager } from "./apps/small";
import { Desktop } from "./Desktop";
import {
  Bsod,
  DuckFight,
  InceptionDuck,
  Mercy,
  MobileWarn,
  Rebuild,
  useIdleReset,
} from "./Overlays";
import { spinStyle } from "./spin";
import { get, refit, requestTerminal, subscribe, useOs, type Win } from "./state";
import { Terminal } from "./Terminal";
import { Window } from "./Window";

function App({ win }: { win: Win }) {
  switch (win.app) {
    case "terminal":
      return <Terminal win={win} />;
    case "kiosk":
      return <Kiosk win={win} />;
    case "browser":
      return <Browser win={win} />;
    case "mousepad":
      return <Mousepad win={win} />;
    case "doom":
      return <Doom />;
    case "taskmgr":
      return <TaskManager />;
    case "paint":
      return <Paint />;
    case "geometry":
      return <Geometry />;
    case "manual":
      return <Manual />;
    case "colours":
      return <Colours />;
  }
}

function Os() {
  const kiosk = useOs((s) => s.units["lucazani.service"]);
  const wins = useOs((s) => s.wins);
  const overlay = useOs((s) => s.overlay);
  const booting = useOs((s) => s.booting);

  useIdleReset();
  useEffect(() => {
    refit();
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(refit);
    };
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      {!kiosk && <Desktop />}
      <div class={kiosk ? "windows bare" : "windows"}>
        {wins.map((w) => (
          <Window key={w.id} win={w}>
            <App win={w} />
          </Window>
        ))}
      </div>
      {!kiosk && !wins.some((w) => w.app === "terminal") && (
        <button class="btn float" onClick={requestTerminal}>
          terminal
        </button>
      )}
      {booting && <Rebuild />}
      {overlay === "duck" && <DuckFight />}
      {overlay === "bsod" && <Bsod />}
      {overlay === "mercy" && <Mercy />}
      {overlay === "mobile" && <MobileWarn />}
    </>
  );
}

// the static page lives outside preact, so its bits follow the state by hand
function syncPage() {
  const s = get();
  const root = document.documentElement;
  root.dataset.theme = s.theme;
  for (const [k, v] of Object.entries(s.custom)) root.style.setProperty(`--c-${k}`, v);
  root.classList.toggle(
    "term-open",
    s.wins.some((w) => w.app === "terminal" && !w.min),
  );
  root.classList.toggle("cycled", s.cycled);
}

function spinSite() {
  const spin = get().spin;
  const site = document.getElementById("site")!;
  document.documentElement.classList.toggle("spinning", spin.mode !== "off");
  site.removeAttribute("style");
  Object.assign(site.style, spinStyle(spin));
}

export function mountOs(el: HTMLElement, embedded: boolean) {
  if (embedded) {
    render(<InceptionDuck />, el);
    return;
  }
  let last = get();
  subscribe(() => {
    const s = get();
    if (s.spin !== last.spin) spinSite();
    if (
      s.theme !== last.theme ||
      s.custom !== last.custom ||
      s.wins !== last.wins ||
      s.cycled !== last.cycled
    )
      syncPage();
    last = s;
  });
  syncPage();
  render(<Os />, el);
}
