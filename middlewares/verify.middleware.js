import { generateToken, verifyToken } from "../services/auth.services.js";
import { getUserById } from "../services/user.services.js";

export const verifyAuthentication = async (req, res, next) => {
  const { access_token, refresh_token } = req.cookies;
  if (!access_token && !refresh_token) {
    req.user = null;
    return next();
  }

  try {
    const decodedAccessToken = verifyToken(access_token);
    req.user = decodedAccessToken;

    return next();
  } catch (error) {
    if (refresh_token) {
      try {
        const decodedRefreshToken = verifyToken(
          refresh_token,
          process.env.JWT_REFRESH_SECRET
        );

        const loggedUser = await getUserById(decodedRefreshToken.id);

        if (loggedUser) {
          const newAccessToken = generateToken(
            {
              id: loggedUser.id,
              name: loggedUser.name,
              email: loggedUser.email,
            },
            process.env.JWT_SECRET,
            "1m"
          );

          req.user = loggedUser;
          res.cookie("access_token", newAccessToken, {
            httpOnly: true,
            sameSite: "Strict",
            secure: false,
          });
          return next();
        }
      } catch (error) {
        req.user = null;
        return next();
      }
    }
    req.user = null;
    return next();
  }
};
