import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { BlogPostSummary } from "@/lib/supabase/query-types";
import BlogPostCard from "./BlogPostCard";

export default async function BlogSections() {
  const supabase = createClient();
  const [popularResult, latestResult] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_image_url, status, published_at, view_count")
      .eq("status", "published")
      .order("view_count", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(4)
      .returns<BlogPostSummary[]>(),
    supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_image_url, status, published_at, view_count")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(4)
      .returns<BlogPostSummary[]>(),
  ]);
  const popularPosts = popularResult.data || [];
  const latestPosts = latestResult.data || [];

  if (!popularPosts.length && !latestPosts.length) return null;

  const sections = [
    { title: "En Çok Okunanlar", posts: popularPosts, icon: TrendingUp },
    { title: "Son Yazılar", posts: latestPosts, icon: null },
  ];

  return (
    <section className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        {sections.map(({ title, posts, icon: Icon }) =>
          posts.length ? (
            <div key={title} className="mb-14 last:mb-0">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                  {Icon && <Icon className="h-5 w-5 text-emerald-700" />}
                  {title}
                </h2>
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900">
                  Tüm Yazıları Gör <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-x-8 sm:grid-cols-2">
                {posts.map((post) => <BlogPostCard key={post.id} post={post} />)}
              </div>
            </div>
          ) : null
        )}
      </div>
    </section>
  );
}