import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createAccessToken, createRefreshToken } from "../tokens.js";
import User from "../models/user.model.js";
import { generateOtp, sendOTPEmail } from "../services/otpFunctions.js";

dotenv.config({
  path: "./.env",
});

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "All fields are important",
      });
    }

    const otp = generateOtp();
    const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000);

    await User.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      {
        otp,
        otp_expires_at,
        otp_attempts: 0,
      },
      {
        returnDocument: "after",
        upsert: true,
      },
    );

    await sendOTPEmail(email, otp);

    res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log("Error in sendOtp", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
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

    const existing = await User.findOne({
      email: email.trim().toLowerCase(),
      verified: false,
    });
    if (!existing) {
      return res
        .status(404)
        .json({ message: "You have verify you email first!" });
    }

    if (existing.otp_expires_at < new Date())
      return res.status(400).json({ error: "OTP scaduto" });
    if (existing.otp_attempts >= 5)
      return res.status(400).json({ error: "Troppi tentativi" });
    if (existing.otp !== otp) {
      await User.updateOne({ email }, { $inc: { otp_attempts: 1 } });
      return res.status(400).json({ error: "OTP non valido" });
    }

    // OTP corretto
    existing.username = username;
    existing.password = password; // hashata dal middleware
    existing.verified = true;
    existing.otp = undefined;
    existing.otp_expires_at = undefined;
    existing.otp_attempts = undefined;

    await existing.save();

    res.status(200).json({
      message: "User successfully registered",
      existing,
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
    console.log("req.body:", req.body);
    if (!existing) {
      console.log("Utente non trovato nel DB");
      return res.status(404).json({
        message: "Invalid email or password",
      });
    }
    console.log(password, existing.password);
    // check if the password sent by the client is correct with bcrypt
    const isPasswordCorrect = await bcrypt.compare(password, existing.password);
    console.log(isPasswordCorrect);
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
