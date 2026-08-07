import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { getPost } from "@/content/posts";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { slug: post.slug, title: post.title, summary: post.summary, dateLabel: post.dateLabel };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Post not found - Luca Zani" }, { name: "robots", content: "noindex" }],
      };
    }
    return {
      meta: [
        { title: `${loaderData.title} - Luca Zani` },
        { name: "description", content: loaderData.summary },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.summary },
        { property: "og:type", content: "article" },
      ],
    };
  },
  notFoundComponent: PostNotFound,
  component: PostPage,
});

function PostNotFound() {
  return (
    <Layout back>
      <section>
        <h1>No such post</h1>
        <p>
          That one doesn&apos;t exist (anymore). <Link to="/blog">Back to the blog</Link>.
        </p>
      </section>
    </Layout>
  );
}

function PostPage() {
  const { slug } = Route.useLoaderData();
  const post = getPost(slug);
  if (!post) return <PostNotFound />;
  return (
    <Layout>
      <article>
        <span className="post-date">{post.dateLabel}</span>
        <h1>{post.title}</h1>
        {post.body()}
      </article>
      <p style={{ marginTop: 30 }}>
        <Link to="/blog" className="btn">
          ← all posts
        </Link>
      </p>
    </Layout>
  );
}
