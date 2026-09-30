"use client";

import { useFormStatus } from "react-dom";

interface MathSubmitButtonProps {
  children: React.ReactNode;
  pendingText: string;
  className: string;
  disabled?: boolean;
  loading?: boolean;
  type?: "submit" | "button";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  title?: string;
  "aria-label"?: string;
}

export function MathLoadingIndicator({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-live="polite">
      <span className="math-loader" aria-hidden="true">
        <span>x²</span><span>+</span><span>y²</span><span>=</span><span>?</span>
      </span>
      <span>{label}</span>
    </span>
  );
}

export default function MathSubmitButton({
  children,
  pendingText,
  className,
  disabled = false,
  loading = false,
  type = "submit",
  onClick,
  title,
  "aria-label": ariaLabel,
}: MathSubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const pending = loading || formPending;

  return (
    <button
      className={`${className} disabled:cursor-wait disabled:opacity-80`}
      type={type}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      disabled={pending || disabled}
      aria-busy={pending}
    >
      {pending ? <MathLoadingIndicator label={pendingText} /> : children}
    </button>
  );
}