# STOCKFLOW — Inventory & Operations

STOCKFLOW is a full-stack inventory and operations management system designed to manage products, categories, suppliers, stock levels, and inventory transactions in one place.

## Features

- Product management
- Category management
- Supplier management
- Stock IN and OUT transactions
- Automatic stock updates
- Low-stock and out-of-stock monitoring
- Inventory dashboard and insights
- Product image uploads using Cloudinary
- Search and filtering
- Product details pages
- Category-wise product viewing
- Light and dark theme
- Responsive interface

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Axios
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Mongoose

### Database
- MongoDB Atlas

### Cloud Services
- Cloudinary
- Netlify
- Render

## How It Works

The React frontend communicates with the Express backend using REST APIs.

The backend uses Mongoose to store and retrieve data from MongoDB Atlas.

When stock is added or removed, the product's stock quantity is updated and the movement is recorded as a transaction. The system also prevents stock from going below zero.

Product images are uploaded to Cloudinary, while the image URL and public ID are stored in MongoDB.

## Project Structure

```text
stockflow/
├── frontend/
└── backend/
```


Frontend:  
https://stockflow67.netlify.app

Backend API:  
https://stockflow-api-rh4r.onrender.com

## Purpose

This project was developed as a full-stack inventory management application for academic and practical use.



