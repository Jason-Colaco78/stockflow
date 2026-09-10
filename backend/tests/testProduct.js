require("dotenv").config();

const connectDB = require("../config/db");
const Category = require("../models/Category");
const Supplier = require("../models/Supplier");
const Product = require("../models/Product");

const test = async () => {
  await connectDB();

  const category = await Category.findOne({ name: "Electronics" });
  const supplier = await Supplier.findOne({ name: "TechWorld Suppliers" });

  console.log("Category:", category);
  console.log("Supplier:", supplier);

  const product = new Product({
    name: "Wireless Keyboard",
    sku: "KB-1002",
    description: "Wireless keyboard for office use",
    category: category._id,
    supplier: supplier._id,
    unitPrice: 1200,
    quantityInStock: 25,
    reorderLevel: 5,
  });

  await product.save();

  console.log("Product saved:", product);

  const savedProduct = await Product.findOne({ sku: "KB-1002" })
    .populate("category")
    .populate("supplier");

  console.log("Populated Product:", savedProduct);
};

test();
