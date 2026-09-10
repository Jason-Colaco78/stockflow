const multer = require("multer");

// Accepted image formats for product images.
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Reasonable upload ceiling for a product image.
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

// Keep the file in memory so we can stream the buffer straight to Cloudinary
// without touching the local disk.
const multerUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_BYTES },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
            return;
        }
        const err = new Error("INVALID_FILE_TYPE");
        err.code = "INVALID_FILE_TYPE";
        cb(err);
    }
});

// Wrap multer's single-file handler so multer errors become clean JSON responses
// instead of bubbling up as unhandled 500s. Field name: "image".
const uploadProductImage = (req, res, next) => {
    multerUpload.single("image")(req, res, (err) => {
        if (!err) {
            next();
            return;
        }

        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                success: false,
                message: "Image is too large. Maximum allowed size is 2 MB."
            });
        }

        if (err.code === "INVALID_FILE_TYPE") {
            return res.status(415).json({
                success: false,
                message: "Unsupported file type. Upload a JPEG, PNG, or WEBP image."
            });
        }

        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
                success: false,
                message: "Unexpected file field. Use the \"image\" field for the upload."
            });
        }

        return res.status(400).json({
            success: false,
            message: err.message || "Image upload failed"
        });
    });
};

module.exports = {
    uploadProductImage,
    ALLOWED_MIME_TYPES,
    MAX_IMAGE_BYTES
};
