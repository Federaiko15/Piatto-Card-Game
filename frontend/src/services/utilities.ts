import type { JwtPayload } from "../types/index.ts";

const getIdFromToken = (): string | null => {
  const token = localStorage.getItem("tokenPiatto");
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decodeJson = atob(payload); // decodifico in Base64 la parte del payload
    const finalPayload = JSON.parse(decodeJson) as JwtPayload;
    return finalPayload.userId;
  } catch (error) {
    console.error("Errore token", error);
    return null;
  }
};

export default getIdFromToken;
