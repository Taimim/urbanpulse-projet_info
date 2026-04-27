import nodemailer from "nodemailer";
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } from "./core";

export async function envoyerEmailValidation(
  email: string,
  login: string,
  verificationUrl: string
): Promise<boolean> {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) return false;
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: "Confirmation d'inscription — UrbanPulse",
      text: `Bonjour ${login},\n\nCliquez sur ce lien pour valider votre compte :\n${verificationUrl}\n\nMerci.`,
    });
    return true;
  } catch {
    return false;
  }
}
