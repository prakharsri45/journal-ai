"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MOODS = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

export default function JournalEditor() {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [reflecting, setReflecting] = useState(false);
  const [reflection, setReflection] = useState("");
  const router = useRouter();

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);

    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, mood }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      alert("Error: " + error);
    } else {
      setContent("");
      setMood(null);
      setReflection("");
      router.refresh();
    }
    setSaving(false);
  }

  async function handleReflect() {
    if (!content.trim()) return;
    setReflecting(true);
    setReflection("");

    const res = await fetch("/api/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      alert("Error: " + error);
    } else {
      const { question } = await res.json();
      setReflection(question);
    }
    setReflecting(false);
  }

  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind today?"
        className="w-full h-48 p-4 border rounded-lg resize-none"
      />

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Mood:</span>
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMood(mood === m.value ? null : m.value)}
            className={`text-2xl p-1 rounded transition-transform hover:scale-125 ${
              mood === m.value ? "scale-125 bg-yellow-100" : "opacity-50"
            }`}
            title={m.label}
          >
            {m.emoji}
          </button>
        ))}
      </div>

      {reflection && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs uppercase tracking-wide text-blue-700 mb-1">
            A question for you
          </p>
          <p className="text-blue-900">{reflection}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !content.trim()}
          className="px-6 py-2 bg-black text-white rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Entry"}
        </button>
        <button
          onClick={handleReflect}
          disabled={reflecting || !content.trim()}
          className="px-6 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
        >
          {reflecting ? "Thinking..." : "💭 Reflect"}
        </button>
      </div>
    </div>
  );
}