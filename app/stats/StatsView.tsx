"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Entry = {
  id: string;
  content: string;
  created_at: string;
  mood: number | null;
};

function calcStreak(entries: Entry[]): { current: number; longest: number } {
  if (entries.length === 0) return { current: 0, longest: 0 };

  // Get unique dates entries were written on
  const dates = Array.from(
    new Set(
      entries.map((e) => new Date(e.created_at).toDateString())
    )
  )
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let current = 0;
  let longest = 0;
  let temp = 1;

  // Current streak: count back from today/yesterday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (
    dates[0].toDateString() === today.toDateString() ||
    dates[0].toDateString() === yesterday.toDateString()
  ) {
    current = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = (dates[i - 1].getTime() - dates[i].getTime()) / 86400000;
      if (Math.round(diff) === 1) current++;
      else break;
    }
  }

  // Longest streak overall
  for (let i = 1; i < dates.length; i++) {
    const diff = (dates[i - 1].getTime() - dates[i].getTime()) / 86400000;
    if (Math.round(diff) === 1) {
      temp++;
      longest = Math.max(longest, temp);
    } else {
      temp = 1;
    }
  }
  longest = Math.max(longest, temp, current);

  return { current, longest };
}

export default function StatsView({ entries }: { entries: Entry[] }) {
  const { current, longest } = calcStreak(entries);
  const totalWords = entries.reduce(
    (sum, e) => sum + e.content.split(/\s+/).length,
    0
  );

  // Mood data for chart (only entries with mood)
  const moodData = entries
    .filter((e) => e.mood !== null)
    .map((e) => ({
      date: new Date(e.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      mood: e.mood,
    }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Current streak" value={`${current}d`} />
        <StatCard label="Longest streak" value={`${longest}d`} />
        <StatCard label="Total entries" value={entries.length} />
        <StatCard label="Words written" value={totalWords.toLocaleString()} />
      </div>

      {moodData.length > 0 ? (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-4">Mood over time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={moodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={(v) => ["😞", "😕", "😐", "🙂", "😄"][v - 1]}
              />
              <Tooltip
               formatter={(value) => {
                  const labels = ["Rough", "Meh", "Okay", "Good", "Great"];
                  const num = typeof value === "number" ? value : Number(value);
                  return [labels[num - 1] ?? "—", "Mood"];
              }}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8 border rounded-lg">
          Track your mood on a few entries to see a chart here!
        </p>
      )}
      {/* Add this section */}
      <div className="border-t pt-6">
        <h2 className="font-semibold mb-2">Export your data</h2>
        <p className="text-sm text-gray-500 mb-3">
          Download all your entries as a markdown file. Your journal, fully portable.
        </p>
        
        <a  href="/api/export"
          download
          className="inline-block px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 text-sm"
        >
          📥 Export all entries
        </a>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}