# 🃏 Piatto - Multiplayer Web Card Game

## 📖 Descrizione del Progetto

**Piatto** è un'applicazione web full-stack sviluppata come progetto d'esame. Consiste in un gioco di carte multiplayer in tempo reale in cui gli utenti possono registrarsi, creare o unirsi a lobby (stanze di gioco), chattare con gli altri giocatori e sfidarsi al tavolo.

Il progetto è stato concepito integrando sia una logica di gioco online, sia una modalità **offline**, essendo strutturato come una **PWA (Progressive Web App)**. Grazie all'utilizzo di Service Workers, l'applicazione gestisce la cache degli asset e simula una partita locale contro dei Bot qualora l'utente perda la connessione.

## 🛠 Stack Tecnologico

L'applicativo adotta l'architettura **MERN** arricchita dall'uso di WebSocket per garantire la comunicazione in tempo reale.

### Frontend

- **React** con **TypeScript** (Bundler: Vite)
- **React Router** per la gestione delle navigazioni tra le view
- **Socket.IO Client** per l'interazione bidirezionale real-time col server
- **SweetAlert2** per la gestione di modali e custom alert
- **Service Workers / PWA** per il caching (immagini, carte) e l'engine di gioco offline

### Backend

- **Node.js** ed **Express.js** per il server RESTful
- **Socket.IO** per la gestione degli eventi in-game, i messaggi in chat e le stanze/lobby
- **MongoDB** con **Mongoose** per il database (salvataggio Utenti, Storico Partite, Lobby in attesa)
- **JWT (JSON Web Token)** e **Bcrypt** per l'autenticazione sicura (meccanismo di Refresh Token via HTTP-only Cookies)
- **Nodemailer** per la verifica account tramite OTP inviato via email

---

## 🚀 Istruzioni per l'Installazione e l'Avvio

### Prerequisiti

- Node.js installato (consigliata versione LTS 18 o superiore).
- Connessione a Internet attiva (necessaria per la prima installazione dei pacchetti e per la connessione al database remoto MongoDB Atlas).

### 1. Clonare la repository

Aprire il terminale ed eseguire:

```bash
git clone <INSERIRE_URL_DELLA_REPOSITORY_QUI>
cd <NOME_CARTELLA_PROGETTO>
```

### 2. Configurazione e Avvio del Backend

Spostarsi nella directory del server e installare le dipendenze:

```bash
cd backend
npm install
```

> ⚠️ **ATTENZIONE:** Assicurarsi di aver copiato il file `.env` (per il backend) appena scaricato all'interno di questa cartella (`/backend`).

Avviare il server:

```bash
npm run dev
# oppure: npm start
```

_Il terminale mostrerà un messaggio di conferma dell'avvenuta connessione al database e la porta in ascolto._

### 3. Configurazione e Avvio del Frontend

Aprire una **nuova finestra del terminale**, tornare alla root del progetto e spostarsi nella directory client:

```bash
cd frontend
npm install
```

> ⚠️ **ATTENZIONE:** Assicurarsi di aver copiato il file `.env` (per il frontend) all'interno di questa cartella (`/frontend`).

Avviare l'applicazione web:

```bash
npm run dev
```

_Il terminale mostrerà un URL in `localhost` (es. `http://localhost:5713`). Cliccare sul link per aprire il gioco nel browser._
