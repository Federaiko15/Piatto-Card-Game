import jwt from "jsonwebtoken";

const verifySocketToken = (socket, next) => {
  try {
    // Cerco il token dove lo invia react (dentro l'oggetto auth)
    // Tengo anche l'opzione in cui viene mandato negli headers
    const token =
      socket.handshake.auth.token || socket.handshake.headers["authorization"];

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // se invece è stato inviato "Bearer eyJhb...", divido la stringa per prendere solo il codice
    // Se invece da React invio solo "eyJhb...", allora non serve fare lo split.
    // Con questo codice gestisco entrambi i casi in sicurezza:
    const tokenString = token.startsWith("Bearer ")
      ? token.split(" ")[1]
      : token;

    const verified = jwt.verify(tokenString, process.env.ACCESS_WEB_TOKEN);

    socket.user = verified;
    next();
  } catch (error) {
    console.log("Socket Auth Error:", error.message);
    return next(new Error("Invalid or expired token"));
  }
};

export default verifySocketToken;
