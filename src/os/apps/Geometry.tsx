import { useEffect, useRef, useState } from "preact/hooks";

type Solid = { verts: number[][]; faces: number[][] };

// prettier-ignore
const SOLIDS: Record<string, Solid> = {
  cube: {
    verts: [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ],
    faces: [[4, 5, 6, 7], [1, 0, 3, 2], [5, 1, 2, 6], [0, 4, 7, 3], [3, 7, 6, 2], [0, 1, 5, 4]],
  },
  tetrahedron: {
    verts: [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]],
    faces: [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]],
  },
  octahedron: {
    verts: [[1.3, 0, 0], [-1.3, 0, 0], [0, 1.3, 0], [0, -1.3, 0], [0, 0, 1.3], [0, 0, -1.3]],
    faces: [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]],
  },
  pyramid: {
    verts: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [0, 1.2, 0]],
    faces: [[0, 1, 2, 3], [3, 2, 4], [2, 1, 4], [1, 0, 4], [0, 3, 4]],
  },
  prism: {
    verts: [[-1, -1, -1], [1, -1, -1], [0, 1, -1], [-1, -1, 1], [1, -1, 1], [0, 1, 1]],
    faces: [[3, 4, 5], [2, 1, 0], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]],
  },
};

const PALETTE = [
  "#f0bf4c",
  "#7ad0e8",
  "#e87a9c",
  "#9ce87a",
  "#b07ae8",
  "#e8a67a",
  "#7ae8c0",
  "#d8d8d8",
];
const paletteFor = (name: string) => SOLIDS[name].faces.map((_, i) => PALETTE[i % PALETTE.length]);

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

const VERT = `attribute vec3 p; attribute vec3 c; uniform mat4 m; varying vec3 vc;
void main() { vc = c; gl_Position = m * vec4(p, 1.0); }`;
const FRAG = `precision mediump float; varying vec3 vc;
void main() { gl_FragColor = vec4(vc, 1.0); }`;

