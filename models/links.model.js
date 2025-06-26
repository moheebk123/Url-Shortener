import mongoose from "mongoose";

const urlShortener = mongoose.Schema(
  {
    url: { type: String },
    shortCode: { type: String }
  },
  { timestamps: true }
);

const UrlShortener = mongoose.model("url_shortener", urlShortener)

export const loadLinks = async () => {
  return await UrlShortener.find();
};

export const addLink = async (link) => {
  await UrlShortener.create(link);
};

export const getLink = async (shortCode) => {
  return await UrlShortener.findOne({ shortCode });
};