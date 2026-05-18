import mongoose, { Schema } from "mongoose";
// tramite mongoose posso definire degli Schema, utili per dire al DB le proprietà degli oggetti che andremo a gestire.
// questi Schema poi saranno trasformati in modelli, così da poter utilizzare le funzioni di mongoose per le query al DB
const lobbySchema = new Schema(
  {
    lobbyname: {
      type: String,
      required: true,
      minLength: 1,
      maxLength: 20,
      unique: true,
      trim: true,
      lowercase: true,
    },
    numPlayers: {
      type: Number,
      required: true,
      min: 0,
      max: 7,
    },
    starterBet: {
      type: Number,
      min: 1,
      max: 50,
    },
    activePlayers: {
      type: [],
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "playing", "finished"],
      default: "waiting",
    },
    serverCrashDate: {
      type: Date,
      default: null,
    },
    refundStatus: {
      type: String,
      enum: ["none", "pending", "refunded"],
      default: "none",
    },
  },
  {
    timestamps: true,
  },
);

const Lobby = mongoose.model("Lobby", lobbySchema);
export default Lobby;
