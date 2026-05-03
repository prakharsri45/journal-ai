import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function emailInsightToUser(userId: string, insight: {
  type: string;
  message: string;
}) {
  const supabase = createAdminClient();
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  if (!user?.email) return;

  const subjects = {
    observation: "I noticed something in your journal",
    question: "A question for your morning",
    celebration: "Worth celebrating ✨",
    gentle_nudge: "A gentle nudge",
  };

  await resend.emails.send({
    from: "Journal Coach <onboarding@resend.dev>",
    to: user.email,
    subject: subjects[insight.type as keyof typeof subjects] ?? "From your coach",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <p style="font-size: 16px; line-height: 1.6;">${insight.message}</p>
        <p style="margin-top: 32px; font-size: 14px; color: #666;">
          <a href="https://your-domain.vercel.app/journal">Open your journal →</a>
        </p>
      </div>
    `,
  });
}