import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Resend } from "resend";
import { getServerSession } from "next-auth";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { race_id, subject, message, emails } = await req.json();

  if (!race_id || !subject || !message) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  // Fetch race
  const { data: race } = await supabaseAdmin
    .from("races")
    .select("name")
    .eq("id", race_id)
    .single();

  if (!race)
    return NextResponse.json({ error: "Race not found." }, { status: 404 });

  // If specific emails passed, use those; otherwise fetch all for the race
  const query = supabaseAdmin
    .from("participants")
    .select("name, email")
    .eq("race_id", race_id)
    .not("email", "is", null);

  if (emails?.length) {
    query.in("email", emails);
  }

  const { data: participants } = await query;

  if (!participants?.length) {
    return NextResponse.json(
      { error: "No participants with emails found." },
      { status: 400 },
    );
  }

  // Send to each participant
  const results = await Promise.allSettled(
    participants.map((p) =>
      resend.emails.send({
        from: "no-reply@updates.nybrorunclub.dk",
        to: p.email!,
        subject,
        html: broadcastEmail({ name: p.name, raceName: race.name, message }),
      }),
    ),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent, failed, total: participants.length });
}

function broadcastEmail({
  name,
  raceName,
  message,
}: {
  name: string;
  raceName: string;
  message: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#000000;padding:32px 40px;">
              <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">Nybrogård Løbeklub</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:600;">${raceName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>${name}</strong>,</p>
              <div style="color:#374151;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                Nybrogård Løbeklub · nybrorunclub.dk<br>
                Questions? Contact us at <a href="mailto:loebeklubben@nybro.dk" style="color:#9ca3af;">loebeklubben@nybro.dk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
