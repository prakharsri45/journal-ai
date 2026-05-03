"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function WeeklySummary() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function generateSummary() {
    setLoading(true);
    setError("");
    setSummary("");

    const res = await fetch("/api/summary");
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
    } else {
      setSummary(data.summary || "");
      setEntryCount(data.entryCount);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {!summary && !loading && (
        <div className="text-center py-12 space-y-4">
          <p className="text-gray-600">
            Generate an AI reflection on your past 7 days of entries.
          </p>
          <button
            onClick={generateSummary}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            ✨ Generate Weekly Summary
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-600 animate-pulse">
            Reading your week...
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {entryCount === 0 && (
        <div className="text-center py-12 text-gray-600">
          No entries from the past 7 days yet. Write a few and come back!
        </div>
      )}

      {summary && (
        <article className="prose prose-sm max-w-none p-6 bg-gray-50 border rounded-lg">
          <p className="text-xs text-gray-500 mb-4">
            Based on {entryCount} {entryCount === 1 ? "entry" : "entries"} from the last 7 days
          </p>
          <ReactMarkdown>{summary}</ReactMarkdown>
          <button
            onClick={generateSummary}
            className="mt-4 text-sm text-gray-600 hover:underline"
          >
            Regenerate
          </button>
        </article>
      )}
    </div>
  );
}