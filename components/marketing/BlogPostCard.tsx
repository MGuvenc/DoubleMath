import Link from "next/link";
import type { BlogPostSummary } from "@/lib/supabase/query-types";

function formatDate(date: string | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default function BlogPostCard({ post }: { post: BlogPostSummary }) {
  return (
    <article className="group min-w-0 border-t border-slate-200 py-5">
      <Link href={`/blog/${post.slug}`} className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        {post.cover_image_url ? (
          <div
            aria-label={post.title}
            role="img"
            className="aspect-[16/10] overflow-hidden bg-slate-100 bg-cover bg-center sm:aspect-[4/3]"
            style={{ backgroundImage: `url("${post.cover_image_url}")` }}
          />
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center bg-emerald-50 text-3xl font-semibold text-emerald-800 sm:aspect-[4/3]">
            {post.title.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{formatDate(post.published_at)}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900 transition group-hover:text-brand-700">
            {post.title}
          </h3>
          {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{post.excerpt}</p>}
        </div>
      </Link>
    </article>
  );
}