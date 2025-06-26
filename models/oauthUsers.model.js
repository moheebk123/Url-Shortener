import mongoose from "mongoose";

const oauthUserSchema = mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      enum: ["google", "github", "internal"],
    },
    providerAccountId: {
      type: String,
      default: "internal",
      required: true,
      maxLength: 255,
    },
  },
  { timestamps: true }
);

export const OAuthUser = mongoose.model("oauth_user", oauthUserSchema);
