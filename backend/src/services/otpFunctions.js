import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

export function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

const createTransporter = async () => {
  // In sviluppo usa Ethereal
  if (process.env.NODE_ENV === "development") {
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    return { transporter, testAccount };
  }

  // In produzione poi si utilizzeranno le credenziali reali
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.PASSWORD_USER,
    },
  });

  return { transporter, testAccount: null };
};

export async function sendOTPEmail(email, otp) {
  const { transporter, testAccount } = await createTransporter();

  const info = await transporter.sendMail({
    from: testAccount?.user ?? process.env.EMAIL_USER,
    to: email,
    subject: "Codice di verifica",
    text: `Il tuo codice OTP è: ${otp}`,
  });

  // In sviluppo ti stampa il link dove vedere l'email
  if (process.env.NODE_ENV === "development") {
    console.log("Email preview URL:", nodemailer.getTestMessageUrl(info));
  }
}
