import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config({
  path: "./.env",
});

const app = express(); // creo l'app express per il server

app.use(
  cors({
    // imposto le impostazioni cors per gestire i collegamenti da indirizzi diversi rispetto a quello del server
    origin: `${process.env.FRONTEND_URL}`, // Lo stesso indirizzo del frontend
    credentials: true, // FONDAMENTALE per leggere e scrivere i Cookie httpOnly
  }),
);

app.use(cookieParser()); // questo serve a dare la possibilità di poter ricavare dal corpo della richiesta i cookie mandati dal client
app.use(express.json()); // questo server a dare la possibilità alla mia app express di leggere cotenuti in formato json

import userRouter from "./routes/user.route.js";
import lobbyRouter from "./routes/lobby.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/lobbies", lobbyRouter);

export default app;
