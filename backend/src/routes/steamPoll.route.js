import { Router } from "express";
import verifyToken from "../middlewares/auth.middleware.js";
import {
  getSteamPollStatus,
  submitSteamPollVote,
} from "../controllers/steamPoll.controller.js";

const router = Router();

router.use(verifyToken);
router.route("/").get(getSteamPollStatus);
router.route("/vote").post(submitSteamPollVote);

export default router;
