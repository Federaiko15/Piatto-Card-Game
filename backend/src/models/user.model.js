import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { NUM_HASH } from "../config/constants.js";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minLength: 1,
      maxLength: 30,
    },

    password: {
      type: String,
      required: true,
      minLength: 6,
      maxLength: 60,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    balance: {
      //saldo
      type: Number,
      default: 1000,
    },
    otp: {
      type: String,
      required: false,
    },
    otp_expires_at: {
      type: Date,
      required: false,
    },
    otp_attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    refundServerCrashDate: {
      type: Date,
      default: null,
    },
    online: {
      type: Boolean,
      default: false,
    },
    hasVotedSteam: {
      type: Boolean,
      default: false,
    },
    steamVote: {
      type: String,
      enum: ["yes", "no", null],
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// TTL index — elimina automaticamente i documenti con verified: false alla scadenza
userSchema.index(
  { otp_expires_at: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { verified: false } },
);
// questa funzione pre è un middleware, che parte quando viene chiamata la funzione di mongoose save. Prima infatti di salvare un utente
// sul db, utilizzo una funzione hash critograficamente sicura tramite bcrypt per hashare la password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, NUM_HASH);
});

const User = mongoose.model("User", userSchema);
export default User;
