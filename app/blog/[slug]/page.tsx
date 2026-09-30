import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { BlogPostRow } from "@/lib/supabase/query-types";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import BlogViewTracker from "@/components/marketing/BlogViewTracker";

async function getPost(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<BlogPostRow>();
  return data;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: "Yazı bulunamadı" };

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || undefined,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
      type: "article",
      publishedTime: post.published_at || undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const publishedDate = post.published_at
    ? new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(post.published_at))
    : "";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <BlogViewTracker slug={post.slug} />
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Tüm yazılar
        </Link>
        <article className="mt-8">
          <header className="border-b border-slate-200 pb-8">
            <p className="text-sm font-medium text-emerald-700">{publishedDate}</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{post.title}</h1>
            {post.excerpt && <p className="mt-4 text-lg leading-7 text-slate-600">{post.excerpt}</p>}
            <p className="mt-5 inline-flex items-center gap-2 text-sm text-slate-500"><Eye className="h-4 w-4" /> {post.view_count.toLocaleString("tr-TR")} görüntülenme</p>
          </header>
          {post.cover_image_url && (
            <div
              role="img"
              aria-label={post.title}
              className="mt-8 aspect-[16/9] max-h-[32rem] bg-slate-100 bg-cover bg-center"
              style={{ backgroundImage: `url("${post.cover_image_url}")` }}
            />
          )}
          <div className="blog-content mt-8" dangerouslySetInnerHTML={{ __html: post.content_html }} />
        </article>
      </main>
      <SiteFooter />
    </>
  );
}