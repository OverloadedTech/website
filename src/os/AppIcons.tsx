/** Real vector icons for the desktop apps. Line art only, currentColor,
 *  so every theme keeps working without extra assets. */

type Props = { name: string; className?: string };

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function AppGlyph({ name, className }: Props) {
  return (
    <span className={className ? `app-glyph ${className}` : "app-glyph"} aria-hidden>
      <Svg>{shape(name)}</Svg>
    </span>
  );
}

function shape(name: string) {
  switch (name) {
    case "terminal":
      return (
        <>
          <rect x="2.5" y="4" width="19" height="16" rx="2" {...S} />
          <path d="M6.5 9.5 9.5 12l-3 2.5M12.5 15h5" {...S} />
        </>
      );
    case "kiosk":
      return (
        <>
          <rect x="2.5" y="4" width="19" height="13" rx="2" {...S} />
          <path d="M2.5 8h19M8 20.5h8M12 17v3.5" {...S} />
          <path d="M6 11.5h6M6 14h9" {...S} opacity="0.65" />
        </>
      );
    case "browser":
      return (
        <>
          <circle cx="12" cy="12" r="9" {...S} />
          <ellipse cx="12" cy="12" rx="4" ry="9" {...S} />
          <path d="M3.3 9h17.4M3.3 15h17.4" {...S} />
        </>
      );
    case "editor":
      return (
        <>
          <path d="M6 3h8l4 4v14H6z" {...S} />
          <path d="M14 3v4h4" {...S} />
          <path d="M9 12h6M9 15.5h6M9 8.5h2" {...S} />
        </>
      );
    case "doom":
      return (
        <>
          <path d="M12 3.5c-4 0-7 2.7-7 6.6 0 2.3.9 3.6.9 5.6 0 1.7 1.2 3 2.6 3 1 0 1.6-.6 1.9-1.4l.6-1.6h2l.6 1.6c.3.8.9 1.4 1.9 1.4 1.4 0 2.6-1.3 2.6-3 0-2 .9-3.3.9-5.6 0-3.9-3-6.6-7-6.6Z" {...S} />
          <path d="M9 10.2 10.8 11 9 11.9M15 10.2 13.2 11l1.8.9" {...S} />
        </>
      );
    case "taskmgr":
      return (
        <>
          <rect x="2.5" y="4" width="19" height="16" rx="2" {...S} />
          <path d="M6 16l3-4 2.5 2.5L14 10l4 6" {...S} />
          <path d="M2.5 8h19" {...S} opacity="0.65" />
        </>
      );
    case "paint":
      return (
        <>
          <path d="M12 3.5c-4.7 0-8.5 3.5-8.5 7.8 0 4.3 3.4 6.2 6 6.2 1.4 0 2-.7 2-1.5 0-.9-.9-1.2-.9-2.2 0-.8.7-1.5 1.7-1.5h2.2c3 0 5.5-2 5.5-4.6 0-2.5-3-4.2-8-4.2Z" {...S} />
          <circle cx="8" cy="10" r="1.05" fill="currentColor" />
          <circle cx="12" cy="8" r="1.05" fill="currentColor" />
          <circle cx="16" cy="10.5" r="1.05" fill="currentColor" />
        </>
      );
    case "cube3d":
      return (
        <>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" {...S} />
          <path d="M4 7.5 12 12l8-4.5M12 12v9" {...S} />
        </>
      );
    case "manual":
      return (
        <>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" {...S} />
          <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 0 4 20.5Z" {...S} />
          <path d="M8 7.5h7M8 11h5" {...S} opacity="0.7" />
        </>
      );
    case "file":
    default:
      return (
        <>
          <path d="M6.5 3h7l4.5 4.5V21h-11.5z" {...S} />
          <path d="M13.5 3v4.5H18" {...S} />
          <path d="M9 13h6M9 16.5h4" {...S} opacity="0.7" />
        </>
      );
  }
}
