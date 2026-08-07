import { useCallback, useEffect, useRef, useState } from "react";
import { setState } from "./store";

type Tool =
  | "pencil"
  | "brush"
  | "eraser"
  | "line"
  | "rect"
  | "ellipse"
  | "fill"
  | "spray"
  | "text"
  | "picker";

const TOOLS: { id: Tool; label: string; hint: string }[] = [
  { id: "pencil", label: "pencil", hint: "hard 1px-style freehand line" },
  { id: "brush", label: "brush", hint: "soft round freehand stroke" },
  { id: "eraser", label: "eraser", hint: "paint back to white" },
  { id: "line", label: "line", hint: "drag a straight line" },
  { id: "rect", label: "rect", hint: "drag a rectangle" },
  { id: "ellipse", label: "oval", hint: "drag an ellipse" },
  { id: "fill", label: "fill", hint: "flood fill an area with the colour" },
  { id: "spray", label: "spray", hint: "airbrush speckle" },
  { id: "text", label: "text", hint: "click to drop a text box, drag it around, then place it" },
  { id: "picker", label: "pick", hint: "eyedropper: take a colour off the canvas" },
];

const SWATCHES = [
  "#000000", "#3a3a3a", "#7a7a7a", "#cccccc", "#ffffff",
  "#e8c87a", "#d0783c", "#c0392b", "#8e2f6f", "#5b4bd6",
  "#2f7fd0", "#2fb3b3", "#3fae5a", "#9bd04a", "#f2e14c",
];

const W = 960;
const H = 640;
const MAX_HISTORY = 40;

