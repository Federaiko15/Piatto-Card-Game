# Fase 1: Compilazione del progetto Vite/React
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Fase 2: Configurazione del server NGINX per servire i file
FROM nginx:alpine
# Copia i file compilati (la cartella dist) da Vite alla cartella html di NGINX
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]