"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startQuizAttempt } from "@/app/student/quizzes/actions";

export default function StartQuizButton({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStart() {
    startTransition(async () => {
      const result = await startQuizAttempt(quizId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-4">
      <button onClick={handleStart} disabled={isPending} className="btn-primary">
        {isPending ? "Başlatılıyor..." : "Sınava Başla"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}