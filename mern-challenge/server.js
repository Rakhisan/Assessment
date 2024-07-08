const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const transactionRoutes = require("./routes/transactionRoutes");
const config = require("./config");

const app = express();

app.use(bodyParser.json());
app.use(cors());

mongoose
  .connect(config.mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use("/api", transactionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
