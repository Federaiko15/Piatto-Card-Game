import jwt from "jsonwebtoken";

export const createAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.ACCESS_WEB_TOKEN, {
    expiresIn: "15m",
  });
};

export const createRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_WEB_TOKEN, {
    expiresIn: "1d",
  });
};
