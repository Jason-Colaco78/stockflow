require("dotenv").config();

const express=require("express");
const cors=require("cors");
const categoryRoutes = require("./routes/categoryRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const productRoutes = require("./routes/productRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const connectDB=require("./config/db")

const app=express();
const PORT = process.env.PORT || 7000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/products", productRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
connectDB();

app.get("/api/health",(req,res)=>{
    res.json({
        success:true,
        message: "StockFlow API is running"
    })

})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
