import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Transactions from "./pages/Transactions.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import Categories from "./pages/Categories.jsx";

// Remount ProductDetails when the :id changes so its data refetches cleanly.
function ProductDetailsRoute() {
    const { id } = useParams();
    return <ProductDetails key={id} />;
}

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:id" element={<ProductDetailsRoute />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="categories" element={<Categories />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}
