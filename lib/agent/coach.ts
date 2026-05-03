import { GoogleGenerativeAI, SchemaType, type Tool } from "@google/generative-ai";
import {
  getRecentEntries,
  searchSimilarEntries,
  saveInsight,
  getLastInsightDate,
  logAgentRun,
} from "./tools";
import { emailInsightToUser } from "./email";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define tools the model can call
const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "search_similar_entries",
        description:
          "Search the user's full journal history for entries semantically similar to a query. Use this to find historical context for patterns you're seeing in recent entries.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: "Natural language description of what to look for",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "create_insight",
        description:
          "Save an insight to share with the user. ONLY call this if you have something genuinely valuable to say. Be conservative — silence is better than noise.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            type: {
              type: SchemaType.STRING,
              description:
                "observation (a pattern noticed), question (something to reflect on), celebration (a win to acknowledge), gentle_nudge (something deserving attention)",
            },
            message: {
              type: SchemaType.STRING,
              description:
                "The message to show the user. Warm, specific, 1-3 sentences. Reference their actual entries when relevant.",
            },
            reasoning: {
              type: SchemaType.STRING,
              description: "Why this insight is worth surfacing right now.",
            },
            related_entry_ids: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.STRING,
              },
              description: "IDs of entries this insight references",
            },
          },
          required: ["type", "message", "reasoning", "related_entry_ids"],
        },
      },
      {
        name: "skip_today",
        description:
          "Decide NOT to create an insight today. Use this if recent entries don't reveal anything worth surfacing, or if you've already shared something similar recently.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            reason: {
              type: SchemaType.STRING,
              description: "Brief explanation of why nothing to share",
            },
          },
          required: ["reason"],
        },
      },
    ],
  },
];

const SYSTEM_PROMPT = `You are a warm, perceptive journaling coach. You read someone's recent journal entries and decide whether to surface an insight, question, or gentle observation.

Your principles:
- BE CONSERVATIVE. Silence is better than noise. Only speak up when you have something genuinely valuable to say.
- Be specific, not generic. Reference actual moments from their entries. Never give horoscope-style platitudes.
- Be warm, not clinical. You're a thoughtful friend, not a therapist.
- Notice patterns the user might miss: recurring themes, mood shifts, unspoken tensions, neglected areas, small wins.
- Ask great questions instead of giving advice when possible.
- Don't repeat insights similar to recent ones. Variety matters.

Available tools:
- search_similar_entries: search history for context
- create_insight: surface something to the user
- skip_today: decide nothing's worth saying today

Process:
1. Read the recent entries provided
2. Optionally search history for context if you spot a potential pattern
3. Either create_insight (with a SPECIFIC, grounded message) or skip_today

Tone examples:
GOOD: "You mentioned poor sleep three times this week, and your mood scores have dipped each time. Worth paying attention to?"
BAD: "Remember to take care of yourself!"

GOOD: "It's been a while since you wrote about painting — last time was Oct 3, and you sounded so alive. What happened?"
BAD: "Don't forget your hobbies."`;

export async function runCoachAgent(userId: string) {
  // Don't run more than once per day
  const lastInsight = await getLastInsightDate(userId);
  if (lastInsight) {
    const hoursSince = (Date.now() - lastInsight.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 20) {
      await logAgentRun({
        userId,
        status: "skipped",
        reasoning: `Last insight was ${hoursSince.toFixed(1)}h ago`,
        insightCreated: false,
      });
      return { skipped: true, reason: "too soon since last insight" };
    }
  }

  const recentEntries = await getRecentEntries(userId, 14);

  if (recentEntries.length === 0) {
    await logAgentRun({
      userId,
      status: "skipped",
      reasoning: "No recent entries",
      insightCreated: false,
    });
    return { skipped: true, reason: "no recent entries" };
  }

  const formattedEntries = recentEntries
    .map((e) => {
      const mood = e.mood ? ` [mood: ${e.mood}/5]` : "";
      const tags = e.tags?.length ? ` [tags: ${e.tags.join(", ")}]` : "";
      const date = new Date(e.created_at).toLocaleDateString();
      return `Entry ${e.id} (${date})${mood}${tags}\n${e.content}`;
    })
    .join("\n\n---\n\n");

  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    tools,
    systemInstruction: SYSTEM_PROMPT,
  });

  const chat = model.startChat();
  let prompt = `Here are the user's last ${recentEntries.length} entries:\n\n${formattedEntries}\n\nReview them and decide what to do.`;

  // Reasoning loop — let the model call tools up to 5 times
  for (let step = 0; step < 5; step++) {
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const calls = response.functionCalls();

    if (!calls || calls.length === 0) {
      // No more tool calls — agent is done
      break;
    }

    const toolResults = [];

    for (const call of calls) {
      if (call.name === "search_similar_entries") {
        const args = call.args as { query: string };
        const matches = await searchSimilarEntries(userId, args.query);
        toolResults.push({
          functionResponse: {
            name: call.name,
            response: { entries: matches },
          },
        });
      } else if (call.name === "create_insight") {
        const args = call.args as {
          type: string;
          message: string;
          reasoning: string;
          related_entry_ids: string[];
        };

        const validType = ["observation", "question", "celebration", "gentle_nudge"]
          .includes(args.type) ? args.type : "observation";

        const insight = await saveInsight({
          userId,
          type: validType as "observation" | "question" | "celebration" | "gentle_nudge",
          message: args.message,
          reasoning: args.reasoning,
          relatedEntryIds: args.related_entry_ids,
        });

        await emailInsightToUser(userId, { type: validType, message: args.message });

        await logAgentRun({
          userId,
          status: "insight_created",
          reasoning: args.reasoning,
          insightCreated: true,
        });

        return { skipped: false, insight };
      } else if (call.name === "skip_today") {
        const args = call.args as { reason: string };
        await logAgentRun({
          userId,
          status: "skipped_by_agent",
          reasoning: args.reason,
          insightCreated: false,
        });
        return { skipped: true, reason: args.reason };
      }
    }

    // Send tool results back to model and let it continue
    prompt = JSON.stringify(toolResults);
  }

  await logAgentRun({
    userId,
    status: "max_steps_reached",
    reasoning: "Agent didn't reach a conclusion",
    insightCreated: false,
  });
  return { skipped: true, reason: "max steps reached" };
}