import { useEffect, useState, type CSSProperties } from "react";
import { DUCK_ASCII } from "@/lib/site";

export const CV_DUCK_EVENT = "site:cv-duck";

/** Ask the duck to come out and apologise for the missing CV. */
export function summonCvDuck(from?: HTMLElement) {
  window.dispatchEvent(new CustomEvent(CV_DUCK_EVENT, { detail: from?.getBoundingClientRect() }));
}

// keep in sync with the animation timings in styles.css (.cv-duck-*)
const IMPACT_MS = 1500;
const LEAVE_MS = 6000;

// rough size of the ASCII duck, used to centre her under the button
const DUCK_W = 60;

const SORRY = "so sorry! the CV is still a work in progress. thank you for being patient.";
const AFTER = "oh no, the cone slipped! are you okay? please come back soon, it will be worth it.";

function Cone() {
  return (
    <svg viewBox="0 0 24 26" aria-hidden="true">
      <path d="M12 1.5 19.5 21h-15z" fill="#ff7a1a" />
      <path d="M9.3 8.5h5.4l1.35 3.5h-8.1z" fill="#fff" />
      <path d="M6.6 15.5h10.8l1.15 3H5.45z" fill="#fff" />
      <rect x="1.5" y="20.5" width="21" height="4" rx="1" fill="#e2620a" />
    </svg>
  );
}

/** The CV does not exist yet: clicking it summons a duck in a traffic cone
 *  who says sorry and then throws the cone at the screen. */
export function CvDuck() {
  // bumped on every click so the whole sequence restarts from the top
  const [run, setRun] = useState(0);
  const [on, setOn] = useState(false);
  const [hit, setHit] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({});

  useEffect(() => {
    const handler = (e: Event) => {
      // she pops out right under the CV button, wherever the top bar put it
      const r = (e as CustomEvent<DOMRect | undefined>).detail;
      const vw = window.innerWidth;
      const cx = r ? r.left + r.width / 2 : vw - 120;
      const top = (r ? r.bottom : 48) + 26;
      const right = Math.max(8, vw - cx - DUCK_W / 2);
      setPos({
        top,
        right,
        // how far the cone has to travel to reach the middle of the screen
        "--cv-dx": `${vw / 2 - (vw - right - DUCK_W / 2)}px`,
        "--cv-dy": `${window.innerHeight / 2 - top}px`,
      } as CSSProperties);
      setHit(false);
      setOn(true);
      setRun((n) => n + 1);
    };
    window.addEventListener(CV_DUCK_EVENT, handler);
    return () => window.removeEventListener(CV_DUCK_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!on) return;
    const root = document.documentElement;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = [
      setTimeout(() => {
        setHit(true);
        // the page flinches when the cone lands
        if (!still) root.setAttribute("data-bonk", "");
      }, IMPACT_MS),
      setTimeout(() => root.removeAttribute("data-bonk"), IMPACT_MS + 450),
      setTimeout(() => setOn(false), LEAVE_MS),
    ];
    return () => {
      timers.forEach(clearTimeout);
      root.removeAttribute("data-bonk");
    };
  }, [on, run]);

  if (!on) return null;

  return (
    <div key={run} className="cv-duck-layer">
      <div className="inception-duck cv-duck" style={pos} role="status" aria-live="polite">
        <div className="inception-duck-say">{hit ? AFTER : SORRY}</div>
        <div className="cv-duck-body">
          <pre className="cv-duck-art" aria-hidden="true">
            {DUCK_ASCII}
          </pre>
          <span className="cv-duck-cone">
            <Cone />
          </span>
        </div>
      </div>
      <div className="cv-duck-bonk" aria-hidden="true">
        <span>*bonk*</span>
      </div>
    </div>
  );
}
