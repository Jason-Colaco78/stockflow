const Supplier = require("../models/Supplier");

const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find();

        res.json({
            success: true,
            data: suppliers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const createSupplier = async (req, res) => {
    try {
        const { name, contactName, email, phone, address } = req.body;

        const supplier = await Supplier.create({
            name,
            contactName,
            email,
            phone,
            address
        });

        res.status(201).json({
            success: true,
            data: supplier
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Supplier with this name already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }

        res.json({
            success: true,
            data: supplier
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid supplier id"
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const updateSupplier = async (req, res) => {
    try {
        const { name, contactName, email, phone, address } = req.body;

        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            {
                name,
                contactName,
                email,
                phone,
                address
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }

        res.json({
            success: true,
            data: supplier
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Supplier with this name already exists"
            });
        }

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid supplier id"
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }

        res.json({
            success: true,
            message: "Supplier deleted successfully"
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid supplier id"
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    getSuppliers,
    createSupplier,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};
