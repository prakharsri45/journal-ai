import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CoachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: insights } = await supabase
    .from("coach_insights")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: runs } = await supabase
    .from("coach_runs")
    .select("*")
    .order("ran_at", { ascending: false })
    .limit(10);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🤖 Your Coach</h1>
        <Link href="/journal" className="text-sm hover:underline">← Back</Link>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent insights</h2>
        {insights?.length ? (
          insights.map((i) => (
            <div key={i.id} className="p-4 border rounded-lg space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{i.type}</span>
                <span>{new Date(i.created_at).toLocaleDateString()}</span>
              </div>
              <p>{i.message}</p>
              <details className="text-xs text-gray-600">
                <summary className="cursor-pointer">Why I said this</summary>
                <p className="mt-2 italic">{i.reasoning}</p>
              </details>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No insights yet. The coach runs daily.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Activity log</h2>
        <div className="space-y-1 text-sm">
          {runs?.map((r) => (
            <div key={r.id} className="p-2 border-b text-gray-600 dark:text-gray-400">
              <span className="font-mono text-xs">
                {new Date(r.ran_at).toLocaleString()}
              </span>{" "}
              — <span>{r.status}</span>
              {r.reasoning && <span className="text-xs italic"> · {r.reasoning}</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}