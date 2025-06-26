// import {MongoClient} from "mongodb"
// import { env } from "./env.config.js"

// export const dbClient = new MongoClient(env.MONGODB_URI)

import mongoose from "mongoose"
import { env } from "./env.config.js"

export const connectDB = async () => {
  try {
    await mongoose.connect(`${env.MONGODB_URI}${env.MONGODB_DB_NAME}`);
    mongoose.set("debug", true);
  } catch (error) {
    console.error(error);
    process.exit();
  }
}