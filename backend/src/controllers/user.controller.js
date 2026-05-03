import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { totp } from "otplib";
import { createAccessToken, createRefreshToken } from "../tokens.js";
import User from "../models/user.model.js";

dotenv.config({
  path: "./.env",
});

const sendOtp = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      message: "All fields are important",
    });
  }
  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    return res.status(400).json({
      message: "The user already exists",
    });
  }

  const secret = process.env.OTP_SECRET;
  const otp = totp.generate(secret + email);

  const transporter = nodemailer.createTransport({});
  await transporter.sendMail({
    from: "cicciopasticcio@example.com", // qui andrà inserita la email che creerò per il gioco
    to: email,
    subject: "Il tuo codice di verifica",
    text: `Il tuo codice di verifica è: ${otp}`,
  });
};

const registerUser = async (req, res) => {
  try {
    const { username, password, email, otp } = req.body;

    if (!username || !password || !email || !otp) {
      return res.status(400).json({
        message: "ALL FIELDS ARE IMPORTANT!",
      });
    }
    // controllo se l'utente esiste già nel mio DB. La funzione findOne è una funzione che sostituisce le query
    // grezze per la comunicazione con MongoDB gestita dalla libreria mongoose, e può essere utilizzata dai
    // modelli (model) creati proprio per la comunicazioni con il DB

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Already exists a user with that email!" });
    }

    const isValid = totp.verify({
      token: otp,
      secret: process.env.OTP_SECRET + email,
    });

    if (!isValid) {
      return res.status(404).json({
        message: "The OTP isn't valid!",
      });
    }

    const user = new User({
      username,
      password,
      email: email.toLowerCase().trim(),
    });

    await user.save();

    res.status(200).json({
      message: "User successfully registered",
      user,
    });
  } catch (error) {
    console.log("Error in registerUser");
    return res.status(400).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "ALL FIELDS ARE IMPORTANT",
      });
    }
    const existing = await User.findOne({ email: email.trim().toLowerCase() });

    if (!existing) {
      return res.status(404).json({
        message: "Invalid email or password",
      });
    }

    // check if the password sent by the client is correct with bcrypt
    const isPasswordCorrect = await bcrypt.compare(password, existing.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = createAccessToken(existing._id);
    const refreshToken = createRefreshToken(existing._id);

    // salvo il refresh token nel cookie che poi il client utilizzerà per le richieste di refresh di un access token
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000, // calcolo di un giorno in millisecondi
    });

    res.status(200).json({
      message: "Login successfully accepted",
      user: {
        _id: existing._id,
        username: existing.username,
        email: existing.email,
        accessToken,
      },
    });
  } catch (error) {
    console.log("Error in loginUser", error);
    return res.status(500).json({
      //500 for Server Error
      message: "Server Error",
      error: error.message,
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    res.status(200).json({
      message: "Logout successfully done",
    });
  } catch (error) {
    console.log("Error in logoutUser", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    // prendo il refresh token dai cookie
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);

    const refreshToken = cookies.jwt;

    jwt.verify(
      refreshToken,
      process.env.REFRESH_WEB_TOKEN,
      async (err, decoded) => {
        if (err)
          return res
            .status(403)
            .json({ message: "Token non valido o scaduto" });

        const newAccessToken = createAccessToken(decoded.userId);

        res.json({ accessToken: newAccessToken });
      },
    );
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export { registerUser, loginUser, logoutUser, refreshToken, sendOtp };
