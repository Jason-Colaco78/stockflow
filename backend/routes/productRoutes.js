const express = require("express");

const {
    getProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    uploadProductImage
} = require("../controllers/productController");
const { uploadProductImage: parseProductImage } = require("../middleware/uploadImage");

const router = express.Router();

router.get("/", getProducts);
router.post("/", createProduct);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

// Upload / replace the product image (multipart/form-data, field name: "image").
router.post("/:id/image", parseProductImage, uploadProductImage);

module.exports = router;
