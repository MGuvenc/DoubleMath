"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createQuestion(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const title = ((formData.get("title") as string) || "").trim();
  if (!title) return;

  const { error } = await supabase.from("questions").insert({
    student_id: user.id,
    title,
    status: "open",
  });

  if (!error) {
    revalidatePath("/student/questions");
  }
}
