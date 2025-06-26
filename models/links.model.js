import { dbClient } from "../config/db-client.config.js";
import { env } from "../config/env.config.js";

const db = dbClient.db(env.MONGODB_DB_NAME)

const shortenerCollection = db.collection("url_shortener")

export const loadLinks = async () => {
  return await shortenerCollection.find().toArray();
}

export const addLink = async (link) => {
  await shortenerCollection.insertOne(link)
}

export const getLink = async (shortCode) => {
  return await shortenerCollection.findOne({ shortCode });
}
