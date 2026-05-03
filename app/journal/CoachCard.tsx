"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Insight = {
  id: string;
  type: string;
  message: string;
  created_at: string;
};

const TYPE_META = {
  observation: { emoji: "👀", label: "Pattern noticed", color: "blue" },
  question: { emoji: "💭", label: "Something to reflect on", color: "purple" },
  celebration: { emoji: "🎉", label: "Worth celebrating", color: "green" },
  gentle_nudge: { emoji: "🌱", label: "Gentle nudge", color: "amber" },
};

export default function CoachCard({ insight }: { insight: Insight }) {
  const router = useRouter();
  const supabase = createClient();
  const meta = TYPE_META[insight.type as keyof typeof TYPE_META] ?? TYPE_META.observation;

  async function dismiss() {
    await supabase
      .from("coach_insights")
      .update({ is_dismissed: true, is_read: true })
      .eq("id", insight.id);
    router.refresh();
  }

  return (
    <div className={`p-4 border-l-4 border-${meta.color}-500 bg-${meta.color}-50 dark:bg-${meta.color}-950/30 rounded-r-lg`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <p className={`text-xs uppercase tracking-wide text-${meta.color}-700 dark:text-${meta.color}-400 mb-1`}>
            {meta.emoji} {meta.label}
          </p>
          <p className="text-sm whitespace-pre-wrap">{insight.message}</p>
        </div>
        <button
          onClick={dismiss}
          className="text-xs text-gray-500 hover:text-gray-700"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}