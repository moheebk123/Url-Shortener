import mongoose from "mongoose";

const urlShortener = mongoose.Schema(
  {
    url: { type: String },
    shortCode: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

export const UrlShortener = mongoose.model("url_shortener", urlShortener);
