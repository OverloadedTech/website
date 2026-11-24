import { useEffect, useRef, useState } from "preact/hooks";
import { set } from "../state";

type Tool =
  "pencil" | "brush" | "eraser" | "line" | "rect" | "oval" | "fill" | "spray" | "text" | "pick";
type Pt = { x: number; y: number };

const TOOLS: [Tool, string][] = [
  ["pencil", "hard freehand line"],
  ["brush", "soft round freehand stroke"],
  ["eraser", "paint back to white"],
  ["line", "drag a straight line"],
  ["rect", "drag a rectangle"],
  ["oval", "drag an ellipse"],
  ["fill", "flood fill an area with the colour"],
  ["spray", "airbrush speckle"],
  ["text", "click to drop a text box, drag it around, then place it"],
  ["pick", "eyedropper: take a colour off the canvas"],
];

// prettier-ignore
const SWATCHES = [
  "#000000", "#3a3a3a", "#7a7a7a", "#cccccc", "#ffffff",
  "#f0bf4c", "#d0783c", "#c0392b", "#8e2f6f", "#5b4bd6",
  "#2f7fd0", "#2fb3b3", "#3fae5a", "#9bd04a", "#f2e14c",
];

const W = 960;
const H = 640;
const FONT = 'ui-monospace, "Cascadia Mono", Menlo, monospace';

