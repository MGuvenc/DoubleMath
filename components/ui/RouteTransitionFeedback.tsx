"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MathLoadingIndicator } from "./MathSubmitButton";

export default function RouteTransitionFeedback() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearTimers() {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
      showTimer.current = null;
      fallbackTimer.current = null;
    }

    function startTransition() {
      clearTimers();
      showTimer.current = setTimeout(() => setVisible(true), 140);
      fallbackTimer.current = setTimeout(() => setVisible(false), 12000);
    }

    function handleClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;

      startTransition();
    }

    function handlePopState() {
      startTransition();
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      clearTimers();
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    showTimer.current = null;
    fallbackTimer.current = null;
    setVisible(false);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="route-transition-layer" role="status" aria-live="polite">
      <MathLoadingIndicator label="" className="route-transition-indicator" />
    </div>
  );
}