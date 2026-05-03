import { createClient } from "@/lib/supabase/server";
import { generateWeeklySummary } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pull the last 7 days of entries
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: entries, error } = await supabase
      .from("entries")
      .select("content, created_at")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({
        summary: null,
        entryCount: 0,
      });
    }

    const summary = await generateWeeklySummary(entries);

    return NextResponse.json({
      summary,
      entryCount: entries.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}