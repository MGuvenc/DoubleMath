"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/require-admin";

function makeSlug(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function finishWithError(message: string): never {
  redirect(`/admin/blog?error=${encodeURIComponent(message)}`);
}

export async function saveBlogPost(formData: FormData) {
  const guard = await requireAdmin();
  if (!guard.ok) finishWithError(guard.error);

  const supabase = createClient();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const slug = makeSlug(String(formData.get("slug") || title)).slice(0, 160);
  const excerpt = String(formData.get("excerpt") || "").trim() || null;
  const coverImageUrl = String(formData.get("cover_image_url") || "").trim() || null;
  const contentHtml = String(formData.get("content_html") || "").trim();
  const status = formData.get("status") === "published" ? "published" : "draft";

  if (!title || !slug || !contentHtml) finishWithError("Başlık ve içerik zorunludur.");

  let publishedAt: string | null = null;
  if (status === "published") {
    publishedAt = new Date().toISOString();
    if (id) {
      const { data: existing } = await supabase
        .from("blog_posts")
        .select("published_at")
        .eq("id", id)
        .maybeSingle<{ published_at: string | null }>();
      publishedAt = existing?.published_at || publishedAt;
    }
  }

  const post = {
    slug,
    title,
    excerpt,
    cover_image_url: coverImageUrl,
    content_html: contentHtml,
    status,
    published_at: publishedAt,
    seo_title: String(formData.get("seo_title") || "").trim() || null,
    seo_description: String(formData.get("seo_description") || "").trim() || null,
  };

  const { error } = id
    ? await supabase.from("blog_posts").update(post).eq("id", id)
    : await supabase.from("blog_posts").insert({ ...post, author_id: guard.userId });

  if (error) finishWithError(error.code === "23505" ? "Bu yazı adresi zaten kullanılıyor." : "Yazı kaydedilemedi.");

  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/blog");
  redirect("/admin/blog?saved=1");
}

export async function deleteBlogPost(formData: FormData) {
  const guard = await requireAdmin();
  if (!guard.ok) finishWithError(guard.error);

  const id = String(formData.get("id") || "");
  if (!id) finishWithError("Silinecek yazı bulunamadı.");

  const supabase = createClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) finishWithError("Yazı silinemedi.");

  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  redirect("/admin/blog?saved=1");
}