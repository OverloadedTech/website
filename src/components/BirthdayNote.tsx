import { useEffect, useState } from "react";
import { calcAge, isBirthday } from "@/lib/site";

/** Shows a small birthday line, only on 18 August. Client-only to avoid SSR date drift. */
export function BirthdayNote() {
  const [age, setAge] = useState<number | null>(null);

  useEffect(() => {
    if (isBirthday()) setAge(calcAge());
  }, []);

  if (age === null) return null;

  return (
    <p className="birthday-note">
      🎉 it&apos;s 18 August, which means it&apos;s my birthday — {age} today. thanks for stopping by.
    </p>
  );
}
