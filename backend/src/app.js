// express è un framework per node.js per l'implementazione di funzioni che rendono facile la programmazione di backend
import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // Lo stesso indirizzo del frontend
    credentials: true, // FONDAMENTALE per leggere e scrivere i Cookie httpOnly
  }),
);
app.use(express.json());

import userRouter from "./routes/user.route.js";
import lobbyRouter from "./routes/lobby.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/lobbies", lobbyRouter);

export default app;
