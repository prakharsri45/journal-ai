import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import JournalEditor from "./JournalEditor";
import EntriesList from "./EntriesList";
import CoachCard from "./CoachCard";
import RunCoachButton from "./RunCoachButton";

export default async function JournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: entries } = await supabase
    .from("entries")
    .select("id, content, created_at, mood")
    .order("created_at", { ascending: false });

  const { data: insights } = await supabase
    .from("coach_insights")
    .select("id, type, message, created_at")
    .eq("is_dismissed", false)
    .order("created_at", { ascending: false })
    .limit(3);

  const { count: unreadCount } = await supabase
    .from("coach_insights")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false)
    .eq("is_dismissed", false);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Journal</h1>
        <div className="flex items-center gap-4 text-sm">
          {process.env.NODE_ENV === "development" && <RunCoachButton />}
          <Link href="/coach" className="text-purple-600 hover:underline relative">
            Coach 🤖
            {unreadCount && unreadCount > 0 ? (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs bg-purple-600 text-white rounded-full">
                {unreadCount}
              </span>
            ) : null}
          </Link>
          <Link href="/chat" className="text-blue-600 hover:underline">
            Chat 💬
          </Link>
          <Link href="/stats" className="text-blue-600 hover:underline">
            Stats 📊
          </Link>
          <Link href="/this-week" className="text-blue-600 hover:underline">
            This Week →
          </Link>
          <span className="text-gray-600">{user.email}</span>
        </div>
      </header>

      {insights && insights.length > 0 && (
        <section className="space-y-2">
          {insights.map((i) => <CoachCard key={i.id} insight={i} />)}
        </section>
      )}

      <JournalEditor />

      <EntriesList entries={entries ?? []} />
    </div>
  );
}