import { Resend } from 'resend';

const apiKey = import.meta.env.RESEND_API_KEY;
const adminEmail = import.meta.env.ADMIN_EMAIL;

if (!adminEmail) throw new Error('ADMIN_EMAIL not set');

const client = apiKey ? new Resend(apiKey) : null;

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
};

export async function sendAdminNotification(subject: string, text: string): Promise<void> {
  await sendEmail({ to: adminEmail, subject, text });
}

export async function sendEmail({ to, subject, text }: EmailPayload): Promise<void> {
  if (!client) {
    console.warn('[email] RESEND_API_KEY not set, skipping send', { to, subject });
    return;
  }
  const { error } = await client.emails.send({
    from: '36 m s.l.m. <noreply@polesineparmense36.it>',
    to,
    subject,
    text,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
