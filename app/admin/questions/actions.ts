"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateQuestionStatus(formData: FormData) {
  const supabase = createClient();
  const questionId = formData.get("question_id");
  const status = formData.get("status");

  if (typeof questionId !== "string" || !questionId) return;
  if (status !== "open" && status !== "answered" && status !== "closed") return;

  const { error } = await supabase
    .from("questions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", questionId);

  if (!error) {
    revalidatePath("/admin/questions");
  }
}
