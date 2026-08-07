import { Link, useRouterState } from "@tanstack/react-router";
import { PAGES } from "@/lib/site";
import { requestTerminal } from "@/os/actions";
import { useOs } from "@/os/store";


// the duck reads better as an emoji than as three lines of mangled ASCII
const DUCK_MINI = "🦆";


export function SiteHeader() {
  // hide the escape button while a terminal is on screen; keep it when the
  // terminal is only minimized so it still works as a "restore" handle
  // (there is no taskbar on the normal site to bring it back).
  const termVisible = useOs((s) =>
    s.windows.some((w) => w.app === "terminal" && !w.minimized),
  );

  // router's own data-status was inconsistent (trailing slashes, "/" matching),
  // so the highlight is decided here from a normalized pathname instead
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const here = pathname.replace(/\/+$/, "") || "/";
  const isActive = (path: string) => {
    const p = path.replace(/\/+$/, "") || "/";
    return p === "/" ? here === "/" : here === p || here.startsWith(`${p}/`);
  };

  return (
    <header className="site">
      <nav className="site">
        <div className="nav-links">
          {PAGES.map((p) => (
            <Link
              key={p.path}
              to={p.path}
              data-active={isActive(p.path) ? "" : undefined}
              aria-current={isActive(p.path) ? "page" : undefined}
            >
              {p.name === "home" ? (
                <>
                  <span className="nav-long">{p.label}</span>
                  <span className="nav-short">home</span>
                </>
              ) : (
                p.label
              )}
            </Link>
          ))}
        </div>

        <div className="nav-side">
          <a
            className="nav-github"
            href="https://github.com/OverloadedTech"
            target="_blank"
            rel="noopener noreferrer"
            title="github"
            aria-label="github"
          >
            <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden>
              <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.34c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.19c0 .21.15.46.55.38A8 8 0 0 0 8 0Z" />
            </svg>
          </a>
          {!termVisible && (
          <button
            className="duck-btn"
            onClick={() => requestTerminal()}
            title="escape?"
            aria-label="open terminal"
          >
            <span className="duck-mini" role="img" aria-hidden>
              {DUCK_MINI}
            </span>

            <span className="say">escape?</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
