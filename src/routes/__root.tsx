import {
  Outlet,
  Link,
  createRootRoute,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import osCss from "../os/os.css?url";

import { OsRoot } from "../os/OsRoot";
import { SpinBox } from "../os/SpinBox";

function NotFoundComponent() {
  return (
    <div className="page notice">
      <h1>404</h1>
      <p>That page isn&apos;t here. It either never existed or I deleted it.</p>
      <p>
        <Link to="/" className="btn">
          ← back to homepage
        </Link>
      </p>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="page notice">
      <h1>this page broke</h1>
      <p>Something threw on the way in. Try again, or go back to the homepage.</p>
      <p>
        <button
          className="btn"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          try again
        </button>{" "}
        <a href="/" className="btn">
          ← homepage
        </a>
      </p>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Luca Zani" },
      {
        name: "description",
        content:
          "Personal site of Luca Zani: projects, blog, likes and contact. Mostly Python, Flask and hardware side projects.",
      },
      { name: "author", content: "Luca Zani" },
      { property: "og:title", content: "Luca Zani" },
      {
        property: "og:description",
        content: "Projects, blog and a duck that hands out terminals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "stylesheet", href: osCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <SpinBox className="spin-root">
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </SpinBox>
      <OsRoot />
    </>
  );
}
