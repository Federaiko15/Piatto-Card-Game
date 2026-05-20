import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  updateUserCredentials,
  resetUserPassword,
  refreshToken,
  deleteAccont,
  sendOtp,
  forcedLogout,
} from "../controllers/user.controller.js";
import verifyToken from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/send-otp").post(sendOtp);
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/resetPassword").put(resetUserPassword);
router.route("/updatePassword").put(verifyToken, updateUserCredentials);
router
  .route("/profile/:id")
  .get(verifyToken, getUser)
  .delete(verifyToken, deleteAccont)
  .post(verifyToken, logoutUser);
router.route("/refresh").post(refreshToken);
router.route("/forcedLogout").post(forcedLogout);

export default router;

// il primo argomento delle funzioni che hanno due parametri è una funzione che fa da middleware: praticamente va a prendere dall'header
// della richiesta il jwt inviato dal client e lo verifica tramite la funzione della libreria jsonwebtoken verify. Se la verifica va a buon fine
// chiama il campo next, per passare al prossimo middleware che nel nostro caso sarà la funzione.
