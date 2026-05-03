import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatsView from "./StatsView";

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: entries } = await supabase
    .from("entries")
    .select("id, content, created_at, mood")
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Stats</h1>
        <Link href="/journal" className="text-sm text-gray-600 hover:underline">
          ← Back to journal
        </Link>
      </header>

      <StatsView entries={entries ?? []} />
      
    </div>
  );
}