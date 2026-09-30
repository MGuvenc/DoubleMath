"use client";

import { useEffect } from "react";

export default function BlogViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `blog-view:${slug}`;

    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "pending");
    } catch {
      return;
    }

    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).then((response) => {
      if (!response.ok) window.sessionStorage.removeItem(key);
    }).catch(() => {
      window.sessionStorage.removeItem(key);
    });
  }, [slug]);

  return null;
}