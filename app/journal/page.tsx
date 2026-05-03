// import { createClient } from "@/lib/supabase/server";
// import { redirect } from "next/navigation";
// import JournalEditor from "./JournalEditor";
// import Link from "next/link";

// export default async function JournalPage() {
//   const supabase = await createClient();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) redirect("/login");

//   const { data: entries } = await supabase
//     .from("entries")
//     .select("*")
//     .order("created_at", { ascending: false })
//     .limit(10);

//   return (
//     <div className="max-w-2xl mx-auto p-6 space-y-8">
//       <header className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold">My Journal</h1>
//         <div className="flex items-center gap-4 text-sm">
//           <Link href="/chat" className="text-blue-600 hover:underline">
//             Chat 💬
//           </Link>
//           <Link href="/this-week" className="text-blue-600 hover:underline">
//             This Week →
//           </Link>
//           <span className="text-gray-600">{user.email}</span>
//         </div>
//       </header>

//       <JournalEditor />

//       <section>
//         <h2 className="text-xl font-semibold mb-4">Recent entries</h2>
//         <div className="space-y-4">
//           {entries?.map((entry) => (
//             <div key={entry.id} className="p-4 border rounded-lg">
//               <p className="text-xs text-gray-500 mb-2">
//                 {new Date(entry.created_at).toLocaleString()}
//               </p>
//               <p className="whitespace-pre-wrap">{entry.content}</p>
//             </div>
//           ))}
//           {entries?.length === 0 && (
//             <p className="text-gray-500">No entries yet. Write your first one above!</p>
//           )}
//         </div>
//       </section>
//     </div>
//   );
// }

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import JournalEditor from "./JournalEditor";
import EntriesList from "./EntriesList";

export default async function JournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Pull all entries now (we'll filter client-side)
  const { data: entries } = await supabase
    .from("entries")
    .select("id, content, created_at, mood")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Journal</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/chat" className="text-blue-600 hover:underline">
            Chat 💬
          </Link>
          <Link href="/this-week" className="text-blue-600 hover:underline">
            This Week →
          </Link>
          <Link href="/stats" className="text-blue-600 hover:underline">
            Stats 📊
          </Link>
          <span className="text-gray-600">{user.email}</span>
        </div>
      </header>

      <JournalEditor />

      <EntriesList entries={entries ?? []} />
    </div>
  );
}