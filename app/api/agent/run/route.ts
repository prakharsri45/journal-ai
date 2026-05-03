import { runCoachAgent } from "@/lib/agent/coach";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {

  // Block manual triggers in production — agent runs via cron only
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Manual agent trigger is disabled in production" },
      { status: 403 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
      
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runCoachAgent(user.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}