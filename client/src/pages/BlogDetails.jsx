import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { blogPosts } from "../data/blog";
import api from "../services/api";

function BlogDetails() {
  const { id } = useParams();
  const staticPost = useMemo(
    () => blogPosts.find((item) => String(item.id) === String(id)),
    [id],
  );
  const [remotePost, setRemotePost] = useState(null);

  useEffect(() => {
    if (staticPost) return undefined;

    const controller = new AbortController();
    api.get(`/blog/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(({ data }) => {
        const record = data.data;
        setRemotePost({
          id,
          post: {
            ...record,
            image: record.coverImage || "",
            date: record.publishedAt ? new Date(record.publishedAt).toLocaleDateString() : "",
            content: Array.isArray(record.content)
              ? record.content
              : record.content.split(/\n{2,}/).filter(Boolean),
          },
        });
      })
      .catch((error) => {
        if (error.name !== "CanceledError") {
          setRemotePost({ id, post: null });
          console.error("Unable to load blog post details.", error);
        }
      });
    return () => controller.abort();
  }, [id, staticPost]);
  const post = staticPost || (remotePost?.id === id ? remotePost.post : null);
  const isLoading = !staticPost && remotePost?.id !== id;

  if (isLoading) {
    return <section className="mx-auto max-w-4xl px-4 py-24 text-center text-slate-500">Loading article...</section>;
  }

  if (!post) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-500">404</p>
          <h1 className="mt-4 text-4xl font-black text-slate-950 dark:text-white">Blog post not found</h1>
          <p className="mt-4 text-slate-600 dark:text-slate-400">The article you requested is unavailable.</p>
          <Link to="/blog" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-3 font-bold text-slate-950">
            <ArrowLeft size={16} />
            Back to blog
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
          <ArrowLeft size={16} />
          Back to blog
        </Link>

        <article className="mt-8 overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <img src={post.image} alt={post.title} className="h-72 w-full object-cover sm:h-96" />
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-500">{post.category}</p>
            <h1 className="mt-3 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">{post.title}</h1>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{post.date}</p>
            <div className="mt-8 space-y-6 text-base leading-8 text-slate-600 dark:text-slate-400">
              {post.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default BlogDetails;