// scanline fill, some tolerance for antialiased edges
function floodFill(ctx: CanvasRenderingContext2D, sx: number, sy: number, hex: string) {
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  if (x0 < 0 || y0 < 0 || x0 >= W || y0 >= H) return;
  const at = (x: number, y: number) => (y * W + x) * 4;
  const s = at(x0, y0);
  const from = [d[s], d[s + 1], d[s + 2], d[s + 3]];
  const to = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).concat(255);
  if (from.every((v, i) => v === to[i])) return;
  const same = (i: number) => from.every((v, k) => Math.abs(d[i + k] - v) <= 32);

  const stack: [number, number][] = [[x0, y0]];
  while (stack.length) {
    const [x, start] = stack.pop()!;
    let y = start;
    while (y >= 0 && same(at(x, y))) y--;
    let left = false;
    let right = false;
    for (y++; y < H && same(at(x, y)); y++) {
      d.set(to, at(x, y));
      if (x > 0) {
        const m = same(at(x - 1, y));
        if (m && !left) stack.push([x - 1, y]);
        left = m;
      }
      if (x < W - 1) {
        const m = same(at(x + 1, y));
        if (m && !right) stack.push([x + 1, y]);
        right = m;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function Paint() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#f0bf4c");
  const [size, setSize] = useState(6);
  const [alpha, setAlpha] = useState(100);
  const [filled, setFilled] = useState(false);
  const [fontSize, setFontSize] = useState(28);
  const [status, setStatus] = useState("0, 0");
  const [draft, setDraft] = useState<{ x: number; y: number; text: string } | null>(null);
  const [scale, setScale] = useState(1);
  const undo = useRef<ImageData[]>([]);
  const redo = useRef<ImageData[]>([]);
  const [, bump] = useState(0);

  const opts = useRef({ tool, color, size, alpha, filled, fontSize });
  opts.current = { tool, color, size, alpha, filled, fontSize };

  const ctx = () => canvas.current!.getContext("2d", { willReadFrequently: true })!;

  const snapshot = () => {
    undo.current = [...undo.current.slice(-39), ctx().getImageData(0, 0, W, H)];
    redo.current = [];
    bump((n) => n + 1);
  };

  const step = (from: typeof undo, into: typeof undo) => {
    const img = from.current.pop();
    if (!img) return;
    into.current.push(ctx().getImageData(0, 0, W, H));
    ctx().putImageData(img, 0, 0);
    bump((n) => n + 1);
  };

  const wipe = () => {
    ctx().fillStyle = "#fff";
    ctx().fillRect(0, 0, W, H);
  };

  const load = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      snapshot();
      wipe();
      const k = Math.min(W / img.width, H / img.height);
      ctx().drawImage(
        img,
        (W - img.width * k) / 2,
        (H - img.height * k) / 2,
        img.width * k,
        img.height * k,
      );
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  useEffect(() => {
    wipe();
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.items ?? [])]
        .find((i) => i.type.startsWith("image/"))
        ?.getAsFile();
      if (file) {
        e.preventDefault();
        load(file);
      }
    };
    addEventListener("paste", onPaste);
    const el = canvas.current!;
    const ro = new ResizeObserver(() => setScale(el.getBoundingClientRect().width / W || 1));
    ro.observe(el);
    return () => {
      removeEventListener("paste", onPaste);
      ro.disconnect();
    };
  }, []);

  const exportAs = (type: "png" | "jpeg") => {
    let src = canvas.current!;
    if (type === "jpeg") {
      // jpg has no transparency, flatten onto white first
      const flat = document.createElement("canvas");
      flat.width = W;
      flat.height = H;
      const f = flat.getContext("2d")!;
      f.fillStyle = "#fff";
      f.fillRect(0, 0, W, H);
      f.drawImage(src, 0, 0);
      src = flat;
    }
    const a = document.createElement("a");
    a.href = src.toDataURL(`image/${type}`, 0.92);
    a.download = `paint-${Date.now()}.${type === "png" ? "png" : "jpg"}`;
    a.click();
  };

  const placeText = () => {
    if (!draft) return;
    if (draft.text.trim()) {
      const o = opts.current;
      const c = ctx();
      snapshot();
      c.globalAlpha = o.alpha / 100;
      c.fillStyle = o.color;
      c.font = `${o.fontSize}px ${FONT}`;
      c.textBaseline = "top";
      draft.text
        .split("\n")
        .forEach((line, i) => c.fillText(line, draft.x, draft.y + i * o.fontSize * 1.2));
      c.globalAlpha = 1;
    }
    setDraft(null);
  };

  const moveDraft = (e: PointerEvent) => {
    if (!draft) return;
    e.preventDefault();
    const { x, y } = draft;
    const sx = e.clientX;
    const sy = e.clientY;
    const move = (ev: PointerEvent) =>
      setDraft(
        (d) => d && { ...d, x: x + (ev.clientX - sx) / scale, y: y + (ev.clientY - sy) / scale },
      );
    const up = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
  };

  const at = (e: PointerEvent): Pt => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const down = (e: PointerEvent) => {
    const o = opts.current;
    const c = ctx();
    const p = at(e);
    e.preventDefault();

    if (o.tool === "pick") {
      const [r, g, b] = c.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
      setColor("#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join(""));
      return;
    }
    if (o.tool === "fill") {
      snapshot();
      floodFill(c, p.x, p.y, o.color);
      return;
    }
    if (o.tool === "text") {
      if (draft) placeText();
      else setDraft({ ...p, text: "" });
      return;
    }

    snapshot();
    const pc = preview.current!.getContext("2d")!;
    const shape = o.tool === "line" || o.tool === "rect" || o.tool === "oval";
    const ink = o.tool === "eraser" ? "#fff" : o.color;
    const pen = (g: CanvasRenderingContext2D) => {
      g.globalAlpha = o.alpha / 100;
      g.lineWidth = o.size;
      g.lineCap = o.tool === "pencil" ? "butt" : "round";
      g.lineJoin = "round";
      g.strokeStyle = g.fillStyle = ink;
    };

    const drawShape = (g: CanvasRenderingContext2D, to: Pt) => {
      pen(g);
      g.beginPath();
      if (o.tool === "line") {
        g.moveTo(p.x, p.y);
        g.lineTo(to.x, to.y);
      } else if (o.tool === "rect") {
        g.rect(
          Math.min(p.x, to.x),
          Math.min(p.y, to.y),
          Math.abs(to.x - p.x),
          Math.abs(to.y - p.y),
        );
      } else {
        g.ellipse(
          (p.x + to.x) / 2,
          (p.y + to.y) / 2,
          Math.abs(to.x - p.x) / 2,
          Math.abs(to.y - p.y) / 2,
          0,
          0,
          Math.PI * 2,
        );
      }
      if (o.filled && o.tool !== "line") g.fill();
      else g.stroke();
      g.globalAlpha = 1;
    };

    let last = p;
    const freehand = (to: Pt) => {
      pen(c);
      if (o.tool === "spray") {
        for (let i = 0; i < 24; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * o.size * 1.6;
          c.fillRect(to.x + Math.cos(a) * r, to.y + Math.sin(a) * r, 1, 1);
        }
      } else {
        c.beginPath();
        c.moveTo(last.x, last.y);
        c.lineTo(to.x, to.y);
        c.stroke();
      }
      c.globalAlpha = 1;
      last = to;
    };

    if (!shape) freehand(p);

    const move = (ev: PointerEvent) => {
      const to = at(ev);
      setStatus(`${Math.round(to.x)}, ${Math.round(to.y)}`);
      if (!shape) return freehand(to);
      pc.clearRect(0, 0, W, H);
      drawShape(pc, to);
    };
    const up = (ev: PointerEvent) => {
      if (shape) {
        pc.clearRect(0, 0, W, H);
        drawShape(c, at(ev));
      }
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
      removeEventListener("pointercancel", up);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
    addEventListener("pointercancel", up);
  };

  const range = (
    label: string,
    value: number,
    min: number,
    max: number,
    onSet: (n: number) => void,
    unit = "",
  ) => (
    <label>
      {label}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onInput={(e) => onSet(Number(e.currentTarget.value))}
      />
      <small>
        {value}
        {unit}
      </small>
    </label>
  );

  return (
    <div class="paint">
      <div class="row">
        {TOOLS.map(([t, hint]) => (
          <button
            key={t}
            class={tool === t ? "btn on" : "btn"}
            title={hint}
            onClick={() => setTool(t)}
          >
            {t}
          </button>
        ))}
        <label>
          colour
          <input type="color" value={color} onInput={(e) => setColor(e.currentTarget.value)} />
        </label>
        {range("size", size, 1, 64, setSize, "px")}
        {range("alpha", alpha, 5, 100, setAlpha, "%")}
        {(tool === "rect" || tool === "oval") && (
          <button class={filled ? "btn on" : "btn"} onClick={() => setFilled(!filled)}>
            {filled ? "filled" : "outline"}
          </button>
        )}
        {tool === "text" && range("pt", fontSize, 10, 96, setFontSize)}
      </div>

      <div class="row">
        <span class="swatches">
          {SWATCHES.map((s) => (
            <button key={s} style={{ background: s }} title={s} onClick={() => setColor(s)} />
          ))}
        </span>
        <button class="btn" disabled={!undo.current.length} onClick={() => step(undo, redo)}>
          undo
        </button>
        <button class="btn" disabled={!redo.current.length} onClick={() => step(redo, undo)}>
          redo
        </button>
        <button class="btn" onClick={() => (snapshot(), wipe())}>
          clear
        </button>
        <button class="btn" onClick={() => picker.current!.click()}>
          import
        </button>
        <button class="btn" onClick={() => exportAs("png")}>
          export png
        </button>
        <button class="btn" onClick={() => exportAs("jpeg")}>
          export jpg
        </button>
        <button
          class="btn"
          title="hang this drawing on the desktop until the page reloads"
          onClick={() => {
            set({ wallpaper: canvas.current!.toDataURL("image/png") });
            setStatus("set as desktop (clears on reload)");
          }}
        >
          set as desktop
        </button>
        <input
          ref={picker}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            if (f) load(f);
            e.currentTarget.value = "";
          }}
        />
      </div>

      <div
        class="stage"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer?.files[0];
          if (f?.type.startsWith("image/")) load(f);
        }}
      >
        <div class="sheet">
          <canvas ref={canvas} width={W} height={H} onPointerDown={down} />
          <canvas ref={preview} width={W} height={H} class="preview" />
          {draft && (
            <div class="draft" style={{ left: draft.x * scale, top: draft.y * scale }}>
              <span class="grip" onPointerDown={moveDraft} title="drag to move">
                move
              </span>
              <textarea
                autoFocus
                rows={1}
                value={draft.text}
                placeholder="type..."
                style={{ color, opacity: alpha / 100, fontSize: fontSize * scale }}
                onInput={(e) => setDraft({ ...draft, text: e.currentTarget.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    placeText();
                  }
                  if (e.key === "Escape") setDraft(null);
                }}
              />
              <button class="btn" onClick={placeText}>
                place
              </button>
              <button class="btn" onClick={() => setDraft(null)}>
                drop
              </button>
            </div>
          )}
        </div>
      </div>

      <div class="status">
        <span>{tool}</span>
        <span>
          {W}×{H}
        </span>
        <span>{status}</span>
        <span class="small">hover a tool for what it does · drop or paste an image to import</span>
      </div>
    </div>
  );
}
