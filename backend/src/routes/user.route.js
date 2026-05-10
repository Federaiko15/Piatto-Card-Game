import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  updateUserCredentials,
  resetUserPassword,
  refreshToken,
  sendOtp,
} from "../controllers/user.controller.js";
import verifyToken from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/send-otp").post(sendOtp);
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.route("/resetPassword").put(resetUserPassword);
router.route("/updatePassword").put(verifyToken, updateUserCredentials);
router.route("/profile/:id").get(verifyToken, getUser);
router.route("/refresh").post(verifyToken, refreshToken);

export default router;
