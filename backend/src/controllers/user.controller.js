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

    // deve esistere ma avere il verified a false
    const existing = await User.findOne({
      email: email.trim().toLowerCase(),
      verified: false,
    });
    if (!existing) {
      return res
        .status(404)
        .json({ message: "You have to verify you email first!" });
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
    return res.status(500).json({
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

    if (existing.online) {
      return res.status(400).json({
        message: "User already logged in",
      });
    }

    // controllo quindi se la password inserita è corretta facendo la verifica tramite la funzione compare di bcrypt
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
      httpOnly: true, // così non sarà accessibile tramite JS lato client
      sameSite: "none",
      secure: true, // solo HTTPS, fondamentale per garantire la sicurezza
      maxAge: 7 * 24 * 60 * 60 * 1000, // calcolo di una settimana in millisecondi
    });

    existing.online = true;
    await existing.save();
    // e invio invece l'access token all'utente così che venga salvato nel localstorage
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

const getUser = async (req, res) => {
  const playerId = req.params.id;
  try {
    const player = await User.findById(playerId);
    if (!player) {
      return res.status(404).json({
        message: "Player not found",
      });
    }
    res.status(200).json({
      message: "Player found",
      user: {
        _id: player._id,
        username: player.username,
        email: player.email,
        balance: player.balance,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const updateUserCredentials = async (req, res) => {
  const { email, password, newPassword } = req.body;
  if (!password || !newPassword || !email) {
    return res.status(400).json({
      message: "All fields are important",
    });
  }
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const resetUserPassword = async (req, res) => {
  const { email, newPassword, confirmPassword, otp } = req.body;
  if (!newPassword || !confirmPassword || !email || !otp) {
    return res.status(400).json({
      message: "All fields are important",
    });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      message: "The password are different",
    });
  }
  try {
    // l'utente deve già avere un account precedentemente verificato
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      verified: true,
    });
    if (!user) {
      return res.status(400).json({
        message: "You have to verify your email first",
      });
    }

    if (user.otp_expires_at < new Date())
      return res.status(400).json({ error: "OTP scaduto" });
    if (user.otp_attempts >= 5)
      return res.status(400).json({ error: "Troppi tentativi" });
    if (user.otp !== otp) {
      await User.updateOne({ email }, { $inc: { otp_attempts: 1 } });
      return res.status(400).json({ error: "OTP non valido" });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      message: "Password correttamente reimpostata",
    });
  } catch (error) {
    console.error("Server Error in resetUserPassword: ", error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

const deleteAccont = async (req, res) => {
  const { password } = req.body;
  const userId = req.params.id;
  if (!password || !userId) {
    return res.status(400).json({
      message: "All fields are important",
    });
  }
  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    // controllo se la password inviata dall'utente è corretta
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }
    // tolgo anche dal cookie http in refreshToken salvato per l'utente
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    await User.deleteOne({ _id: userId });

    res.status(200).json({
      message: "Account successfully deleted",
    });
  } catch (error) {
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

export {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  updateUserCredentials,
  resetUserPassword,
  deleteAccont,
  refreshToken,
  sendOtp,
};
