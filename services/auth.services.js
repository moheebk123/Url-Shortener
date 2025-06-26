import argon2 from "argon2";
import jwt from "jsonwebtoken";

export const hashPassword = async (password) => {
  return await argon2.hash(password);
};

export const isPasswordCorrect = async (password, hashedPassword) => {
  return await argon2.verify(hashedPassword, password);
};

export const generateToken = (payload, secret = process.env.JWT_SECRET, expiresIn) => {
  return jwt.sign(payload, secret, {
    expiresIn,
  });
};

export const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  return jwt.verify(token, secret);
};