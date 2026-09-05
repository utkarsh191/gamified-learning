import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Sends the password-reset link to the user's email.
export const sendPasswordResetEmail = async (
  toEmail: string,
  resetLink: string
): Promise<void> => {
  const { error } = await resend.emails.send({
    from: "Gamified Learning <onboarding@resend.dev>",
    to: [toEmail],
    subject: "Reset your password",
    html: `
      <p>You requested a password reset for your Gamified Learning account.</p>
      <p>Click the link below to set a new password. This link is valid for 15 minutes.</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request this, you can safely ignore this email — your password will not be changed.</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send reset email: ${error.message}`);
  }
};

// Sends the signup verification OTP.
export const sendOtpEmail = async (
  toEmail: string,
  otp: string
): Promise<void> => {
  const { error } = await resend.emails.send({
    from: "Gamified Learning <onboarding@resend.dev>",
    to: [toEmail],
    subject: "Your verification code",
    html: `
      <p>Your Gamified Learning verification code is:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
      <p>This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};