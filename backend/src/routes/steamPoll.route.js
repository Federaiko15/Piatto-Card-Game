import { Router } from "express";
import {
  getSteamPollStatus,
  submitSteamPollVote,
} from "../controllers/steamPoll.controller.js";

const router = Router();

router.route("/").get(getSteamPollStatus);
router.route("/vote").post(submitSteamPollVote);

export default router;
