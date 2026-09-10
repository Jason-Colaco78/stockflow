const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        type: {
            type: String,
            enum: ["IN", "OUT"],
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "Quantity must be a whole number"
            }
        },

        note: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;