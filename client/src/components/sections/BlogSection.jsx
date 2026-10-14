import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { blogPosts } from "../../data/blog";
import api from "../../services/api";
import Button from "../Button";
import SectionTitle from "../SectionTitle";

function BlogSection() {
  const [visiblePosts, setVisiblePosts] = useState(blogPosts);

  useEffect(() => {
    const controller = new AbortController();
    api.get("/blog", { params: { limit: 100 }, signal: controller.signal })
      .then(({ data }) => {
        const published = data.data?.data || [];
        if (published.length) {
          setVisiblePosts(published.map((post) => ({
            ...post,
            id: post.slug || post._id,
            image: post.coverImage,
            date: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "",
          })));
        }
      })
      .catch((error) => {
        if (error.name !== "CanceledError") {
          console.error("Unable to load published blog posts.", error);
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="bg-slate-50 py-24 dark:bg-slate-900/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Digital Knowledge"
          title="Learn, explore and grow with technology."
          description="AMADE shares practical guidance on technology, programming, AI, digital business, and career development."
        />

        <div className="mt-14 grid gap-7 md:grid-cols-3">
          {visiblePosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                <span className="absolute left-5 top-5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-slate-950">
                  {post.category}
                </span>
              </div>

              <div className="p-7">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{post.date}</p>
                <h3 className="mt-3 text-xl font-bold leading-8 text-slate-950 dark:text-white">{post.title}</h3>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{post.excerpt}</p>

                <Link to={`/blog/${post.id}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400">
                  Read More
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-10">
          <Button to="/blog">Explore Blog</Button>
        </div>
      </div>
    </section>
  );
}

export default BlogSection;