import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/database.js";
import { createServer } from "http";
import { Server } from "socket.io";
import verifySocketToken from "./middlewares/socketAuth.middleware.js";
import registerGameHandlers from "./handlers/game.handler.js";
import handleServerCrash from "./services/serverCrash.js";
import { initMailer } from "./services/otpFunctions.js";

dotenv.config({
  path: "./.env",
});

const startServer = async () => {
  try {
    await connectDB(); // chiamiamo la funzione per connettere il DB

    const httpServer = createServer(app); // avvolgo l'app express in un server http, fondamentale per utilizzare il canale io

    const io = new Server(httpServer, {
      cors: {
        origin: `${process.env.FRONTEND_URL}`, // non posso più utilizzare * perchè altrimenti non potrei utilizzare i cookies per ragioni di sicurezza
        methods: ["GET", "POST"],
        credentials: true, // questo serve proprio per far passare i cookie nell'header delle richieste
      },
    });

    await initMailer(); // prima di collegare il server creo il transporter per inviare le email solo una volta, all'avvio

    await handleServerCrash(); // chiamo subito anche la funzione per rimborsare gli utenti in caso di crash del server
    app.set("io", io); // variabile globale che rende accessibile a tutte le componenti del mio backend il canale di comunicazione creato da socket.io

    io.use(verifySocketToken); // il canale io utilizzerà come middleware questa funzione che controlla la validità del token

    // e mi metto in attesa di connessioni sul canale io, che avverranno quando un utente entra nella pagina della partita
    io.on("connection", (socket) => {
      console.log(`Nuovo utente collegato. Id Socket: ${socket.id}`);
      console.log(`ID Utente reale dal Database: ${socket.user.userId}`);

      registerGameHandlers(io, socket); // qui dento gestisco tutti gli eventi per i quali il server si pone in ascolto

      socket.on("error", (error) => {
        console.log("Error Socket", error);
        socket.disconnect();
      });
    });
    httpServer.listen(process.env.PORT || 8000, "0.0.0.0", () => {
      // e pongo il server in ascolto sulla porta definita dalla variabile in .env
      console.log(`Server is listenign on port: ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("Error starting the server: ", error);
  }
};

startServer();