export function PaintApp() {
  const base = useRef<HTMLCanvasElement | null>(null);
  const over = useRef<HTMLCanvasElement | null>(null);
  const wrap = useRef<HTMLDivElement | null>(null);
  const fileIn = useRef<HTMLInputElement | null>(null);

  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#e8c87a");
  const [size, setSize] = useState(6);
  const [opacity, setOpacity] = useState(1);
  const [filled, setFilled] = useState(false);
  const [fontSize, setFontSize] = useState(28);
  const [status, setStatus] = useState("0, 0");
  // floating, draggable text box: lives above the canvas until you place it
  const [draft, setDraft] = useState<{ x: number; y: number; value: string } | null>(null);
  const [scale, setScale] = useState(1);

  const undo = useRef<ImageData[]>([]);
  const redo = useRef<ImageData[]>([]);
  const [depth, setDepth] = useState({ u: 0, r: 0 });

  const live = useRef({ tool, color, size, opacity, filled, fontSize });
  live.current = { tool, color, size, opacity, filled, fontSize };

  const ctx = () => base.current?.getContext("2d", { willReadFrequently: true }) ?? null;

  const snapshot = useCallback(() => {
    const c = ctx();
    if (!c) return;
    undo.current.push(c.getImageData(0, 0, W, H));
    if (undo.current.length > MAX_HISTORY) undo.current.shift();
    redo.current = [];
    setDepth({ u: undo.current.length, r: 0 });
  }, []);

  // white page on first mount
  useEffect(() => {
    const c = ctx();
    if (!c) return;
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, W, H);
  }, []);

  const doUndo = () => {
    const c = ctx();
    const prev = undo.current.pop();
    if (!c || !prev) return;
    redo.current.push(c.getImageData(0, 0, W, H));
    c.putImageData(prev, 0, 0);
    setDepth({ u: undo.current.length, r: redo.current.length });
  };

  const doRedo = () => {
    const c = ctx();
    const next = redo.current.pop();
    if (!c || !next) return;
    undo.current.push(c.getImageData(0, 0, W, H));
    c.putImageData(next, 0, 0);
    setDepth({ u: undo.current.length, r: redo.current.length });
  };

  const clear = () => {
    const c = ctx();
    if (!c) return;
    snapshot();
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, W, H);
  };

  /* ---------- import / export ---------- */

  const loadFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const c = ctx();
        if (c) {
          snapshot();
          c.fillStyle = "#ffffff";
          c.fillRect(0, 0, W, H);
          const k = Math.min(W / img.width, H / img.height);
          const w = img.width * k;
          const h = img.height * k;
          c.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    [snapshot],
  );

  const setAsDesktop = () => {
    const src = base.current;
    if (!src) return;
    setState({ wallpaper: src.toDataURL("image/png") });
    setStatus("set as desktop (clears on reload)");
  };

  const exportAs = (type: "image/png" | "image/jpeg") => {
    const src = base.current;
    if (!src) return;
    let url: string;
    if (type === "image/jpeg") {
      const flat = document.createElement("canvas");
      flat.width = W;
      flat.height = H;
      const fc = flat.getContext("2d")!;
      fc.fillStyle = "#ffffff";
      fc.fillRect(0, 0, W, H);
      fc.drawImage(src, 0, 0);
      url = flat.toDataURL(type, 0.92);
    } else {
      url = src.toDataURL(type);
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `paint-${Date.now()}.${type === "image/png" ? "png" : "jpg"}`;
    a.click();
  };

  // paste an image straight from the clipboard
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      const f = item?.getAsFile();
      if (f) {
        e.preventDefault();
        loadFile(f);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadFile]);

  // keep the floating text box aligned with the (responsively scaled) canvas
  useEffect(() => {
    const el = base.current;
    if (!el) return;
    const measure = () => setScale(el.getBoundingClientRect().width / W || 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const font = (px: number) => `${px}px ui-monospace, "SFMono-Regular", Menlo, monospace`;

  const commitDraft = () => {
    const c = ctx();
    if (!c || !draft) return;
    if (draft.value.trim()) {
      const l = live.current;
      snapshot();
      c.globalAlpha = l.opacity;
      c.fillStyle = l.color;
      c.font = font(l.fontSize);
      c.textBaseline = "top";
      draft.value.split("\n").forEach((line, i) => {
        c.fillText(line, draft.x, draft.y + i * l.fontSize * 1.2);
      });
      c.globalAlpha = 1;
    }
    setDraft(null);
  };

  const dragDraft = (e: React.PointerEvent) => {
    if (!draft) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const ox = draft.x;
    const oy = draft.y;
    const move = (ev: PointerEvent) => {
      const s = scale || 1;
      setDraft((d) =>
        d ? { ...d, x: ox + (ev.clientX - startX) / s, y: oy + (ev.clientY - startY) / s } : d,
      );
    };
    const up = (ev: PointerEvent) => {
      el.releasePointerCapture?.(ev.pointerId);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /* ---------- drawing ---------- */


  const pos = (e: PointerEvent | React.PointerEvent) => {
    const el = base.current!;
    const r = el.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H,
    };
  };

  const stroke = (c: CanvasRenderingContext2D, t: Tool) => {
    const l = live.current;
    c.globalAlpha = l.opacity;
    c.lineWidth = l.size;
    c.lineCap = t === "pencil" ? "butt" : "round";
    c.lineJoin = "round";
    c.strokeStyle = t === "eraser" ? "#ffffff" : l.color;
    c.fillStyle = t === "eraser" ? "#ffffff" : l.color;
  };

  const floodFill = (c: CanvasRenderingContext2D, sx: number, sy: number, hex: string) => {
    const img = c.getImageData(0, 0, W, H);
    const d = img.data;
    const idx = (x: number, y: number) => (y * W + x) * 4;
    const x0 = Math.floor(sx);
    const y0 = Math.floor(sy);
    if (x0 < 0 || y0 < 0 || x0 >= W || y0 >= H) return;
    const start = idx(x0, y0);
    const target = [d[start]!, d[start + 1]!, d[start + 2]!, d[start + 3]!];
    const rgb = [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
      255,
    ];
    if (target.every((v, i) => v === rgb[i])) return;
    const tol = 32;
    const match = (i: number) =>
      Math.abs(d[i]! - target[0]!) <= tol &&
      Math.abs(d[i + 1]! - target[1]!) <= tol &&
      Math.abs(d[i + 2]! - target[2]!) <= tol &&
      Math.abs(d[i + 3]! - target[3]!) <= tol;
    const stack = [[x0, y0] as [number, number]];
    while (stack.length) {
      const [x, y] = stack.pop()!;
      let yy = y;
      while (yy >= 0 && match(idx(x, yy))) yy--;
      yy++;
      let left = false;
      let right = false;
      for (; yy < H && match(idx(x, yy)); yy++) {
        const i = idx(x, yy);
        d[i] = rgb[0]!;
        d[i + 1] = rgb[1]!;
        d[i + 2] = rgb[2]!;
        d[i + 3] = 255;
        if (x > 0) {
          const m = match(idx(x - 1, yy));
          if (m && !left) stack.push([x - 1, yy]);
          left = m;
        }
        if (x < W - 1) {
          const m = match(idx(x + 1, yy));
          if (m && !right) stack.push([x + 1, yy]);
          right = m;
        }
      }
    }
    c.putImageData(img, 0, 0);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ctx();
    const oc = over.current?.getContext("2d");
    if (!c || !oc) return;
    e.preventDefault();
    const l = live.current;
    const p = pos(e);

    if (l.tool === "picker") {
      const d = c.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
      const hex = `#${[d[0]!, d[1]!, d[2]!]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")}`;
      setColor(hex);
      return;
    }

    if (l.tool === "fill") {
      snapshot();
      floodFill(c, p.x, p.y, l.color);
      return;
    }

    if (l.tool === "text") {
      if (draft) commitDraft();
      else setDraft({ x: p.x, y: p.y, value: "" });
      return;
    }


    snapshot();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const startP = p;
    let last = p;
    const shapeTool = l.tool === "line" || l.tool === "rect" || l.tool === "ellipse";

    const drawShape = (target: CanvasRenderingContext2D, to: { x: number; y: number }) => {
      stroke(target, l.tool);
      target.beginPath();
      if (l.tool === "line") {
        target.moveTo(startP.x, startP.y);
        target.lineTo(to.x, to.y);
        target.stroke();
      } else if (l.tool === "rect") {
        const x = Math.min(startP.x, to.x);
        const y = Math.min(startP.y, to.y);
        const w = Math.abs(to.x - startP.x);
        const h = Math.abs(to.y - startP.y);
        target.rect(x, y, w, h);
        l.filled ? target.fill() : target.stroke();
      } else {
        const cx = (startP.x + to.x) / 2;
        const cy = (startP.y + to.y) / 2;
        target.ellipse(cx, cy, Math.abs(to.x - startP.x) / 2, Math.abs(to.y - startP.y) / 2, 0, 0, Math.PI * 2);
        l.filled ? target.fill() : target.stroke();
      }
      target.globalAlpha = 1;
    };

    const freehand = (to: { x: number; y: number }) => {
      if (l.tool === "spray") {
        stroke(c, l.tool);
        for (let i = 0; i < 24; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * l.size * 1.6;
          c.fillRect(to.x + Math.cos(a) * r, to.y + Math.sin(a) * r, 1, 1);
        }
        c.globalAlpha = 1;
        return;
      }
      stroke(c, l.tool);
      if (l.tool === "brush") c.shadowBlur = 0;
      c.beginPath();
      c.moveTo(last.x, last.y);
      c.lineTo(to.x, to.y);
      c.stroke();
      c.globalAlpha = 1;
      last = to;
    };

    if (!shapeTool) freehand(p);

    const move = (ev: PointerEvent) => {
      const to = pos(ev);
      setStatus(`${Math.round(to.x)}, ${Math.round(to.y)}`);
      if (shapeTool) {
        oc.clearRect(0, 0, W, H);
        drawShape(oc, to);
      } else {
        freehand(to);
      }
    };
    const up = (ev: PointerEvent) => {
      const to = pos(ev);
      if (shapeTool) {
        oc.clearRect(0, 0, W, H);
        drawShape(c, to);
      }
      el.releasePointerCapture?.(e.pointerId);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return (
    <div className="paint">
      <div className="paint-bar">
        <div className="paint-tools">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              className="mini-btn paint-tool"
              title={t.hint}
              {...(tool === t.id ? { "data-active": "" } : {})}
              onClick={() => setTool(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="paint-sep" />
        <label>
          colour
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
        <label>
          size
          <input
            type="range"
            min={1}
            max={64}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
          <span className="geo-val">{size}px</span>
        </label>
        <label>
          alpha
          <input
            type="range"
            min={5}
            max={100}
            value={Math.round(opacity * 100)}
            onChange={(e) => setOpacity(Number(e.target.value) / 100)}
          />
          <span className="geo-val">{Math.round(opacity * 100)}%</span>
        </label>
        {(tool === "rect" || tool === "ellipse") && (
          <button
            className="mini-btn"
            {...(filled ? { "data-active": "" } : {})}
            onClick={() => setFilled((f) => !f)}
          >
            {filled ? "filled" : "outline"}
          </button>
        )}
        {tool === "text" && (
          <label>
            pt
            <input
              type="range"
              min={10}
              max={96}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
            <span className="geo-val">{fontSize}</span>
          </label>
        )}
      </div>

      <div className="paint-bar">
        <div className="paint-swatches">
          {SWATCHES.map((s) => (
            <button
              key={s}
              className="swatch"
              style={{ background: s }}
              title={s}
              onClick={() => setColor(s)}
            />
          ))}
        </div>
        <div className="paint-sep" />
        <button className="mini-btn" disabled={!depth.u} onClick={doUndo}>
          undo
        </button>
        <button className="mini-btn" disabled={!depth.r} onClick={doRedo}>
          redo
        </button>
        <button className="mini-btn" onClick={clear}>
          clear
        </button>
        <div className="paint-sep" />
        <button className="mini-btn" onClick={() => fileIn.current?.click()}>
          import
        </button>
        <button className="mini-btn" onClick={() => exportAs("image/png")}>
          export png
        </button>
        <button className="mini-btn" onClick={() => exportAs("image/jpeg")}>
          export jpg
        </button>
        <button className="mini-btn" onClick={setAsDesktop} title="hang this drawing on the desktop until the page reloads">
          set as desktop
        </button>
        <input
          ref={fileIn}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) loadFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <div
        className="paint-stage"
        ref={wrap}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f && f.type.startsWith("image/")) loadFile(f);
        }}
      >
        <div className="paint-canvas-wrap">
          <canvas ref={base} width={W} height={H} onPointerDown={onPointerDown} />
          <canvas ref={over} width={W} height={H} className="paint-overlay" />
          {draft && (
            <div
              className="paint-text-draft"
              style={{
                left: draft.x * scale,
                top: draft.y * scale,
                ["--pt-size" as string]: `${fontSize * scale}px`,
              }}
            >
              <div className="paint-text-grip" onPointerDown={dragDraft} title="drag to move">
                move
              </div>
              <textarea
                autoFocus
                rows={1}
                value={draft.value}
                placeholder="type…"
                style={{ color, opacity, fontSize: fontSize * scale }}
                onChange={(e) => setDraft((d) => (d ? { ...d, value: e.target.value } : d))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    commitDraft();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setDraft(null);
                  }
                }}
              />
              <button className="mini-btn" onClick={commitDraft}>
                place
              </button>
              <button className="mini-btn" onClick={() => setDraft(null)}>
                drop
              </button>
            </div>
          )}
        </div>

      </div>

      <div className="paint-status">
        <span>{tool}</span>
        <span>
          {W}×{H}
        </span>
        <span>{status}</span>
        <span className="dim">hover a tool for what it does · drop or paste an image to import</span>
      </div>
    </div>
  );
}
