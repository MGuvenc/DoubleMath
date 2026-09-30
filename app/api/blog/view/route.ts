import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let slug: unknown;
  try {
    ({ slug } = await request.json());
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "Geçersiz yazı adresi." }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("increment_blog_post_views", { post_slug: slug });
  if (error) return NextResponse.json({ error: "Görüntülenme kaydedilemedi." }, { status: 500 });

  return new Response(null, { status: 204 });
}