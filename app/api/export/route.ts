import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: entries } = await supabase
    .from("entries")
    .select("content, created_at, mood, tags")
    .order("created_at", { ascending: true });

  if (!entries) {
    return NextResponse.json({ error: "No entries" }, { status: 404 });
  }

  const moodEmoji = ["😞", "😕", "😐", "🙂", "😄"];

  const markdown = entries
    .map((e) => {
      const date = new Date(e.created_at).toLocaleString();
      const mood = e.mood ? ` ${moodEmoji[e.mood - 1]}` : "";
      const tags = e.tags?.length ? `\n*Tags: ${e.tags.map((t: string) => `#${t}`).join(", ")}*` : "";
      return `## ${date}${mood}\n${tags}\n\n${e.content}\n`;
    })
    .join("\n---\n\n");

  const today = new Date().toISOString().split("T")[0];

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": `attachment; filename="journal-${today}.md"`,
    },
  });
}