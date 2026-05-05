FROM node:22-slim

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file dei pacchetti
COPY backend/package*.json ./

# Installa le dipendenze
RUN npm install --omit=dev

# Copia il resto del codice sorgente
COPY backend/ .

# Espone la porta su cui gira l'app (es. 3000)
EXPOSE 4000

# Comando per avviare l'applicazione
CMD ["npm", "start"]