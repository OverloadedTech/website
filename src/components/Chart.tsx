type Bar = { label: string; value: number; note?: string };

export function Bars({
  data,
  unit = "",
  caption,
}: {
  data: Bar[];
  unit?: string;
  caption?: string;
}) {
  const max = Math.max(...data.map((d) => d.value)) || 1;
  return (
    <figure>
      <svg viewBox={`0 0 100 ${data.length * 14 + 2}`} width="100%" role="img" aria-label={caption}>
        {data.map((d, i) => (
          <g key={d.label} transform={`translate(0 ${i * 14 + 2})`}>
            <text x="0" y="5" fontSize="4" fill="var(--muted)">
              {d.label}
            </text>
            <rect x="0" y="7" width="100" height="4" fill="var(--border-soft)" />
            <rect x="0" y="7" width={(d.value / max) * 100} height="4" fill="var(--accent)" />
            <text x="100" y="5" fontSize="4" fill="var(--fg)" textAnchor="end">
              {d.value}
              {unit}
            </text>
          </g>
        ))}
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function Sparkline({
  points,
  labels,
  caption,
}: {
  points: number[];
  labels?: string[];
  caption?: string;
}) {
  const max = Math.max(...points) || 1;
  const step = 100 / Math.max(points.length - 1, 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(2)} ${(30 - (p / max) * 28).toFixed(2)}`)
    .join(" ");
  return (
    <figure>
      <svg viewBox="0 0 100 34" width="100%" role="img" aria-label={caption}>
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="0.8" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={i * step}
            cy={30 - (p / max) * 28}
            r="0.9"
            fill="var(--accent-dim)"
          />
        ))}
        {labels?.map((l, i) => (
          <text
            key={l}
            x={i * step}
            y="33.5"
            fontSize="2.6"
            fill="var(--faint)"
            textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}
          >
            {l}
          </text>
        ))}
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
