const axios = require("axios");
const Transaction = require("../models/Transaction");

const DATA_SOURCE_URL =
  "https://s3.amazonaws.com/roxiler.com/product_transaction.json";

exports.initializeDatabase = async (req, res) => {
  try {
    const response = await axios.get(DATA_SOURCE_URL);
    await Transaction.insertMany(response.data);
    res.status(200).send("Database initialized successfully.");
  } catch (error) {
    res.status(500).send("Error initializing database.");
  }
};

exports.getTransactions = async (req, res) => {
  const { month, page = 1, perPage = 10, search = "" } = req.query;
  const regex = new RegExp(search, "i");
  const transactions = await Transaction.find({
    dateOfSale: { $regex: new RegExp(`-${month}-`, "i") },
    $or: [{ title: regex }, { description: regex }, { price: regex }],
  })
    .skip((page - 1) * perPage)
    .limit(parseInt(perPage));
  res.json(transactions);
};

exports.getStatistics = async (req, res) => {
  const { month } = req.query;
  const transactions = await Transaction.find({
    dateOfSale: { $regex: new RegExp(`-${month}-`, "i") },
  });

  const totalSaleAmount = transactions.reduce(
    (acc, transaction) => acc + transaction.price,
    0
  );
  const totalSoldItems = transactions.filter(
    (transaction) => transaction.sold
  ).length;
  const totalNotSoldItems = transactions.filter(
    (transaction) => !transaction.sold
  ).length;

  res.json({ totalSaleAmount, totalSoldItems, totalNotSoldItems });
};

exports.getBarChart = async (req, res) => {
  const { month } = req.query;
  const transactions = await Transaction.find({
    dateOfSale: { $regex: new RegExp(`-${month}-`, "i") },
  });

  const priceRanges = [
    { range: "0-100", count: 0 },
    { range: "101-200", count: 0 },
    { range: "201-300", count: 0 },
    { range: "301-400", count: 0 },
    { range: "401-500", count: 0 },
    { range: "501-600", count: 0 },
    { range: "601-700", count: 0 },
    { range: "701-800", count: 0 },
    { range: "801-900", count: 0 },
    { range: "901-above", count: 0 },
  ];

  transactions.forEach((transaction) => {
    const price = transaction.price;
    if (price <= 100) priceRanges[0].count++;
    else if (price <= 200) priceRanges[1].count++;
    else if (price <= 300) priceRanges[2].count++;
    else if (price <= 400) priceRanges[3].count++;
    else if (price <= 500) priceRanges[4].count++;
    else if (price <= 600) priceRanges[5].count++;
    else if (price <= 700) priceRanges[6].count++;
    else if (price <= 800) priceRanges[7].count++;
    else if (price <= 900) priceRanges[8].count++;
    else priceRanges[9].count++;
  });

  res.json(priceRanges);
};

exports.getPieChart = async (req, res) => {
  const { month } = req.query;
  const transactions = await Transaction.find({
    dateOfSale: { $regex: new RegExp(`-${month}-`, "i") },
  });

  const categories = {};

  transactions.forEach((transaction) => {
    if (categories[transaction.category]) {
      categories[transaction.category]++;
    } else {
      categories[transaction.category] = 1;
    }
  });

  const pieChart = Object.keys(categories).map((category) => ({
    category,
    count: categories[category],
  }));

  res.json(pieChart);
};

exports.getCombinedData = async (req, res) => {
  const { month } = req.query;

  const [transactions, statistics, barChart, pieChart] = await Promise.all([
    Transaction.find({
      dateOfSale: { $regex: new RegExp(`-${month}-`, "i") },
    }),
    Transaction.aggregate([
      { $match: { dateOfSale: { $regex: new RegExp(`-${month}-`, "i") } } },
      {
        $group: {
          _id: null,
          totalSaleAmount: { $sum: "$price" },
          totalSoldItems: { $sum: { $cond: ["$sold", 1, 0] } },
          totalNotSoldItems: { $sum: { $cond: ["$sold", 0, 1] } },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { dateOfSale: { $regex: new RegExp(`-${month}-`, "i") } } },
      {
        $bucket: {
          groupBy: "$price",
          boundaries: [0, 101, 201, 301, 401, 501, 601, 701, 801, 901],
          default: "901-above",
          output: { count: { $sum: 1 } },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { dateOfSale: { $regex: new RegExp(`-${month}-`, "i") } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);

  res.json({ transactions, statistics, barChart, pieChart });
};
