import { useEffect, useState } from "react";
import { DUCK_ASCII } from "@/lib/site";

export const INCEPTION_EVENT = "os:inception-duck";

const LINES = [
  "hey. hey. you are inside a browser, inside a desktop, inside this site.",
  "opening the escape terminal in here would be an inception. we do not do that.",
  "one layer of me is plenty. go escape from the real page.",
];

/** Rendered only in embedded frames (?embed=1). The escape hatch does not
 *  nest: instead a duck flies in and says so. */
export function InceptionDuck() {
  const [on, setOn] = useState(false);
  const [line, setLine] = useState(0);

  useEffect(() => {
    const handler = () => {
      setLine((n) => (n + 1) % LINES.length);
      setOn(false);
      // restart the flight even if it is already on screen
      requestAnimationFrame(() => setOn(true));
    };
    window.addEventListener(INCEPTION_EVENT, handler);
    return () => window.removeEventListener(INCEPTION_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => setOn(false), 7200);
    return () => clearTimeout(t);
  }, [on, line]);

  if (!on) return null;

  return (
    <div className="inception-duck" role="status" aria-live="polite">
      <div className="inception-duck-say">{LINES[line]}</div>
      <pre className="inception-duck-art" aria-hidden="true">
        {DUCK_ASCII}
      </pre>
    </div>
  );
}
