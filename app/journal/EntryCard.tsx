"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Entry = {
  id: string;
  content: string;
  created_at: string;
  mood?: number | null;
  tags?: string[];
};

export default function EntryCard({ entry }: { entry: Entry }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(entry.content);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const moodEmoji = entry.mood
  ? ["😞", "😕", "😐", "🙂", "😄"][entry.mood - 1]
  : null;

  async function handleSave() {
    if (!content.trim() || content === entry.content) {
      setIsEditing(false);
      return;
    }
    setSaving(true);

    // Update via API so we can regenerate the embedding
    const res = await fetch(`/api/entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      setIsEditing(false);
      router.refresh();
    } else {
      alert("Failed to save");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this entry? This can't be undone.")) return;

    const { error } = await supabase.from("entries").delete().eq("id", entry.id);
    if (error) alert("Failed to delete: " + error.message);
    else router.refresh();
  }

  return (
    <div className="p-4 border rounded-lg group">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs text-gray-500">
          {new Date(entry.created_at).toLocaleString()}
          {moodEmoji && <span className="ml-2 text-base">{moodEmoji}</span>}
        </p>
        {!isEditing && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-gray-600 hover:text-black"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded min-h-[100px]"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 text-sm bg-black text-white rounded disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setContent(entry.content);
                setIsEditing(false);
              }}
              className="px-3 py-1 text-sm border rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{entry.content}</p>
      )}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
            {entry.tags.map((tag) => (
            <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-700"
            >
                #{tag}
            </span>
            ))}
        </div>
        )}
    </div>
  );
}