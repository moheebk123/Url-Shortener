import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import * as utils from "../utils/index.utils.js";

export const handleOAuthRedirect = async (req, res) => {
  if (req.user) {
    req.flash("errors", "You have already logged in");
    return res.redirect("/");
  }
  try {
    const { provider } = req.params;
    const state = generateState();
    const codeVerifier = provider === "google" ? generateCodeVerifier() : null;
    const cookieConfig = {
      httpOnly: true,
      secure: true,
      maxAge: 10 * 60 * 1000,
      sameSite: "lax",
    };

    let url;
    if (provider === "google") {
      url = utils.google.createAuthorizationURL(state, codeVerifier, [
        "openid",
        "profile",
        "email",
      ]);

      return res
        .cookie("google_oauth_state", state, cookieConfig)
        .cookie("google_code_verifier", codeVerifier, cookieConfig)
        .redirect(url.toString());
    } else if (provider === "github") {
      url = utils.github.createAuthorizationURL(state, ["user:email"]);

      return res
        .cookie("github_oauth_state", state, cookieConfig)
        .redirect(url.toString());
    } else {
      return res.render("error", { message: "Social Login Not Found" });
    }
  } catch (error) {
    console.log(error);
    req.flash(
      "errors",
      "Failed to redirect social login page. Please try again!"
    );
    return res.redirect("/auth/login");
  }
};

export const handleOAuthCallback = async (req, res) => {
  const { params, query, cookies } = req;
  const { code, state } = query;
  const { provider } = params;
  let storedState, codeVerifier;

  if (provider === "google") {
    storedState = cookies.google_oauth_state;
    codeVerifier = cookies.google_code_verifier;
  } else if (provider === "github") {
    storedState = cookies.github_oauth_state;
  }

  if (!code || !state || !storedState || state !== storedState) {
    if (provider === "github") {
      req.flash(
        "errors",
        "Couldn't login with Github because of invalid login attempt. Please try again!"
      );
      res.redirect("/auth/login");
    }
    if (provider === "google" || !codeVerifier) {
      req.flash(
        "errors",
        "Couldn't login with Google because of invalid login attempt. Please try again!"
      );
      res.redirect("/auth/login");
    }
  }

  let tokens;
  try {
    let socialAccount = {};

    if (provider === "google") {
      tokens = await utils.google.validateAuthorizationCode(code, codeVerifier);
      const claims = decodeIdToken(tokens.idToken());
      const {
        sub: userId,
        name,
        email,
        email_verified: isVerified,
        picture: avatar,
      } = claims;
      socialAccount = {
        userId,
        name,
        email,
        isVerified,
        avatar,
      };
    } else if (provider === "github") {
      tokens = await utils.github.validateAuthorizationCode(code);
      const githubUserResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      });

      if (!githubUserResponse.ok) throw new Error();
      const githubUser = await githubUserResponse.json();
      const { id: userId, name, avatar_url: avatar } = githubUser;

      const githubEmailResponse = await fetch(
        "https://api.github.com/user/emails",
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken()}`,
          },
        }
      );

      if (!githubEmailResponse.ok) throw new Error();
      const emails = await githubEmailResponse.json();
      const primaryEmail = emails.filter((e) => e.primary)[0];
      if (!primaryEmail) throw new Error();

      socialAccount = {
        userId,
        name,
        email: primaryEmail.email,
        isVerified: primaryEmail.verified,
        avatar,
      };
    }

    const user = await services.getUserWithOAuthProvider(socialAccount.email);

    if (user) {
      await services.linkOAuthUser(user.oauthUser._id, {
        provider,
        providerAccountId: socialAccount.userId,
      });

      const accessToken = services.generateToken(
        {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        process.env.JWT_SECRET,
        "1m"
      );

      const refreshToken = services.generateToken(
        {
          id: user._id,
        },
        process.env.JWT_REFRESH_SECRET,
        "7d"
      );

      user.refreshToken = refreshToken;
      user.isVerified = socialAccount.isVerified;
      user.oauthAvatar = socialAccount.avatar;
      user.save({ validateBeforeSave: false });

      req.flash(
        "successes",
        `${provider === "google" ? "Google" : "Github"} login successfully.`
      );
      return res
        .cookie("access_token", accessToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          maxAge: 15 * 60 * 1000, // 1 min
        })
        .cookie("refresh_token", refreshToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .redirect("/user/profile");
    } else {
      const oauthUser = await services.createOAuthUser({
        provider,
        providerAccountId: socialAccount.userId,
      });

      const newUser = await services.createUser({
        name: socialAccount.name,
        email: socialAccount.email,
        oauthAvatar: socialAccount.avatar,
        refreshToken: "",
        resetPasswordToken: "",
        isVerified: socialAccount.isVerified,
        verificationCode: "",
        oauthUser: oauthUser._id,
      });

      const accessToken = services.generateToken(
        {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
        },
        process.env.JWT_SECRET,
        "1m"
      );

      const refreshToken = services.generateToken(
        {
          id: newUser._id,
        },
        process.env.JWT_REFRESH_SECRET,
        "7d"
      );

      newUser.refreshToken = refreshToken;
      newUser.save({ validateBeforeSave: false });

      req.flash(
        "successes",
        `${provider === "google" ? "Google" : "Github"} login successfully.`
      );
      return res
        .cookie("access_token", accessToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          maxAge: 15 * 60 * 1000, // 1 min
        })
        .cookie("refresh_token", refreshToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .redirect("/user/profile");
    }
  } catch (error) {
    console.log(error);

    req.flash(
      "errors",
      "Couldn't login through social account because of invalid login attempt. Please try again!"
    );
    res.redirect("/auth/login");
  }
};
