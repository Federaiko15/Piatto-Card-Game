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
    const { email, type } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "L'indirizzo email è obbligatorio",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Se stiamo inviando l'OTP per la registrazione di un nuovo account
    if (type !== "reset") {
      const existingVerifiedUser = await User.findOne({
        email: normalizedEmail,
        verified: true,
      });

      if (existingVerifiedUser) {
        return res.status(400).json({
          message: "Questa email è già registrata. Effettua il login o recupera la password.",
        });
      }
    } else {
      // Se stiamo inviando l'OTP per il recupero password
      const existingUser = await User.findOne({
        email: normalizedEmail,
        verified: true,
      });

      if (!existingUser) {
        return res.status(404).json({
          message: "Nessun account registrato trovato con questa email.",
        });
      }
    }

    const otp = generateOtp();
    const otp_expires_at = new Date(Date.now() + 3 * 60 * 1000);

    // Salva o aggiorna l'OTP nel database per questa email
    await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          otp,
          otp_expires_at,
          otp_attempts: 0,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
      },
    );

    await sendOTPEmail(normalizedEmail, otp);

    return res.status(200).json({
      message: "Codice OTP inviato con successo!",
    });
  } catch (error) {
    console.error("Error in sendOtp:", error);
    return res.status(500).json({
      message: "Errore durante l'invio del codice OTP",
      error: error.message,
    });
  }
};

