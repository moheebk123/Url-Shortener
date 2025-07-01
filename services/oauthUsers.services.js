import { OAuthUser } from "../models/oauthUsers.model.js";

export const createOAuthUser = async (newOAuthUser) => {
  return await OAuthUser.create(newOAuthUser);
};

export const linkOAuthUser = async (oauthUserId, updatedOAuthUser = {}) => {
  await OAuthUser.findByIdAndUpdate(oauthUserId, {
    $set: updatedOAuthUser,
  });
};

export const deleteOAuthUser = async (oauthUserId) => {
  return await OAuthUser.findByIdAndDelete(oauthUserId);
};
