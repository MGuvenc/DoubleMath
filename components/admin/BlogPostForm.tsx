import type { BlogPostRow } from "@/lib/supabase/query-types";
import { saveBlogPost } from "@/app/admin/blog/actions";
import BlogContentEditor from "./BlogContentEditor";
import BlogCoverInput from "./BlogCoverInput";

export default function BlogPostForm({ post }: { post: BlogPostRow | null }) {
  return (
    <form action={saveBlogPost} className="space-y-5 border-b border-slate-200 pb-8">
      {post && <input type="hidden" name="id" value={post.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="post-title">Başlık</label>
          <input className="input" id="post-title" name="title" required defaultValue={post?.title || ""} />
        </div>
        <div>
          <label className="label" htmlFor="post-slug">Yazı adresi</label>
          <input className="input" id="post-slug" name="slug" placeholder="Boş bırakılırsa başlıktan oluşturulur" defaultValue={post?.slug || ""} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="post-excerpt">Kısa açıklama</label>
        <textarea className="input min-h-20" id="post-excerpt" name="excerpt" rows={3} defaultValue={post?.excerpt || ""} />
      </div>
      <div>
        <BlogCoverInput key={post?.id || "new-post"} initialUrl={post?.cover_image_url || ""} />
      </div>
      <div>
        <p className="label">Yazı içeriği</p>
        <BlogContentEditor key={post?.id || "new-post"} initialHtml={post?.content_html || "<p></p>"} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="post-status">Durum</label>
          <select className="input" id="post-status" name="status" defaultValue={post?.status || "draft"}>
            <option value="draft">Taslak</option>
            <option value="published">Yayımla</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="post-seo-title">SEO başlığı</label>
          <input className="input" id="post-seo-title" name="seo_title" defaultValue={post?.seo_title || ""} />
        </div>
        <div>
          <label className="label" htmlFor="post-seo-description">SEO açıklaması</label>
          <input className="input" id="post-seo-description" name="seo_description" defaultValue={post?.seo_description || ""} />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" type="submit">{post ? "Değişiklikleri Kaydet" : "Yazıyı Kaydet"}</button>
        {post && <a className="btn-secondary" href="/admin/blog">Yeni yazı</a>}
      </div>
    </form>
  );
}