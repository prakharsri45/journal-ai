import { createClient } from "@/lib/supabase/server";
import { generateReflection } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    // Verify auth even though we don't need it for the AI call —
    // prevents random people from burning your free tier
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const question = await generateReflection(content);
    return NextResponse.json({ question });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}