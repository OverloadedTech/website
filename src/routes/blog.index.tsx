import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { POSTS_SORTED } from "@/content/posts";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog - Luca Zani" },
      {
        name: "description",
        content:
          "Posts about BananaWiki, the duck, and whatever else I happen to be building. Irregular by design.",
      },
      { property: "og:title", content: "Blog - Luca Zani" },
      { property: "og:description", content: "Notes on what I build. Mostly Flask, sometimes ducks." },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <Layout back>
      <section>
        <h1>Blog</h1>
        <p>Things I felt like writing down.</p>
      </section>
      <section>
        {POSTS_SORTED.map((p) => (
          <div className="blog-post" key={p.slug}>
            <h2>
              <Link to="/blog/$slug" params={{ slug: p.slug }}>
                {p.title}
              </Link>
            </h2>
            <span className="post-date">{p.dateLabel}</span>
            <p>{p.summary}</p>
          </div>
        ))}
      </section>
    </Layout>
  );
}
