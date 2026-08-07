import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { applyPending, runCommand, type Pending } from "./commands";
import { closeWindow, updateWindow, useOs, type TermLine, type WinState } from "./store";

const BANNER: TermLine[] = [
  { t: "dim", v: "lucazani.com tty1 - guest session" },
  { t: "dim", v: "type help." },
  { t: "dim", v: "" },
];

export function Terminal({ win }: { win: WinState }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lines = useOs((s) => s.windows.find((w) => w.id === win.id)?.lines) ?? [];
  const history = useOs((s) => s.windows.find((w) => w.id === win.id)?.history) ?? [];
  const [value, setValue] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const [hIdx, setHIdx] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);

  /* the topmost visible window owns the keyboard: when another terminal is
   * closed with `exit`, or the kiosk lets go of the screen, the caret lands
   * back here without the user having to click anything. */
  const topId = useOs((s) => {
    const vis = s.windows.filter((w) => !w.minimized);
    if (vis.length === 0) return null;
    return vis.reduce((a, b) => (b.z > a.z ? b : a)).id;
  });
  const screenTaken = useOs((s) => s.kioskBooting);

  useEffect(() => {
    if (screenTaken || topId !== win.id) return;
    const t = setTimeout(() => input.current?.focus({ preventScroll: true }), 0);
    return () => clearTimeout(t);
  }, [topId, win.id, screenTaken]);

  useEffect(() => {
    if (lines.length === 0) updateWindow(win.id, { lines: BANNER });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length, pending]);

  const push = (next: TermLine[], clear?: boolean) => {
    const base = clear ? [] : lines;
    updateWindow(win.id, { lines: [...base, ...next].slice(-400) });
  };

  const submit = () => {
    const raw = value;
    setValue("");
    setHIdx(null);
    const echoed: TermLine[] = [{ t: "in", v: `${pending ? "" : "guest@lucazani:~$ "}${raw}` }];

    if (pending) {
      const res = applyPending(pending, raw, win.id);
      setPending(null);
      push([...echoed, ...res, { t: "dim", v: "" }]);
      return;
    }

    // empty enter: just the bare prompt, no output, no spacer.
    if (!raw.trim()) {
      push(echoed);
      return;
    }

    const result = runCommand(raw, {
      navigate: (p) => void navigate({ to: p }),
      pathname,
      winId: win.id,
    });
    if (result.close) {
      closeWindow(win.id);
    } else if (result.clear) {
      updateWindow(win.id, { lines: [] });
    } else {
      push([...echoed, ...result.lines, { t: "dim", v: "" }]);
    }
    if (raw.trim() && !result.close)
      updateWindow(win.id, { history: [...history, raw.trim()].slice(-80) });
    if (result.pending) setPending(result.pending);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = hIdx === null ? history.length - 1 : Math.max(0, hIdx - 1);
      setHIdx(idx);
      setValue(history[idx] ?? "");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIdx === null) return;
      const idx = hIdx + 1;
      if (idx >= history.length) {
        setHIdx(null);
        setValue("");
      } else {
        setHIdx(idx);
        setValue(history[idx] ?? "");
      }
    }
  };

  return (
    <div className="term" ref={scroller} onClick={() => input.current?.focus()}>
      {lines.map((l, i) => (
        <div key={i} className={l.t}>
          {l.v || "\u00a0"}
        </div>
      ))}
      <div className="term-row">
        {pending ? (
          <span className="ps1">continue? [y/N]&nbsp;</span>
        ) : (
          <span className="ps1">
            guest@lucazani:<span className="path">~</span>${"\u00a0"}
          </span>
        )}
        <input
          ref={input}
          className="term-input"
          value={value}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          aria-label="terminal input"
        />

      </div>
    </div>
  );
}
