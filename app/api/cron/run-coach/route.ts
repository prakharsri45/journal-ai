import { runCoachAgent } from "@/lib/agent/coach";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Auth: Vercel adds this header on cron requests
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get all users — for personal app this is fine. For scale, you'd batch this.
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  for (const user of users.users) {
    try {
      const result = await runCoachAgent(user.id);
      results.push({ userId: user.id, ...result });
    } catch (err) {
      results.push({
        userId: user.id,
        error: err instanceof Error ? err.message : "Unknown",
      });
    }
  }

  return NextResponse.json({ ranAt: new Date().toISOString(), results });
}