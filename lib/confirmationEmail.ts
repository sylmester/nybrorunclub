export function confirmationEmail({
  name,
  raceName,
  raceDate,
  distanceKm,
}: {
  name: string;
  raceName: string;
  raceDate: string;
  distanceKm: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#000000;padding:32px 40px;">
              <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">Nybrogård Løbeklub</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:600;">You're signed up! 🏃</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Hi <strong>${name}</strong>, your registration is confirmed. See you on the start line!
              </p>

              <!-- Details box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="padding:6px 0;">
                    <span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Race</span><br>
                    <span style="color:#111827;font-size:15px;font-weight:500;">${raceName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;border-top:1px solid #e5e7eb;">
                    <span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Date</span><br>
                    <span style="color:#111827;font-size:15px;font-weight:500;">${raceDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;border-top:1px solid #e5e7eb;">
                    <span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Distance</span><br>
                    <span style="color:#111827;font-size:15px;font-weight:500;">${distanceKm}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
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
