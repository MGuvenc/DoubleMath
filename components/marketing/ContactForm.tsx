"use client";

import { useState } from "react";
import MathSubmitButton from "@/components/ui/MathSubmitButton";

export default function ContactForm({ packageName = "" }: { packageName?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="card bg-green-50 text-center">
        <p className="font-medium text-green-800">
          Talebin bize ulaştı! En kısa sürede seninle iletişime geçeceğiz.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {packageName && (
        <p className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800">
          İlgilendiğin paket: <strong>{packageName}</strong>
        </p>
      )}
      <input type="hidden" name="package_name" value={packageName} />
      <div>
        <label className="label">Ad Soyad *</label>
        <input name="full_name" required className="input" />
      </div>
      <div>
        <label className="label">E-posta *</label>
        <input type="email" name="email" required className="input" />
      </div>
      <div>
        <label className="label">Telefon</label>
        <input name="phone" className="input" />
      </div>
      <div>
        <label className="label">Sınıf / Seviye</label>
        <input name="grade_level" placeholder="Örn: 9. Sınıf, YKS, LGS" className="input" />
      </div>
      <div>
        <label className="label">Mesajınız</label>
        <textarea name="message" rows={4} className="input" />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">Bir hata oluştu, lütfen tekrar deneyin.</p>
      )}

      <MathSubmitButton type="submit" loading={status === "loading"} pendingText="İletişim talebi gönderiliyor..." className="btn-primary w-full">
        Gönder
      </MathSubmitButton>
    </form>
  );
}
