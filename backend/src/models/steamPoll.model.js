import mongoose, { Schema } from "mongoose";

const steamPollVoteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    ip: {
      type: String,
      required: false,
    },
    vote: {
      type: String,
      enum: ["yes", "no"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const steamPollStatsSchema = new Schema(
  {
    pollKey: {
      type: String,
      default: "steam_release_poll",
      unique: true,
    },
    yesCount: {
      type: Number,
      default: 0,
    },
    noCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const SteamPollVote = mongoose.model(
  "SteamPollVote",
  steamPollVoteSchema,
);

export const SteamPollStats = mongoose.model(
  "SteamPollStats",
  steamPollStatsSchema,
);
