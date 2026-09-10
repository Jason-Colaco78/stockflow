import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiError } from "../api";
import {
    ConfirmDialog,
    EmptyState,
    ErrorBlock,
    Modal,
    PageHeader,
    Spinner,
    StockBadge
} from "../components/ui.jsx";
import ProductForm from "../components/ProductForm.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { money, num } from "../utils/format.js";
import { stockStatus } from "../utils/stock.js";

const FILTERS = [
    { key: "all", label: "All" },
    { key: "normal", label: "Normal" },
    { key: "low", label: "Low" },
    { key: "out", label: "Out" }
];

export default function Products() {
    const toast = useToast();

    const { data, loading, error, reload } = useApiData(
        async () => {
            const [p, c] = await Promise.all([
                api.get("/products"),
                api.get("/categories")
            ]);
            return { products: p.data.data || [], categories: c.data.data || [] };
        },
        { errorMessage: "Failed to load products" }
    );
    const products = useMemo(() => data?.products ?? [], [data]);
    const categories = data?.categories ?? [];

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [status, setStatus] = useState("all");

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const load = () => reload();

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return products.filter((p) => {
            if (q && !`${p.name} ${p.sku} ${p.supplier?.name ?? ""}`.toLowerCase().includes(q))
                return false;
            if (category !== "all" && p.category?._id !== category) return false;
            if (status !== "all" && stockStatus(p.quantityInStock, p.reorderLevel) !== status)
                return false;
            return true;
        });
    }, [products, search, category, status]);

    const onSaved = () => {
        setFormOpen(false);
        setEditing(null);
        load();
    };

    const confirmDelete = async () => {
        setDeleteBusy(true);
        try {
            await api.delete(`/products/${deleting._id}`);
            toast.success(`Deleted “${deleting.name}”`);
            setDeleting(null);
            load();
        } catch (err) {
            toast.error(apiError(err, "Failed to delete product"));
        } finally {
            setDeleteBusy(false);
        }
    };

    return (
        <div>
            <PageHeader
                eyebrow="Inventory"
                title="Products"
                subtitle={`${num(products.length)} SKUs tracked across the warehouse.`}
                actions={
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                    >
                        + Add Product
                    </button>
                }
            />

            <div className="glass mb-5 flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center">
                <input
                    className="field lg:max-w-xs"
                    placeholder="Search name, SKU, supplier…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="field lg:max-w-[12rem]"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="all">All categories</option>
                    {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>
                <div className="flex gap-1.5">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setStatus(f.key)}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                status === f.key
                                    ? "bg-iris-500/25 text-white"
                                    : "bg-white/5 text-[#9c92b8] hover:text-white"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <Spinner label="Loading inventory" />
            ) : error ? (
                <ErrorBlock message={error} onRetry={load} />
            ) : products.length === 0 ? (
                <EmptyState
                    title="No products yet"
                    hint="Add your first SKU to start tracking stock levels and movement."
                    action={
                        <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
                            + Add Product
                        </button>
                    }
                />
            ) : filtered.length === 0 ? (
                <EmptyState title="No matches" hint="Try a different search or filter." />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((p) => (
                        <ProductCard
                            key={p._id}
                            product={p}
                            onEdit={() => {
                                setEditing(p);
                                setFormOpen(true);
                            }}
                            onDelete={() => setDeleting(p)}
                        />
                    ))}
                </div>
            )}

            <Modal
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditing(null);
                }}
                title={editing ? "Edit Product" : "New Product"}
                wide
            >
                <ProductForm
                    key={editing?._id || "new"}
                    initial={editing}
                    onSaved={onSaved}
                    onCancel={() => {
                        setFormOpen(false);
                        setEditing(null);
                    }}
                />
            </Modal>

            <ConfirmDialog
                open={Boolean(deleting)}
                title="Delete product"
                message={`Permanently delete “${deleting?.name}” (${deleting?.sku})? This cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleting(null)}
                busy={deleteBusy}
            />
        </div>
    );
}

function ProductCard({ product, onEdit, onDelete }) {
    return (
        <div className="glass glass-hover flex flex-col rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            loading="lazy"
                            className="h-12 w-12 shrink-0 rounded-lg border border-iris-400/15 object-cover"
                        />
                    ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-iris-400/20 text-[9px] text-[#7c7396]">
                            No image
                        </div>
                    )}
                    <div className="min-w-0">
                        <Link
                            to={`/products/${product._id}`}
                            className="block truncate text-base font-semibold text-white hover:text-iris-300"
                        >
                            {product.name}
                        </Link>
                        <p className="mono-tag mt-0.5 text-xs uppercase tracking-widest text-iris-400">
                            {product.sku}
                        </p>
                    </div>
                </div>
                <StockBadge quantity={product.quantityInStock} reorderLevel={product.reorderLevel} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Meta label="Category" value={product.category?.name || "—"} />
                <Meta label="Supplier" value={product.supplier?.name || "—"} />
                <Meta label="Unit Price" value={money(product.unitPrice)} />
                <Meta label="Reorder At" value={num(product.reorderLevel)} />
            </div>

            <div className="mt-4 flex items-end justify-between border-t border-iris-400/10 pt-4">
                <div>
                    <p className="mono-tag text-[11px] uppercase tracking-widest text-[#7c7396]">On hand</p>
                    <p className="text-2xl font-bold text-white">{num(product.quantityInStock)}</p>
                </div>
                <div className="flex gap-1.5">
                    <Link to={`/products/${product._id}`} className="btn btn-ghost px-3 py-1.5 text-xs">
                        Details
                    </Link>
                    <button className="btn btn-ghost px-3 py-1.5 text-xs" onClick={onEdit}>
                        Edit
                    </button>
                    <button className="btn btn-danger px-3 py-1.5 text-xs" onClick={onDelete}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

function Meta({ label, value }) {
    return (
        <div>
            <p className="mono-tag text-[11px] uppercase tracking-widest text-[#7c7396]">{label}</p>
            <p className="truncate text-[#d7cdf5]">{value}</p>
        </div>
    );
}