const registerUser = async (req, res) => {
  try {
    const { username, password, email, otp } = req.body;

    if (!username || !password || !email || !otp) {
      return res.status(400).json({
        message: "Tutti i campi sono obbligatori!",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    if (normalizedUsername.length < 1 || normalizedUsername.length > 30) {
      return res.status(400).json({
        message: "Il nickname deve contenere tra 1 e 30 caratteri.",
      });
    }

    if (password.length < 6 || password.length > 60) {
      return res.status(400).json({
        message: "La password deve contenere tra 6 e 60 caratteri.",
      });
    }

    // 1. Controlliamo se l'email è già verificata / registrata
    const alreadyVerifiedEmail = await User.findOne({
      email: normalizedEmail,
      verified: true,
    });
    if (alreadyVerifiedEmail) {
      return res.status(400).json({
        message: "Questa email è già registrata. Effettua il login.",
      });
    }

    // 2. Controlliamo se lo username è già occupato da un altro utente verificato
    const existingUsername = await User.findOne({
      username: normalizedUsername,
      verified: true,
    });
    if (existingUsername) {
      return res.status(400).json({
        message: "Questo nickname è già in uso. Scegline un altro.",
      });
    }

    // 3. Cerchiamo il documento unverified con l'OTP valido
    const existing = await User.findOne({
      email: normalizedEmail,
      verified: false,
    });

    if (!existing) {
      return res.status(400).json({
        message: "Devi prima richiedere il codice OTP per verificare l'email!",
      });
    }

    // 4. Controlli su scadenza, tentativi e valore OTP
    if (!existing.otp_expires_at || existing.otp_expires_at < new Date()) {
      return res.status(400).json({
        message: "Il codice OTP è scaduto. Richiedine uno nuovo.",
      });
    }

    if (existing.otp_attempts >= 5) {
      return res.status(400).json({
        message: "Hai superato il numero massimo di tentativi. Richiedi un nuovo OTP.",
      });
    }

    if (existing.otp !== otp.trim()) {
      await User.updateOne(
        { _id: existing._id },
        { $inc: { otp_attempts: 1 } },
      );
      return res.status(400).json({
        message: "Codice OTP non valido. Controlla la tua email.",
      });
    }

    // 5. Completamento registrazione
    existing.username = normalizedUsername;
    existing.password = password; // verrà hashata dal middleware pre('save')
    existing.verified = true;
    existing.balance = 1000;
    existing.otp = undefined;
    existing.otp_expires_at = undefined;
    existing.otp_attempts = 0;

    await existing.save();

    return res.status(200).json({
      message: "Registrazione completata con successo! Ora puoi effettuare il login.",
      existing,
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    if (error.code === 11000) {
      if (error.keyPattern?.username) {
        return res.status(400).json({
          message: "Questo nickname è già in uso. Scegline un altro.",
        });
      }
      if (error.keyPattern?.email) {
        return res.status(400).json({
          message: "Questa email è già registrata.",
        });
      }
    }
    return res.status(500).json({
      message: "Errore del server durante la registrazione",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Tutti i campi sono obbligatori",
      });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (!existing) {
      return res.status(404).json({
        message: "Email o password non validi",
      });
    }

    if (!existing.verified) {
      return res.status(400).json({
        message: "Devi prima verificare la tua email e completare la registrazione!",
      });
    }

    // controllo quindi se la password inserita è corretta facendo la verifica tramite la funzione compare di bcrypt
    const isPasswordCorrect = await bcrypt.compare(password, existing.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Email o password non validi",
      });
    }
    // creo i token, quello di accesso che verrà salvato nel localstorage del browser del client, e quello di refresh
    const accessToken = createAccessToken(existing._id);
    const refreshToken = createRefreshToken(existing._id);

    // salvo il refresh token nel cookie http che poi il client utilizzerà per le richieste di refresh di un access token
    res.cookie("jwt", refreshToken, {
      httpOnly: true, // così non sarà accessibile tramite JS lato client
      sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
      secure: process.env.NODE_ENV !== "development", // true solo in produzione
      maxAge: 7 * 24 * 60 * 60 * 1000, // calcolo di una settimana in millisecondi
    });

    existing.online = true;
    await existing.save();
    return res.status(200).json({
      message: "Login successfully accepted",
      user: {
        _id: existing._id,
        username: existing.username,
        email: existing.email,
        balance: existing.balance,
        hasVotedSteam: existing.hasVotedSteam,
        steamVote: existing.steamVote,
        accessToken,
      },
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    return res.status(500).json({
      message: "Errore del server durante il login",
      error: error.message,
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    // in questa funzione che gestisce il logout dalla pagina generale delle lobby elimino semplicemente il refreshtoken dal cookie
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
      secure: process.env.NODE_ENV !== "development",
    });
    const userId = req.user.userId;
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    user.online = false;
    await user.save();
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
        hasVotedSteam: player.hasVotedSteam,
        steamVote: player.steamVote,
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
    // per cambiare la password l'utente deve aver prima inserito quella vecchia
    // che controllo quindi tramite bcrypt
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
      message: "Tutti i campi sono obbligatori",
    });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      message: "Le password non coincidono",
    });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({
      message: "La nuova password deve contenere almeno 6 caratteri",
    });
  }
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
      verified: true,
    });
    if (!user) {
      return res.status(400).json({
        message: "Nessun account registrato trovato con questa email",
      });
    }

    // Controllo validità OTP
    if (!user.otp_expires_at || user.otp_expires_at < new Date()) {
      return res.status(400).json({ message: "Codice OTP scaduto. Richiedine uno nuovo." });
    }
    if (user.otp_attempts >= 5) {
      return res.status(400).json({ message: "Hai superato il numero massimo di tentativi. Richiedi un nuovo OTP." });
    }
    if (user.otp !== otp.trim()) {
      await User.updateOne({ _id: user._id }, { $inc: { otp_attempts: 1 } });
      return res.status(400).json({ message: "Codice OTP non valido" });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otp_expires_at = undefined;
    user.otp_attempts = 0;
    await user.save();

    return res.status(200).json({
      message: "Password reimpostata con successo!",
    });
  } catch (error) {
    console.error("Server Error in resetUserPassword: ", error);
    return res.status(500).json({
      message: "Errore del server durante il reset della password",
      error: error.message,
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
      sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
      secure: process.env.NODE_ENV !== "development",
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
    console.log("=> [refreshToken] Inizio chiamata per il refresh del token.");
    // prendo il refresh token dal cookie
    const cookies = req.cookies;
    console.log(
      "=> [refreshToken] Cookies ricevuti:",
      cookies ? Object.keys(cookies) : "Nessuno",
    );

    if (!cookies?.jwt) {
      console.log(
        "=> [refreshToken] Nessun cookie 'jwt' trovato. Ritorno 401.",
      );
      return res.sendStatus(401); // se non lo trovo mando 401, che verrà intercettato dal client che rimanderà l'utente
      // nella pagina di autenticazione
    }

    const refreshToken = cookies.jwt;

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_WEB_TOKEN);
      const newAccessToken = createAccessToken(decoded.userId);
      console.log(
        "=> [refreshToken] Refresh Token valido per userId:",
        decoded.userId,
      );

      // nel caso quindi che il controllo vada a buon fine, mando un nuovo accesstoken
      return res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
      console.log(
        "=> [refreshToken] Errore validazione Refresh Token:",
        err.message,
      );
      // Se il refresh token è scaduto, lo decodifichiamo comunque (senza validarlo)
      // per estrarre l'ID utente e assicuraci che venga impostato offline nel database.
      const decodedPayload = jwt.decode(refreshToken);
      console.log("=> [refreshToken] Payload forzato:", decodedPayload);
      if (decodedPayload && decodedPayload.userId) {
        console.log(
          "=> [refreshToken] Imposto online: false per utente:",
          decodedPayload.userId,
        );
        await User.findByIdAndUpdate(decodedPayload.userId, {
          online: false,
        });
      }
      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
        secure: process.env.NODE_ENV !== "development",
      });
      return res.status(403).json({ message: "Token non valido o scaduto" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

const forcedLogout = async (req, res) => {
  try {
    const authorization = req.headers["authorization"];
    if (!authorization) {
      return res.status(401).json({ message: "You have to be logged in" });
    }

    const token = authorization.split(" ")[1];

    const decoded = jwt.verify(token, process.env.ACCESS_WEB_TOKEN, {
      ignoreExpiration: true, // ignorando quindi se il token è scaduto o meno, perchè questo è il caso in cui entrambi i token sono scaduti
    });

    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
      secure: process.env.NODE_ENV !== "development",
    });

    const userId = decoded.userId;
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.online = false;
    await user.save();

    res.status(200).json({ message: "Forced logout successfully done" });
  } catch (error) {
    console.log("Error in forcedLogout", error);
    return res.status(403).json({
      message: "Invalid token for forced logout",
      error: error.message,
    });
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
  forcedLogout,
};
