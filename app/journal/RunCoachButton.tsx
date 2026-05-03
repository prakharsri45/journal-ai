"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunCoachButton() {
  const [running, setRunning] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setRunning(true);
    try {
      const res = await fetch("/api/agent/run", { method: "POST" });
      const data = await res.json();
      alert(JSON.stringify(data, null, 2));
      router.refresh();
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown"));
    } finally {
      setRunning(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={running}
      className="text-sm text-purple-600 hover:underline disabled:opacity-50"
    >
      {running ? "🤖 Running..." : "🤖 Run Coach (test)"}
    </button>
  );
}