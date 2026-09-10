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
// In production set FRONTEND_URL to the deployed frontend origin (the Netlify
// URL) to restrict CORS to that origin. When unset (local development) all
// origins are allowed so the Vite dev server works on whatever port it picks.
const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
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
