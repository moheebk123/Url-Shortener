import mongoose from "mongoose";

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
      default: undefined,
    },
    oauthAvatar: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    refreshToken: String,
    resetPasswordToken: String,
    isVerified: Boolean,
    verificationCode: {
      type: String,
      maxLength: 8,
    },
    shortenedUrls: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "url_shortener",
      },
    ],
    oauthUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "oauth_user",
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("user", userSchema);
