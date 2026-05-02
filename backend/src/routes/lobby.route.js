import { Router } from "express";
import {
  createLobby,
  getLobbies,
  joinLobby,
  leaveLobby,
} from "../controllers/lobby.controller.js";
import verifyToken from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create").post(verifyToken, createLobby);
router.route("/join/:id").post(verifyToken, joinLobby);
router.route("/getLobbies").get(verifyToken, getLobbies);
router.route("/leaveLobby/:id").post(verifyToken, leaveLobby);

export default router;
