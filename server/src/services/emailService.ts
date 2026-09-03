import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Sends the password-reset link to the user's email. Throws on failure so
// the caller (authController) can decide how to handle a failed send —
// e.g. rolling back the reset token instead of leaving a valid,
// un-deliverable token sitting on the account.
export const sendPasswordResetEmail = async (
  toEmail: string,
  resetLink: string
): Promise<void> => {
  await transporter.sendMail({
    from: `"Gamified Learning" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset for your Gamified Learning account.</p>
      <p>Click the link below to set a new password. This link is valid for 15 minutes.</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request this, you can safely ignore this email — your password will not be changed.</p>
    `,
  });
};