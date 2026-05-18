import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config({ path: "./.env" });

let transporter;
let devFromEmail;
let resend;

export async function initMailer() {
  // questa funzione viene chiamata all'avvio del server, e serve ad instanziare il trasporter in base alla modalità:
  // se siamo in development utilizzo nodmailer per creare un account di test, altrimenti utilizzo RESEND con la API_KEY salvata in .env
  if (process.env.NODE_ENV === "development") {
    const testAccount = await nodemailer.createTestAccount();
    devFromEmail = testAccount.user;
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    resend = new Resend(process.env.RESEND_API_KEY); // inizializzo il mio resend tramite la mia chiave privata salvata in .env
  }
}

// crypto è una libreria di Node.js che server per creare codici otp
export function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}
// sempre in base allo stato di sviluppo, mando tramite nodemailer utilizzando ethereal, altrimenti tramite resend utilizzando il dominio del server
export async function sendOTPEmail(email, otp) {
  if (process.env.NODE_ENV === "development") {
    const info = await transporter.sendMail({
      from: devFromEmail,
      to: email,
      subject: "Codice di verifica",
      text: `Il tuo codice OTP è: ${otp}. Scade tra 3 minuti.`,
    });
    console.log("Email preview URL:", nodemailer.getTestMessageUrl(info));
  } else {
    await resend.emails.send({
      from: `Piatto <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Codice di verifica",
      html: `<p>Il tuo codice OTP è: <strong style="font-size:24px">${otp}</strong></p>
             <p>Scade tra <strong>3 minuti</strong>. Non condividerlo con nessuno.</p>`,
    });
  }
}
