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

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, NUM_HASH);
});

const User = mongoose.model("User", userSchema);
export default User;
