import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dbState = [
  { value: 0, message: "Disconnected" },
  { value: 1, message: "Connected" },
  { value: 2, message: "Connecting" },
  { value: 3, message: "Disconnecting" },
];

const connection = async () => {
  const uri = process.env.MONGO_DB_URL;
  if (!uri) {
    throw new Error("MONGO_DB_URL is not defined");
  }
  await mongoose.connect(uri);
  const state = Number(mongoose.connection.readyState);
  console.log(`Database: ${dbState.find((db) => db.value === state).message}`);
};

export default connection;
