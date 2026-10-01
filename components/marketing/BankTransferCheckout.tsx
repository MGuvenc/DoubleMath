"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Upload } from "lucide-react";
import { submitBankTransfer } from "@/app/checkout/[productId]/actions";
import MathSubmitButton from "@/components/ui/MathSubmitButton";

export default function BankTransferCheckout({
  productId,
  bankName,
  accountHolder,
  iban,
}: {
  productId: string;
  bankName: string;
  accountHolder: string;
  iban: string;
}) {
  const router = useRouter();
  const [isSubmitting, startSubmitting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startSubmitting(async () => {
      const result = await submitBankTransfer(productId, formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push("/student/packages?orderSubmitted=1");
      router.refresh();
    });
  }

  async function copyIban() {
    await navigator.clipboard.writeText(iban);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold text-slate-900">Havale/EFT bilgileri</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Banka</dt>
            <dd className="font-medium text-slate-900">{bankName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Hesap sahibi</dt>
            <dd className="font-medium text-slate-900">{accountHolder}</dd>
          </div>
          <div>
            <dt className="text-slate-500">IBAN</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <code className="break-all font-semibold text-slate-900">{iban.replace(/(.{4})/g, "$1 ").trim()}</code>
              <button
                type="button"
                onClick={copyIban}
                className="inline-flex min-h-9 items-center gap-1 rounded border border-slate-300 px-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                aria-label="IBAN bilgisini kopyala"
                title="IBAN'ı kopyala"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Kopyalandı" : "Kopyala"}
              </button>
            </dd>
          </div>
        </dl>
        <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
          Açıklama alanına adını ve paket adını yaz. Ödeme, dekont kontrolünden sonra hesabına tanımlanır.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label" htmlFor="receipt">Havale dekontu</label>
          <input
            id="receipt"
            name="receipt"
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            className="input file:mr-3 file:rounded file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
          />
          <p className="mt-1 text-xs text-slate-500">PDF veya görsel, en fazla 10 MB.</p>
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <MathSubmitButton
          type="submit"
          loading={isSubmitting}
          pendingText="Dekont yükleniyor..."
          className="btn-primary inline-flex w-full items-center justify-center gap-2"
        >
          <Upload className="h-4 w-4" /> Dekontu Gönder
        </MathSubmitButton>
      </form>
    </div>
  );
}