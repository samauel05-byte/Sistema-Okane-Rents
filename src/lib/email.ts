/** Sends transactional email via the Resend API (https://resend.com).
 * Requires RESEND_API_KEY in the environment; RESEND_FROM_EMAIL is optional
 * (defaults to Resend's shared test sender, which only delivers to the
 * account owner's own verified address — a real domain must be verified in
 * Resend for delivery to other recipients). */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        "El envío de correos no está configurado (falta RESEND_API_KEY en las variables de entorno).",
    };
  }

  const from = process.env.RESEND_FROM_EMAIL || "Okane Rents <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `No se pudo enviar el correo (${res.status}): ${body}` };
  }

  return { ok: true };
}
