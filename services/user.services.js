import { User } from "../models/users.model.js";

export const createUser = async (newUser) => {
  return await User.create(newUser);
};

export const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};

export const getUserById = async (userId) => {
  return await User.findById(userId);
};

export const getUserByResetPasswordToken = async (resetPasswordToken) => {
  return await User.findOne({resetPasswordToken});
};

export const getUserWithOAuthProvider = async (email) => {
  return await User.findOne({email}).populate("oauthUser");
};

export const pushShortenedUrl = async (userId, newShortUrlId) => {
  await User.findByIdAndUpdate(userId, {
    $push: { shortenedUrls: newShortUrlId },
  });
};

export const updateRefreshToken = async (userId, refreshToken = "") => {
  await User.findByIdAndUpdate(userId, {
    $set: { refreshToken },
  });
};

export const updateVerification = async (userId, verificationCode, isVerified=false) => {
  await User.findByIdAndUpdate(userId, {
    $set: { verificationCode, isVerified },
  });
};

export const updateUserProfile = async (userId, name, avatar) => {
  return await User.findByIdAndUpdate(userId, {
    $set: { name, avatar },
  });
};

export const updatePassword = async (userId, password) => {
  return await User.findByIdAndUpdate(userId, {
    $set: { password },
  });
};

export const deleteUser = async (userId) => {
  return await User.findByIdAndDelete(userId);
};
