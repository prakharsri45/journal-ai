import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Generate a 768-dim embedding for a piece of text
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent({
    content: { role: "user", parts: [{ text }] },
    // @ts-expect-error - outputDimensionality is supported by the API but missing from SDK types
    outputDimensionality: 768,
  });
  return result.embedding.values;
}

// Generate a reflection question for a journal entry
export async function generateReflection(entry: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `You are a thoughtful, warm journaling companion. Read this journal entry and ask ONE open-ended question that helps the writer reflect more deeply. Be curious, not clinical. Don't summarize or analyze — just ask the question.

Entry:
${entry}

Question:`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

type EntryForSummary = {
  content: string;
  created_at: string;
};

export async function generateWeeklySummary(
  entries: EntryForSummary[]
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const formatted = entries
    .map((e) => {
      const date = new Date(e.created_at).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      return `--- ${date} ---\n${e.content}`;
    })
    .join("\n\n");

  const prompt = `You are a thoughtful journaling companion reviewing someone's week. Read their entries below and write a warm, insightful weekly reflection.

Structure your response in exactly these sections, using markdown headings:

## Themes
2-3 recurring topics or patterns you noticed.

## Mood arc
How did their emotional state shift across the week?

## Wins
Moments worth celebrating, even small ones.

## Worth watching
Patterns that might deserve attention — phrased gently, never as a diagnosis.

## A question to sit with
One open-ended question to carry into next week.

Be warm and specific. Quote brief phrases from their entries when relevant. Avoid generic advice.

ENTRIES:
${formatted}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

type EntryForContext = {
  content: string;
  created_at: string;
  similarity: number;
};

export async function answerFromEntries(
  question: string,
  entries: EntryForContext[]
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const formatted = entries
    .map((e, i) => {
      const date = new Date(e.created_at).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `[Entry ${i + 1} — ${date}]\n${e.content}`;
    })
    .join("\n\n");

  const prompt = `You are helping someone reflect on their own journal entries. Answer their question using ONLY the entries provided below. Reference specific dates or moments when relevant. If the entries don't contain enough information to answer, say so honestly — don't make things up.

Be warm, specific, and concise. Quote brief phrases from entries when they illustrate your point.

QUESTION:
${question}

RELEVANT ENTRIES:
${formatted}

ANSWER:`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function generateTags(content: string): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `Read this journal entry and extract 2-4 short, lowercase tags that describe its main topics. Use single words or hyphenated phrases. Common categories: work, family, health, relationships, creativity, anxiety, gratitude, exercise, sleep, friends, money, learning. Make up new ones if needed.

Return ONLY a JSON array of strings, nothing else. Example: ["work", "anxiety", "deadlines"]

Entry:
${content}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    const tags = JSON.parse(cleaned);
    return Array.isArray(tags) ? tags.slice(0, 4) : [];
  } catch {
    return [];
  }
}