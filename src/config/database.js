require("dotenv").config();
const mongoose = require("mongoose");
const dbState = [
  {
    value: 0,
    message: "Disconnected",
  },
  {
    value: 1,
    message: "Connected",
  },
  {
    value: 2,
    message: "Connecting",
  },
  {
    value: 3,
    message: "Disconnecting",
  },
];
const connection = async () => {
  await mongoose
    .connect(process.env.MONGO_DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000,
    })
    .catch((error) => {
      console.log("Error connecting database: ", error);
    });
  const state = Number(mongoose.connection.readyState);
  console.log(`Database: ${dbState.find((db) => db.value === state).message}`);
};
module.exports = connection;
