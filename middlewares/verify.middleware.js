import { verifyToken } from "../models/users.model.js";

export const verifyAuthentication = async (req, _, next) => {
  try {
    const { access_token } = req.cookies
    if (!access_token) {
      req.user = null;

      return next();
    }

    const decodedToken = verifyToken(access_token)
    req.user = decodedToken;

    return next();
  } catch (error) {
    req.user = null;
  }
}