"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MaterialActionResult = { error: string } | { success: true };

export async function createMaterial(formData: FormData): Promise<MaterialActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın." };

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const topic = (formData.get("topic") as string) || null;
  const type = formData.get("type") as "pdf" | "video" | "link";
  const externalUrl = (formData.get("external_url") as string) || null;
  const file = formData.get("file") as File | null;

  if (!title || !type) return { error: "Başlık ve tür zorunludur." };
  if (type !== "pdf" && !externalUrl) return { error: "Video/link için bir URL girmelisin." };
  if (type === "pdf" && (!file || file.size === 0)) return { error: "PDF için bir dosya seçmelisin." };

    const { data: material, error: insertError } = await supabase
    .from("materials")
    .insert({
      title,
      description,
      type,
      topic,
      external_url: type === "pdf" ? null : externalUrl,
      created_by: user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !material) {
    console.error("Materyal oluşturulamadı:", insertError);
    return { error: `Materyal oluşturulamadı: ${insertError?.message || "bilinmeyen hata"}` };
  }
  
  if (type === "pdf" && file && file.size > 0) {
    const adminSupabase = createAdminClient();
    const path = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await adminSupabase.storage
      .from("materials")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("Dosya yüklenemedi:", uploadError);
      return { error: "Materyal oluşturuldu ama dosya yüklenemedi." };
    }
    await supabase.from("materials").update({ file_path: path }).eq("id", material.id);
  }

  revalidatePath("/admin/materials");
  revalidatePath("/student/materials");
  return { success: true };
}

export async function deleteMaterial(materialId: string): Promise<MaterialActionResult> {
  const supabase = createClient();

  const { data: material } = await supabase
    .from("materials")
    .select("file_path")
    .eq("id", materialId)
    .single<{ file_path: string | null }>();

  const { error } = await supabase.from("materials").delete().eq("id", materialId);

  if (error) {
    console.error("Materyal silinemedi:", error);
    return { error: "Materyal silinemedi. Yetkin olmayabilir." };
  }

  if (material?.file_path) {
    const adminSupabase = createAdminClient();
    await adminSupabase.storage.from("materials").remove([material.file_path]);
  }

  revalidatePath("/admin/materials");
  revalidatePath("/student/materials");
  return { success: true };
}