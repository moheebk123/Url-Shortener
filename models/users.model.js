import mongoose from "mongoose";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email is already present"],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      unique: true,
    },
    shortenedUrls: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "url_shortener",
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("user", userSchema);

export const hashPassword = async (password) => {
  return await argon2.hash(password);
};

export const isPasswordCorrect = async (password, hashedPassword) => {
  return await argon2.verify(hashedPassword, password);
};

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1m"
  })
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

export const createUser = async (newUser) => {
  return await User.create(newUser);
};

export const getUser = async (email) => {
  return await User.findOne({ email });
};

export const getUserWithLinks = async (userId) => {
  return await User.findById(userId).populate("shortenedUrls");
};

export const pushShortenedUrl = async (userId, newShortUrlId) => {
  await User.findByIdAndUpdate(userId, {
    $push: { shortenedUrls: newShortUrlId },
  });
}
