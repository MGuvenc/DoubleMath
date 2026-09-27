import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { Instagram as InstagramIcon } from "lucide-react";
import type { InstagramPostRow } from "@/lib/supabase/query-types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Instagram",
  description: "Instagram sayfamızdan son paylaşımlar.",
};

export default async function InstagramPage() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("instagram_posts")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(24)
    .returns<InstagramPostRow[]>();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center">
          <InstagramIcon className="mx-auto h-10 w-10 text-brand-600" />
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Instagram</h1>
          <p className="mt-2 text-slate-600">Son paylaşımlarımızı buradan takip edebilirsin.</p>
        </div>

        {!posts?.length ? (
          <div className="card mx-auto mt-10 max-w-md text-center text-slate-500">
            Henüz gösterilecek bir gönderi yok.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {posts.map((post) => {
              const imageUrl =
                post.media_type === "VIDEO" ? post.thumbnail_url || post.media_url : post.media_url;
              if (!imageUrl) return null;
              return (
                <a
                  key={post.id}
                  href={post.permalink || "#"}
                  target="_blank"
                  className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={post.caption || "Instagram gönderisi"}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </a>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}