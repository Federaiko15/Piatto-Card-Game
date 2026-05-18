import { Router } from "express";
import {
  createLobby,
  getLobbies,
  joinLobby,
} from "../controllers/lobby.controller.js";
import verifyToken from "../middlewares/auth.middleware.js";

const router = Router();
// tramite sempre la libreria di express posso utilizzare la funzione Router() per creare un oggetto che mi permette di definire
// i differenti percorsi delle chiamate API, e anche di definire il metodo e la funzione associata
router.route("/create").post(verifyToken, createLobby);
router.route("/join/:id").post(verifyToken, joinLobby);
router.route("/getLobbies").post(verifyToken, getLobbies);

export default router;
