import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, generateTags } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { content, mood } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate the embedding before saving
    const [embedding, tags] = await Promise.all([
      generateEmbedding(content),
      generateTags(content),
    ]);
    const { data, error } = await supabase
      .from("entries")
      .insert({
        user_id: user.id,
        content,
        mood: mood ?? null,
        embedding,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entry: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}