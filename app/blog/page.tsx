import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { BlogPostSummary } from "@/lib/supabase/query-types";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import BlogPostCard from "@/components/marketing/BlogPostCard";

export const metadata: Metadata = {
  title: "Blog",
  description: "Matematik öğrenme ipuçları, sınav hazırlığı ve çalışma önerileri.",
};

export const revalidate = 60;

export default async function BlogPage() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_image_url, status, published_at, view_count")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .returns<BlogPostSummary[]>();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold text-emerald-700">DOUBLE MATEMATİK</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Blog</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Matematiği daha iyi öğrenmek ve sınavlara hazırlanmak için güncel yazılar.</p>
          </div>
          <Link href="/" className="text-sm font-semibold text-brand-700 hover:text-brand-900">Ana sayfaya dön</Link>
        </div>
        {posts?.length ? (
          <div className="grid gap-x-10 sm:grid-cols-2">
            {posts.map((post) => <BlogPostCard key={post.id} post={post} />)}
          </div>
        ) : (
          <p className="py-16 text-center text-slate-600">Henüz yayımlanmış yazı yok.</p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}