"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

type Source = {
  id: string;
  content: string;
  created_at: string;
  similarity: number;
};

type Conversation = {
  question: string;
  answer: string;
  sources: Source[];
};

const EXAMPLE_QUESTIONS = [
  "When did I feel most energized?",
  "What's been worrying me lately?",
  "What patterns do you notice in my work life?",
  "Have I mentioned anyone repeatedly?",
];

export default function ChatInterface() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState("");

  async function handleAsk(q?: string) {
    const finalQuestion = (q ?? question).trim();
    if (!finalQuestion) return;

    setLoading(true);
    setError("");
    setQuestion("");

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: finalQuestion }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
    } else {
      setConversations((prev) => [
        ...prev,
        {
          question: finalQuestion,
          answer: data.answer,
          sources: data.sources || [],
        },
      ]);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="Ask anything about your entries..."
            className="flex-1 p-3 border rounded-lg"
            disabled={loading}
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || !question.trim()}
            className="px-6 py-2 bg-black text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "Searching..." : "Ask"}
          </button>
        </div>

        {conversations.length === 0 && !loading && (
          <div className="pt-4 space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAsk(q)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {conversations.map((conv, i) => (
          <div key={i} className="space-y-3">
            <div className="font-medium">Q: {conv.question}</div>

            <article className="prose prose-sm max-w-none p-4 bg-gray-50 border rounded-lg">
              <ReactMarkdown>{conv.answer}</ReactMarkdown>
            </article>

            {conv.sources.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                  Show {conv.sources.length} source{conv.sources.length === 1 ? "" : "s"}
                </summary>
                <div className="mt-2 space-y-2">
                  {conv.sources.map((src) => (
                    <div key={src.id} className="p-3 bg-white border rounded-lg">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>
                          {new Date(src.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span>{(src.similarity * 100).toFixed(0)}% match</span>
                      </div>
                      <p className="text-gray-700 line-clamp-3">{src.content}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}