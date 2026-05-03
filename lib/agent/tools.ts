import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmbedding } from "@/lib/gemini";

// Tool 1: Get recent entries for a user
export async function getRecentEntries(userId: string, days = 14) {
  const supabase = createAdminClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await supabase
    .from("entries")
    .select("id, content, created_at, mood, tags")
    .eq("user_id", userId)
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// Tool 2: Search semantically across all of user's entries
export async function searchSimilarEntries(
  userId: string,
  query: string,
  limit = 5
) {
  const supabase = createAdminClient();
  const embedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc("match_entries", {
    query_embedding: embedding,
    match_threshold: 0.4,
    match_count: limit,
    user_id_filter: userId,
  });

  if (error) throw error;
  return data ?? [];
}

// Tool 3: Save an insight to the database
export async function saveInsight(params: {
  userId: string;
  type: "observation" | "question" | "celebration" | "gentle_nudge";
  message: string;
  reasoning: string;
  relatedEntryIds: string[];
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("coach_insights")
    .insert({
      user_id: params.userId,
      type: params.type,
      message: params.message,
      reasoning: params.reasoning,
      related_entry_ids: params.relatedEntryIds,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Tool 4: Check when last insight was created (don't spam the user)
export async function getLastInsightDate(userId: string): Promise<Date | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("coach_insights")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? new Date(data.created_at) : null;
}

// Tool 5: Log that the agent ran (whether or not it created an insight)
export async function logAgentRun(params: {
  userId: string;
  status: string;
  reasoning: string;
  insightCreated: boolean;
}) {
  const supabase = createAdminClient();
  await supabase.from("coach_runs").insert({
    user_id: params.userId,
    status: params.status,
    reasoning: params.reasoning,
    insight_created: params.insightCreated,
  });
}