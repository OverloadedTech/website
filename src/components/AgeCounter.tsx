import { useEffect, useState } from "react";
import { ageSequence, calcAge } from "@/lib/site";

/**
 * Renders the age growing up from 13 (when the site started) to the real age.
 * Computed client-side only so SSR/hydration can't disagree about "today".
 */
export function AgeCounter() {
  const [step, setStep] = useState(0);
  const [real, setReal] = useState<number | null>(null);

  useEffect(() => {
    setReal(calcAge());
  }, []);

  const seq = real === null ? [] : ageSequence(real);

  useEffect(() => {
    if (!seq.length || step >= seq.length - 1) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), step === seq.length - 2 ? 620 : 380);
    return () => window.clearTimeout(t);
  }, [step, seq.length]);

  if (real === null) return <span className="age-counter" aria-hidden="true" />;

  return (
    <span className="age-counter" aria-label={`${real} years old`}>
      {seq.slice(0, step + 1).map((a, i) => {
        const isLast = i === seq.length - 1 && step === seq.length - 1;
        if (a === "...") {
          return (
            <span key="ellipsis" className="age-ellipsis" aria-hidden="true">
              ...
            </span>
          );
        }
        return (
          <span key={a} className={isLast ? "age-now" : "age-old"}>
            {a}
          </span>
        );
      })}
    </span>
  );
}
