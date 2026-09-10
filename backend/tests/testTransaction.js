require("dotenv").config();

const connectDB = require("../config/db");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");

const test = async () => {
    await connectDB();

    const product = await Product.findOne({ sku: "KB-1002" });

    console.log("Product:", product);

    const transaction = new Transaction({
        product: product._id,
        type: "IN",
        quantity: 10,
        note: "Received new stock"
    });

    await transaction.save();

    console.log("Transaction saved:", transaction);
};

test();