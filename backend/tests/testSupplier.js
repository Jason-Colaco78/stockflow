require("dotenv").config();

const connectDB = require("../config/db");
const Supplier = require("../models/Supplier");

const test = async () => {
  await connectDB();

  const supplier = new Supplier({
    name: "TechWorld Suppliers",
    contactName: "Rahul Sharma",
    email: "RAHUL@TECHWORLD.COM",
    phone: "9876543210",
    address: "Mumbai, Maharashtra",
  });

  await supplier.save();

  console.log("Supplier saved:", supplier);
};

test();

