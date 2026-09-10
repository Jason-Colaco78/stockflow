const Product = require("../models/Product");

const getProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate("category")
            .populate("supplier");

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const createProduct = async (req, res) => {
    try {
        const {
            name,
            sku,
            description,
            category,
            supplier,
            unitPrice,
            quantityInStock,
            reorderLevel
        } = req.body;

        let product = await Product.create({
            name,
            sku,
            description,
            category,
            supplier,
            unitPrice,
            quantityInStock,
            reorderLevel
        });

        product = await product.populate("category");
        product = await product.populate("supplier");

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Product with this SKU already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid category or supplier id"
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate("category")
            .populate("supplier");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
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
const updateProduct = async (req, res) => {
    try {
        const {
            name,
            sku,
            description,
            category,
            supplier,
            unitPrice,
            reorderLevel
        } = req.body;

        // quantityInStock is intentionally NOT updated here.
        // Stock quantity must only change through POST /api/transactions.
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name,
                sku,
                description,
                category,
                supplier,
                unitPrice,
                reorderLevel
            },
            {
                new: true,
                runValidators: true
            }
        )
            .populate("category")
            .populate("supplier");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Product with this SKU already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid id in request"
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
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
    getProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct
};
