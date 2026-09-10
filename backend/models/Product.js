const mongoose=require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        sku: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },

        description: {
            type: String,
            trim: true
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: true
        },

        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },

        quantityInStock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        reorderLevel: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        }
    },
    {
        timestamps: true
    }
);


const Product = mongoose.model("Product", productSchema);

module.exports = Product;