export function Geometry() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [solid, setSolid] = useState("cube");
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(true);
  const [bg, setBg] = useState("#080808");
  const [colors, setColors] = useState(() => paletteFor("cube"));
  const [perFace, setPerFace] = useState(true);

  const live = useRef({ solid, speed, running, bg, colors });
  live.current = { solid, speed, running, bg, colors };
  const view = useRef({ yaw: 0.6, pitch: 0.35, zoom: 1, held: false });

  const pick = (name: string) => {
    setSolid(name);
    setColors(perFace ? paletteFor(name) : SOLIDS[name].faces.map(() => colors[0]));
  };

  useEffect(() => {
    const el = canvas.current!;
    const gl = el.getContext("webgl");
    if (!gl) return;

    const prog = gl.createProgram()!;
    for (const [type, src] of [
      [gl.VERTEX_SHADER, VERT],
      [gl.FRAGMENT_SHADER, FRAG],
    ] as const) {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      gl.attachShader(prog, sh);
    }
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.enable(gl.DEPTH_TEST);

    const posBuf = gl.createBuffer();
    const colBuf = gl.createBuffer();
    const pLoc = gl.getAttribLocation(prog, "p");
    const cLoc = gl.getAttribLocation(prog, "c");
    const mLoc = gl.getUniformLocation(prog, "m");
    gl.enableVertexAttribArray(pLoc);
    gl.enableVertexAttribArray(cLoc);

    let count = 0;
    let built = "";
    const build = () => {
      const { solid, colors } = live.current;
      const s = SOLIDS[solid];
      const pos: number[] = [];
      const col: number[] = [];
      s.faces.forEach((f, fi) => {
        const shade = 0.72 + 0.28 * ((fi % 4) / 3);
        const [r, g, b] = rgb(colors[fi] ?? PALETTE[0]);
        for (let i = 1; i < f.length - 1; i++) {
          for (const v of [f[0], f[i], f[i + 1]]) {
            pos.push(...s.verts[v]);
            col.push(r * shade, g * shade, b * shade);
          }
        }
      });
      count = pos.length / 3;
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(col), gl.STATIC_DRAW);
      built = solid + colors.join();
    };

    let raf = 0;
    let t = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const l = live.current;
      const v = view.current;
      if (l.running && !v.held) t += ((now - last) / 1000) * l.speed;
      last = now;
      if (built !== l.solid + l.colors.join()) build();

      const w = el.clientWidth || 300;
      const h = el.clientHeight || 300;
      el.width = w;
      el.height = h;
      gl.viewport(0, 0, w, h);
      const [br, bgc, bb] = rgb(l.bg);
      gl.clearColor(br, bgc, bb, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const a = t * 0.8 + v.yaw;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const cb = Math.cos(v.pitch);
      const sb = Math.sin(v.pitch);
      const k = 0.42 * v.zoom;
      const asp = h / w;
      // yaw then pitch, scaled, x squashed by the aspect ratio
      // prettier-ignore
      gl.uniformMatrix4fv(mLoc, false, [
        ca * k * asp, sa * sb * k, -sa * cb * k, 0,
        0, cb * k, sb * k, 0,
        sa * k * asp, -ca * sb * k, ca * cb * k, 0,
        0, 0, 0, 1,
      ]);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.vertexAttribPointer(pLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
      gl.vertexAttribPointer(cLoc, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, count);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // has to be non-passive or preventDefault does nothing
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      view.current.zoom = Math.max(0.3, Math.min(3, view.current.zoom * Math.exp(-dy * 0.0015)));
    };
    el.addEventListener("wheel", wheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("wheel", wheel);
    };
  }, []);

  const orbit = (e: PointerEvent) => {
    const el = e.currentTarget as HTMLCanvasElement;
    el.setPointerCapture(e.pointerId);
    const v = view.current;
    v.held = true;
    let px = e.clientX;
    let py = e.clientY;
    const k = (2 * Math.PI) / Math.max(200, el.clientWidth);
    const move = (ev: PointerEvent) => {
      v.yaw -= (ev.clientX - px) * k;
      v.pitch = Math.max(-1.45, Math.min(1.45, v.pitch - (ev.clientY - py) * k));
      px = ev.clientX;
      py = ev.clientY;
    };
    const up = () => {
      v.held = false;
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };

  return (
    <div class="geometry">
      <canvas
        ref={canvas}
        title="drag to rotate · wheel to zoom · double click to reset"
        onPointerDown={orbit}
        onDblClick={() => (view.current = { yaw: 0.6, pitch: 0.35, zoom: 1, held: false })}
      />
      <div class="controls">
        <div>
          {Object.keys(SOLIDS).map((name) => (
            <button key={name} class={name === solid ? "btn on" : "btn"} onClick={() => pick(name)}>
              {name}
            </button>
          ))}
        </div>
        <div>
          <button class="btn" onClick={() => setRunning(!running)}>
            {running ? "stop" : "resume"}
          </button>
          <label>
            speed
            <input
              type="range"
              min={0}
              max={4}
              step={0.05}
              value={speed}
              onInput={(e) => setSpeed(Number(e.currentTarget.value))}
            />
            <small>{speed.toFixed(2)}x</small>
          </label>
        </div>
        <div>
          <label>
            background{" "}
            <input type="color" value={bg} onInput={(e) => setBg(e.currentTarget.value)} />
          </label>
          <label>
            object
            <input
              type="color"
              value={colors[0]}
              onInput={(e) => setColors(SOLIDS[solid].faces.map(() => e.currentTarget.value))}
            />
          </label>
          <button class="btn" onClick={() => setPerFace(!perFace)}>
            {perFace ? "hide faces" : "per-face colours"}
          </button>
        </div>
        {perFace && (
          <div>
            {SOLIDS[solid].faces.map((_, i) => (
              <label key={i}>
                {i + 1}
                <input
                  type="color"
                  value={colors[i] ?? PALETTE[0]}
                  onInput={(e) => {
                    const next = [...colors];
                    next[i] = e.currentTarget.value;
                    setColors(next);
                  }}
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
