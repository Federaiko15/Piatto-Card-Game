import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  try {
    const authorization = req.headers["authorization"];
    if (!authorization) {
      return res.status(401).json({
        messagge: "You have to be logged in",
      });
    }
    // sappiamo la struttura della richiesta, cioè "Bearer" + stringa che definisce il token creato dal server e mandato al client per le successive comunicazioni
    const token = authorization.split(" ")[1];
    // verifichiamo la correttezza del token mandando un 401 se il token fosse scaduto
    jwt.verify(token, process.env.ACCESS_WEB_TOKEN, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ message: "Token scaduto" });
        }

        return res.status(403).json({ message: "Token non valido" });
      }
      // altrimenti se tutto va bene attacchiamo alla richiesta il payload del token, dove è presente l'id univoco dell'utente
      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(400).json({
      messagge: "Invalid or expired Token",
      error: error.messagge,
    });
  }
};

export default verifyToken;
