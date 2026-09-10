const Category = require("../models/Category");

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const category = await Category.create({
            name,
            description
        });

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.json({
            success: true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    getCategories,
    createCategory,
    getCategoryById,
    updateCategory,
    deleteCategory
};