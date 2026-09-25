import { useEffect, useState } from "react";
import { ageSequence, ageStepDelay, calcAge } from "@/lib/site";

/**
 * Renders the age growing up from 13 (when the site started) to the real age,
 * one year at a time with a random pause before each step.
 * Computed client-side only so SSR/hydration can't disagree about "today".
 */
export function AgeCounter() {
  const [step, setStep] = useState(0);
  const [real, setReal] = useState<number | null>(null);

  useEffect(() => {
    const age = calcAge();
    setReal(age);
    // no counting for people who asked the system for less motion
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setStep(ageSequence(age).length - 1);
    }
  }, []);

  const seq = real === null ? [] : ageSequence(real);

  useEffect(() => {
    if (!seq.length || step >= seq.length - 1) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), ageStepDelay(step === seq.length - 2));
    return () => window.clearTimeout(t);
  }, [step, seq.length]);

  if (real === null) return <span className="age-counter" aria-hidden="true" />;

  // Screen readers get the real age once; the counting is visual only.
  return (
    <span className="age-counter">
      <span className="visually-hidden">{real}</span>
      <span aria-hidden="true">
        {seq.slice(0, step + 1).map((a, i) => {
          const isLast = i === seq.length - 1 && step === seq.length - 1;
          return (
            <span key={a} className={isLast ? "age-now" : "age-old"}>
              {a}
            </span>
          );
        })}
      </span>
    </span>
  );
}
