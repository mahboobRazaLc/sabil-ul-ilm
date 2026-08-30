import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "Sabeel-ul-Ilm <onboarding@resend.dev>";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset Your Password - Sabeel-ul-Ilm",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #064e3b; margin-bottom: 8px;">Password Reset Request</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          We received a request to reset your password for your <strong>Sabeel-ul-Ilm</strong> account.
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #064e3b; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          Sabeel-ul-Ilm Learning Platform
        </p>
      </div>
    `,
  });
}
