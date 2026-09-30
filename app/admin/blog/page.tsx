import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { BlogPostRow, BlogPostSummary } from "@/lib/supabase/query-types";
import BlogPostForm from "@/components/admin/BlogPostForm";
import { deleteBlogPost } from "./actions";

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: { edit?: string; error?: string; saved?: string };
}) {
  const supabase = createClient();
  const [{ data: posts }, { data: selectedPost }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_image_url, status, published_at, view_count")
      .order("updated_at", { ascending: false })
      .returns<BlogPostSummary[]>(),
    searchParams.edit
      ? supabase.from("blog_posts").select("*").eq("id", searchParams.edit).maybeSingle<BlogPostRow>()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900">Blog</h1>
        <p className="mt-1 text-sm text-slate-500">Yazı oluştur, düzenle ve yayına al.</p>
      </div>

      {searchParams.error && <p role="alert" className="mt-5 border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800">{searchParams.error}</p>}
      {searchParams.saved && <p role="status" className="mt-5 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Yazı kaydedildi.</p>}

      <section className="mt-7">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">{selectedPost ? "Yazıyı Düzenle" : "Yeni Yazı"}</h2>
        <BlogPostForm post={selectedPost || null} />
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
          <h2 className="text-lg font-semibold text-slate-900">Yazılar</h2>
          <span className="text-sm text-slate-500">{posts?.length || 0} kayıt</span>
        </div>
        {posts?.length ? (
          <div>
            {posts.map((post) => (
              <article key={post.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 py-4">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-slate-900">{post.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {post.status === "published" ? "Yayında" : "Taslak"} · {post.view_count.toLocaleString("tr-TR")} görüntülenme
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {post.status === "published" && <Link href={`/blog/${post.slug}`} target="_blank" className="text-sm font-medium text-slate-600 hover:text-brand-700">Görüntüle</Link>}
                  <Link href={`/admin/blog?edit=${post.id}`} className="text-sm font-semibold text-brand-700 hover:text-brand-900">Düzenle</Link>
                  <form action={deleteBlogPost}>
                    <input type="hidden" name="id" value={post.id} />
                    <button type="submit" className="text-sm font-medium text-rose-700 hover:text-rose-900">Sil</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-8 text-sm text-slate-500">Henüz blog yazısı yok.</p>
        )}
      </section>
    </div>
  );
}