import { useEffect, useRef, useState } from "preact/hooks";
import { answer, run, type Line, type Pending } from "./commands";
import { closeWindow, useOs, type Win } from "./state";

const BANNER: Line[] = [
  { k: "dim", t: "lucazani.com tty1 - guest session" },
  { k: "dim", t: "type help." },
  { k: "dim", t: "" },
];
const PROMPT = "guest@lucazani:~$ ";

export function Terminal({ win }: { win: Win }) {
  const [lines, setLines] = useState(BANNER);
  const [value, setValue] = useState("");
  const [ask, setAsk] = useState<Pending>(null);
  const history = useRef<string[]>([]);
  const cursor = useRef<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // focus the input when this is the top window
  const onTop = useOs((s) => {
    let top = null as Win | null;
    for (const w of s.wins) if (!w.min && (!top || w.z > top.z)) top = w;
    return top?.id === win.id && !s.booting;
  });
  useEffect(() => {
    if (onTop) setTimeout(() => input.current?.focus({ preventScroll: true }), 0);
  }, [onTop]);

  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, ask]);

  const print = (more: Line[]) => setLines((l) => [...l, ...more].slice(-400));

  const submit = () => {
    const raw = value;
    setValue("");
    cursor.current = null;

    if (ask) {
      setAsk(null);
      print([{ k: "in", t: raw }, ...answer(ask, raw), { k: "dim", t: "" }]);
      return;
    }
    const echo: Line = { k: "in", t: PROMPT + raw };
    if (!raw.trim()) return print([echo]);

    const res = run(raw, {
      history: history.current,
      clearHistory: () => (history.current = []),
    });
    if (res.close) return closeWindow(win.id);

    history.current = [...history.current, raw.trim()].slice(-80);
    if (res.clear) setLines([]);
    else print([echo, ...res.lines, { k: "dim", t: "" }]);
    if (res.ask) setAsk(res.ask);
  };

  const onKey = (e: KeyboardEvent) => {
    const list = history.current;
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp" && list.length) {
      e.preventDefault();
      cursor.current = cursor.current === null ? list.length - 1 : Math.max(0, cursor.current - 1);
      setValue(list[cursor.current]);
    } else if (e.key === "ArrowDown" && cursor.current !== null) {
      e.preventDefault();
      cursor.current++;
      if (cursor.current >= list.length) cursor.current = null;
      setValue(cursor.current === null ? "" : list[cursor.current]);
    }
  };

  return (
    <div class="term" ref={box} onClick={() => input.current?.focus()}>
      {lines.map((l, i) => (
        <div key={i} class={l.k}>
          {l.t || " "}
        </div>
      ))}
      <label class="prompt">
        {ask ? (
          <span>continue? [y/N]&nbsp;</span>
        ) : (
          <span>
            guest@lucazani:<b>~</b>$&nbsp;
          </span>
        )}
        <input
          ref={input}
          value={value}
          onInput={(e) => setValue(e.currentTarget.value)}
          onKeyDown={onKey}
          spellcheck={false}
          autocomplete="off"
          autocapitalize="off"
          aria-label="terminal input"
        />
      </label>
    </div>
  );
}
