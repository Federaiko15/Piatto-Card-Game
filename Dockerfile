FROM node:22-slim

# Imposta la directory di lavoro
WORKDIR /app

# Compila game-core (le regole del gioco), da cui dipende il backend; poi togliamo i pacchetti usati solo per compilare
COPY packages/game-core/ packages/game-core/
RUN cd packages/game-core && npm install && npm run build && npm prune --omit=dev

# Copia i file dei pacchetti del backend e installa le dipendenze
COPY backend/package*.json backend/
RUN cd backend && npm install --omit=dev

# Copia il resto del codice sorgente
COPY backend/ backend/
WORKDIR /app/backend

# Espone la porta su cui gira l'app (es. 3000)
EXPOSE 4000

# Comando per avviare l'applicazione
CMD ["npm", "start"]
