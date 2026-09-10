const mongoose = require("mongoose");

const Transaction = require("../models/Transaction");
const Product = require("../models/Product");

const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .sort({ createdAt: -1 })
            .populate("product");

        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate("product");

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction id"
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const createTransaction = async (req, res) => {
    try {
        // Accept productId (preferred) or product for flexibility
        const productId = req.body.productId || req.body.product;
        const { type, quantity, note } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "productId is required"
            });
        }

        if (type !== "IN" && type !== "OUT") {
            return res.status(400).json({
                success: false,
                message: "Transaction type must be IN or OUT"
            });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a whole number greater than 0"
            });
        }

        let createdTransaction;
        let insufficientStock = false;
        let productMissing = false;

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                const product = await Product.findById(productId).session(session);

                if (!product) {
                    productMissing = true;
                    throw new Error("Product not found");
                }

                let newStock;

                if (type === "IN") {
                    newStock = product.quantityInStock + quantity;
                } else {
                    newStock = product.quantityInStock - quantity;

                    if (newStock < 0) {
                        insufficientStock = true;
                        throw new Error("Insufficient stock");
                    }
                }

                product.quantityInStock = newStock;
                await product.save({ session });

                const docs = await Transaction.create(
                    [
                        {
                            product: productId,
                            type,
                            quantity,
                            note
                        }
                    ],
                    { session }
                );

                createdTransaction = docs[0];
            });
        } finally {
            session.endSession();
        }

        if (productMissing) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (insufficientStock) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock"
            });
        }

        const transaction = await Transaction.findById(createdTransaction._id)
            .populate("product");

        res.status(201).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        if (error.message === "Product not found") {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (error.message === "Insufficient stock") {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock"
            });
        }

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid product id"
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    getTransactions,
    getTransactionById,
    createTransaction
};
