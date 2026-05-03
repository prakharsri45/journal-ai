import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ChatInterface from "./ChatInterface";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Chat with your past self</h1>
        <Link href="/journal" className="text-sm text-gray-600 hover:underline">
          ← Back to journal
        </Link>
      </header>

      <p className="text-sm text-gray-600">
        Ask questions about your entries. I'll search your journal and answer based on what you've written.
      </p>

      <ChatInterface />
    </div>
  );
}