import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function Layout({ children, back = false }: { children: ReactNode; back?: boolean }) {
  return (
    <div className="page">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter back={back} />
    </div>
  );
}
