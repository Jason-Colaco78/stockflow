const Product = require("../models/Product");
const Category = require("../models/Category");
const Supplier = require("../models/Supplier");
const Transaction = require("../models/Transaction");

const getDashboard = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalCategories = await Category.countDocuments();
        const totalSuppliers = await Supplier.countDocuments();

        const stockAgg = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalUnitsInStock: { $sum: "$quantityInStock" }
                }
            }
        ]);

        const totalUnitsInStock =
            stockAgg.length > 0 ? stockAgg[0].totalUnitsInStock : 0;

        const outOfStockProducts = await Product.countDocuments({
            quantityInStock: 0
        });

        const lowStockProducts = await Product.countDocuments({
            $expr: {
                $and: [
                    { $gt: ["$quantityInStock", 0] },
                    { $lte: ["$quantityInStock", "$reorderLevel"] }
                ]
            }
        });

        const recentTransactions = await Transaction.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("product");

        res.json({
            success: true,
            data: {
                totalProducts,
                totalCategories,
                totalSuppliers,
                totalUnitsInStock,
                lowStockProducts,
                outOfStockProducts,
                recentTransactions
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    getDashboard
};
