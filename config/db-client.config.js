import {MongoClient} from "mongodb"
import { env } from "./env.config.js"

export const dbClient = new MongoClient(env.MONGODB_URI)


