import { useOs } from "@/os/store";

export function SiteFooter({ back = false }: { back?: boolean }) {
  const year = new Date().getFullYear();
  const cycled = useOs((st) => st.cycled);

  return (
    <footer className="site">
      {back && (
        <p>
          <a href="/" className="btn">
            ← back to homepage
          </a>
        </p>
      )}
      <p>
        © {year} Luca Zani | Licensed under{" "}
        <a
          href="https://github.com/OverloadedTech/website/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
        >
          MIT
        </a>{" "}
        |{" "}
        <a
          href="https://github.com/OverloadedTech/website"
          target="_blank"
          rel="noopener noreferrer"
        >
          source
        </a>
      </p>
      {cycled && (
        <p className="creed">Roses are red, violets are blue, McAfee didn't kill himself, and neither should you.</p>
      )}
    </footer>
  );
}
