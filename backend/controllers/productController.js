const Product = require("../models/Product");
const { cloudinary, isConfigured } = require("../config/cloudinary");

const CLOUDINARY_FOLDER = "stockflow/products";

// Stream an in-memory file buffer straight to Cloudinary.
const uploadBufferToCloudinary = (buffer) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: CLOUDINARY_FOLDER, resource_type: "image" },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            }
        );
        stream.end(buffer);
    });

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
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Best-effort cleanup of the Cloudinary asset before removing the product.
        // A failed image delete must not block the product delete.
        if (product.imagePublicId && isConfigured) {
            try {
                await cloudinary.uploader.destroy(product.imagePublicId);
            } catch (cloudinaryError) {
                console.error(
                    "Cloudinary asset delete failed for",
                    product.imagePublicId,
                    cloudinaryError.message
                );
            }
        }

        await product.deleteOne();

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
// Upload or replace a single product image.
// Expects a multipart/form-data request with an "image" file field.
const uploadProductImage = async (req, res) => {
    try {
        if (!isConfigured) {
            return res.status(500).json({
                success: false,
                message: "Image uploads are not configured on the server"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file received. Attach a file in the \"image\" field."
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        let result;
        try {
            result = await uploadBufferToCloudinary(req.file.buffer);
        } catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError.message);
            return res.status(502).json({
                success: false,
                message: "Image upload to Cloudinary failed. Please try again."
            });
        }

        const previousPublicId = product.imagePublicId;

        // Stock/transaction fields are untouched here — only image fields change.
        product.imageUrl = result.secure_url;
        product.imagePublicId = result.public_id;
        await product.save();

        // Remove the old asset only after the replacement is safely persisted.
        if (previousPublicId && previousPublicId !== result.public_id) {
            try {
                await cloudinary.uploader.destroy(previousPublicId);
            } catch (destroyError) {
                console.error(
                    "Cloudinary old-asset delete failed for",
                    previousPublicId,
                    destroyError.message
                );
            }
        }

        const populated = await Product.findById(product._id)
            .populate("category")
            .populate("supplier");

        res.json({
            success: true,
            data: populated
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
    deleteProduct,
    uploadProductImage
};
