import User from "../models/user.model.js";
import { SteamPollVote, SteamPollStats } from "../models/steamPoll.model.js";

const POLL_KEY = "steam_release_poll";

// Helper per estrarre l'IP del client (per audit/tracciamento)
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};

export const getSteamPollStatus = async (req, res) => {
  try {
    let stats = await SteamPollStats.findOne({ pollKey: POLL_KEY });
    if (!stats) {
      stats = await SteamPollStats.create({
        pollKey: POLL_KEY,
        yesCount: 0,
        noCount: 0,
      });
    }

    const userId = req.user?.userId;
    let hasVoted = false;
    let userVote = null;

    if (userId) {
      const user = await User.findById(userId);
      if (user && user.hasVotedSteam) {
        hasVoted = true;
        userVote = user.steamVote;
      }
    }

    const totalVotes = stats.yesCount + stats.noCount;
    const yesPercentage =
      totalVotes > 0 ? Math.round((stats.yesCount / totalVotes) * 100) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalVotes,
        yesCount: stats.yesCount,
        noCount: stats.noCount,
        yesPercentage,
      },
      hasVoted,
      userVote,
    });
  } catch (error) {
    console.error("Errore in getSteamPollStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Errore durante il recupero dei dati del sondaggio",
      error: error.message,
    });
  }
};

export const submitSteamPollVote = async (req, res) => {
  try {
    const { vote } = req.body;

    if (!vote || (vote !== "yes" && vote !== "no")) {
      return res.status(400).json({
        success: false,
        message: "Voto non valido. I valori consentiti sono 'yes' o 'no'.",
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Devi aver effettuato l'accesso per poter votare.",
      });
    }

    const ip = getClientIp(req);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utente non trovato",
      });
    }

    if (user.hasVotedSteam) {
      return res.status(400).json({
        success: false,
        message: "Hai già espresso il tuo voto per questo account!",
      });
    }

    user.hasVotedSteam = true;
    user.steamVote = vote;
    await user.save();

    await SteamPollVote.create({
      userId: user._id,
      ip,
      vote,
    });

    // Aggiornamento atomico del contatore globale
    const incField = vote === "yes" ? { yesCount: 1 } : { noCount: 1 };
    const updatedStats = await SteamPollStats.findOneAndUpdate(
      { pollKey: POLL_KEY },
      { $inc: incField },
      { upsert: true, returnDocument: "after" },
    );

    const totalVotes = updatedStats.yesCount + updatedStats.noCount;
    const yesPercentage =
      totalVotes > 0
        ? Math.round((updatedStats.yesCount / totalVotes) * 100)
        : 0;

    return res.status(200).json({
      success: true,
      message: "Grazie per aver espresso il tuo voto!",
      stats: {
        totalVotes,
        yesCount: updatedStats.yesCount,
        noCount: updatedStats.noCount,
        yesPercentage,
      },
      hasVoted: true,
      userVote: vote,
    });
  } catch (error) {
    console.error("Errore in submitSteamPollVote:", error);
    return res.status(500).json({
      success: false,
      message: "Errore durante il salvataggio del voto",
      error: error.message,
    });
  }
};
