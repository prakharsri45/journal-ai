import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, answerFromEntries } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Embed the user's question
    const queryEmbedding = await generateEmbedding(question);

    // 2. Find the most similar entries
    const { data: matches, error } = await supabase.rpc("match_entries", {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: 5,
      user_id_filter: user.id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        answer:
          "I couldn't find any entries that match your question. Try rephrasing, or write more entries on this topic first.",
        sources: [],
      });
    }

    // 3. Send entries + question to Gemini for a grounded answer
    const answer = await answerFromEntries(question, matches);

    return NextResponse.json({ answer, sources: matches });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}