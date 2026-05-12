import mongoose, { Schema } from "mongoose";

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
