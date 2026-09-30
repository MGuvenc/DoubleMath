"use client";

import { useEffect, useState } from "react";

export default function BlogCoverInput({ initialUrl }: { initialUrl: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState(initialUrl);
  const [previewUrl, setPreviewUrl] = useState(initialUrl);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(coverUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, coverUrl]);

  return (
    <div className="space-y-3">
      <label className="label" htmlFor="post-cover-file">Kapak görseli seç</label>
      <input
        className="input file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
        id="post-cover-file"
        name="cover_image_file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => setFile(event.currentTarget.files?.[0] || null)}
      />
      <p className="text-xs text-slate-500">JPG, PNG veya WebP. En fazla 5 MB.</p>
      <div>
        <label className="label" htmlFor="post-cover-url">veya görsel adresi</label>
        <input
          className="input"
          id="post-cover-url"
          name="cover_image_url"
          type="url"
          placeholder="https://..."
          value={coverUrl}
          onChange={(event) => setCoverUrl(event.currentTarget.value)}
        />
      </div>
      {previewUrl && (
        <div
          role="img"
          aria-label="Kapak görseli önizlemesi"
          className="aspect-[16/9] max-w-md bg-slate-100 bg-cover bg-center"
          style={{ backgroundImage: `url("${previewUrl}")` }}
        />
      )}
    </div>
  );
}