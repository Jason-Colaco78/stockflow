const express = require("express");

const {
    getTransactions,
    getTransactionById,
    createTransaction
} = require("../controllers/transactionController");

const router = express.Router();

router.get("/", getTransactions);
router.post("/", createTransaction);
router.get("/:id", getTransactionById);

module.exports = router;
