"use client";

import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Bold, Heading2, ImagePlus, Italic, Link2, List, ListOrdered } from "lucide-react";

export default function BlogContentEditor({ initialHtml }: { initialHtml: string }) {
  const [contentHtml, setContentHtml] = useState(initialHtml);
  const editor = useEditor({
    extensions: [StarterKit, Image, Link.configure({ openOnClick: false })],
    content: initialHtml,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      setContentHtml(currentEditor.getHTML());
    },
  });

  function addLink() {
    const href = window.prompt("Bağlantı adresi");
    if (href) editor?.chain().focus().setLink({ href }).run();
  }

  function addImage() {
    const src = window.prompt("Görsel adresi");
    if (src) editor?.chain().focus().setImage({ src }).run();
  }

  const controls = [
    { label: "Kalın", icon: Bold, run: () => editor?.chain().focus().toggleBold().run() },
    { label: "İtalik", icon: Italic, run: () => editor?.chain().focus().toggleItalic().run() },
    { label: "Başlık", icon: Heading2, run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Madde işaretli liste", icon: List, run: () => editor?.chain().focus().toggleBulletList().run() },
    { label: "Numaralı liste", icon: ListOrdered, run: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: "Bağlantı ekle", icon: Link2, run: addLink },
    { label: "Görsel ekle", icon: ImagePlus, run: addImage },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
        {controls.map(({ label, icon: Icon, run }) => (
          <button key={label} type="button" title={label} aria-label={label} onClick={run} className="rounded p-2 text-slate-600 hover:bg-white hover:text-slate-900">
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <input type="hidden" name="content_html" value={contentHtml} readOnly />
      <EditorContent editor={editor} className="blog-editor min-h-72 px-4 py-3" />
    </div>
  );
}