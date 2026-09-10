require("dotenv").config();

const express=require("express");
const cors=require("cors");
const categoryRoutes = require("./routes/categoryRoutes");

const connectDB=require("./config/db")

const app=express();
const PORT = process.env.PORT || 7000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/categories", categoryRoutes);
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