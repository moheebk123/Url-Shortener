import mongoose from "mongoose";

const urlShortener = mongoose.Schema(
  {
    url: { type: String },
    shortCode: { type: String },
    redirectionCount: { type: Number, min: 0, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

export const UrlShortener = mongoose.model("url_shortener", urlShortener);
