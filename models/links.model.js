// import { dbClient } from "../config/db-client.config.js";
// import { env } from "../config/env.config.js";
import mongoose, { mongo } from "mongoose";

// const db = dbClient.db(env.MONGODB_DB_NAME)

// const shortenerCollection = db.collection("url_shortener")

// export const loadLinks = async () => {
//   return await shortenerCollection.find().toArray();
// }

// export const addLink = async (link) => {
//   await shortenerCollection.insertOne(link)
// }

// export const getLink = async (shortCode) => {
//   return await shortenerCollection.findOne({ shortCode });
// }

const urlShortener = mongoose.Schema({
  id: { type: Number },
  url: { type: String },
  shortCode: {type: String}
}, { timestamps: true })

export const UrlShortener = mongoose.model("url_shortener", urlShortener)

export const loadLinks = async () => {
  return await UrlShortener.find();
};

export const addLink = async (link) => {
  await UrlShortener.create(link);
};

export const getLink = async (shortCode) => {
  return await UrlShortener.findOne({ shortCode });
};