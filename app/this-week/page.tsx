import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import WeeklySummary from "./WeeklySummary";

export default async function ThisWeekPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">This Week</h1>
        <Link
          href="/journal"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to journal
        </Link>
      </header>

      <WeeklySummary />
    </div>
  );
}