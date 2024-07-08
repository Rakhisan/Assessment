const mongoose = require("mongoose");
const initData = require("./data.js");
const Transaction = require("../models/Transaction.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/Assessment";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Transaction.deleteMany({});

  //
  // initData.data = initData.data.map((obj) => ({
  //   ...obj,
  //   owner: "65fbc1dc8ee2ccda05f7194e",
  //}));
  //

  await Transaction.insertMany(initData.data);
  console.log("data was initialized");
};

initDB();
