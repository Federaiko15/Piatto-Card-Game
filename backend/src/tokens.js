import jwt from "jsonwebtoken";
// tramite la funzione sign della libreria jsonwebetoken firmo il jwt tramite l'id dell'utente che si è appena loggato.
// questo mi permette di poter verificare la correttezza della richiesta
export const createAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.ACCESS_WEB_TOKEN, {
    expiresIn: "10m",
  });
};

export const createRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_WEB_TOKEN, {
    expiresIn: "7d",
  });
};
