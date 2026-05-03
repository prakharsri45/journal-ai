"use client";

import { useState, useMemo } from "react";
import EntryCard from "./EntryCard";

type Entry = {
  id: string;
  content: string;
  created_at: string;
  mood?: number | null;
  tags?: string[];
};

export default function EntriesList({ entries }: { entries: Entry[] }) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d">("all");
  
  const [tagFilter, setTagFilter] = useState<string>("");

  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
    }, [entries]);

  const filtered = useMemo(() => {
    let result = entries;

    if (dateFilter !== "all") {
      const days = dateFilter === "7d" ? 7 : 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter((e) => new Date(e.created_at) >= cutoff);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.content.toLowerCase().includes(q));
    }

    // In your filter chain:
    if (tagFilter) {
    result = result.filter((e) => e.tags?.includes(tagFilter));
    }

    return result;
  }, [entries, search, dateFilter]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Search entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-2 border rounded-lg text-sm"
        />
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
          className="p-2 border rounded-lg text-sm"
        >
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
        {allTags.length > 0 && (
            <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="p-2 border rounded-lg text-sm"
            >
                <option value="">All tags</option>
                {allTags.map((t) => (
                <option key={t} value={t}>#{t}</option>
                ))}
            </select>
            )}
      </div>

      <p className="text-xs text-gray-500">
        Showing {filtered.length} of {entries.length} entries
      </p>

      <div className="space-y-4">
        {filtered.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-center py-8">No entries match your filters.</p>
        )}
      </div>
    </section>
  );
}