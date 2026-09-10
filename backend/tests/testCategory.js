require("dotenv").config();

const connectDB = require("../config/db");
const Category = require("../models/Category");

const test = async () => {
    await connectDB();

    const category = new Category({
        name: "Electronics",
        description: "Electronic products"
    });

    await category.save();

    console.log("Category saved:", category);
};

test();