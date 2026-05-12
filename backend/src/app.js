import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

const app = express();

app.use(
  cors({
    origin: `${process.env.FRONTEND_URL}`, // Lo stesso indirizzo del frontend
    credentials: true, // FONDAMENTALE per leggere e scrivere i Cookie httpOnly
  }),
);
app.use(express.json());

import userRouter from "./routes/user.route.js";
import lobbyRouter from "./routes/lobby.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/lobbies", lobbyRouter);

export default app;
