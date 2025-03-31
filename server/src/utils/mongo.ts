import mongoose from "mongoose";
import { printLog } from "./date";

let cachedDB: null | typeof mongoose = null;
export const connectToDB = async (): Promise<void> => {
  try{
    if(cachedDB && mongoose.connection.readyState === 1){
      console.log("Connected to Cached MongoDB");
      return;
    }
    if(!process.env.MONGODB_URL) throw new Error("No DB URL defined");

    const db = await mongoose.connect(process.env.MONGODB_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    cachedDB = db;
    console.log("Connected to MongoDB");
  }
  catch(error){
    printLog(error, "MongoDB Connection");
  }
}