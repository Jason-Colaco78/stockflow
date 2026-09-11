import { useMemo, useState } from "react";
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
import CategoryForm from "../components/CategoryForm.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { money, num } from "../utils/format.js";

// Some deployments annotate categories with a product count; render it only when present.
function productCount(category) {
    const value = category?.productCount ?? category?.productsCount;
    return typeof value === "number" ? value : null;
}

export default function Categories() {
    const toast = useToast();

    const { data, loading, error, reload } = useApiData(
        async () => (await api.get("/categories")).data.data || [],
        { errorMessage: "Failed to load categories" }
    );
    const categories = useMemo(() => data ?? [], [data]);
    const load = () => reload();

    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const [viewing, setViewing] = useState(null);
    const [viewProducts, setViewProducts] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewError, setViewError] = useState("");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter((c) =>
            `${c.name} ${c.description ?? ""}`.toLowerCase().includes(q)
        );
    }, [categories, search]);

    const onSaved = () => {
        setFormOpen(false);
        setEditing(null);
        load();
    };

    const openView = async (category) => {
        setViewing(category);
        setViewProducts(null);
        setViewError("");
        setViewLoading(true);
        try {
            const all = (await api.get("/products")).data.data || [];
            setViewProducts(all.filter((p) => p.category?._id === category._id));
        } catch (err) {
            setViewError(apiError(err, "Failed to load products"));
        } finally {
            setViewLoading(false);
        }
    };

    const confirmDelete = async () => {
        setDeleteBusy(true);
        try {
            await api.delete(`/categories/${deleting._id}`);
            toast.success(`Deleted “${deleting.name}”`);
            setDeleting(null);
            load();
        } catch (err) {
            toast.error(apiError(err, "Failed to delete category"));
        } finally {
            setDeleteBusy(false);
        }
    };

    return (
        <div>
            <PageHeader
                eyebrow="Catalog"
                title="Categories"
                subtitle={`${num(categories.length)} categories in the catalog.`}
                actions={
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                    >
                        + Add Category
                    </button>
                }
            />

            <div className="glass mb-5 rounded-2xl p-4">
                <input
                    className="field sm:max-w-xs"
                    placeholder="Search name, description…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <Spinner label="Loading categories" />
            ) : error ? (
                <ErrorBlock message={error} onRetry={load} />
            ) : categories.length === 0 ? (
                <EmptyState
                    title="No categories yet"
                    hint="Add categories so you can group and classify products."
                    action={
                        <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
                            + Add Category
                        </button>
                    }
                />
            ) : filtered.length === 0 ? (
                <EmptyState title="No matches" hint="Try a different search." />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((c) => {
                        const count = productCount(c);
                        return (
                            <div key={c._id} className="glass glass-hover flex flex-col rounded-2xl p-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-iris-500/20 text-sm font-bold text-iris-300">
                                        {c.name?.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold text-white">{c.name}</p>
                                        {count !== null && (
                                            <p className="truncate text-xs text-[#9c92b8]">
                                                {num(count)} product{count === 1 ? "" : "s"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-4 line-clamp-3 text-sm text-[#d7cdf5]">
                                    {c.description || "No description"}
                                </p>
                                <div className="mt-4 flex gap-1.5 border-t border-iris-400/10 pt-4">
                                    <button
                                        className="btn btn-ghost border-iris-400/40 px-3 py-1.5 text-xs text-iris-300"
                                        onClick={() => openView(c)}
                                    >
                                        View
                                    </button>
                                    <button
                                        className="btn btn-ghost px-3 py-1.5 text-xs"
                                        onClick={() => {
                                            setEditing(c);
                                            setFormOpen(true);
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-danger px-3 py-1.5 text-xs"
                                        onClick={() => setDeleting(c)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditing(null);
                }}
                title={editing ? "Edit Category" : "New Category"}
            >
                <CategoryForm
                    key={editing?._id || "new"}
                    initial={editing}
                    onSaved={onSaved}
                    onCancel={() => {
                        setFormOpen(false);
                        setEditing(null);
                    }}
                />
            </Modal>

            <Modal
                open={Boolean(viewing)}
                onClose={() => setViewing(null)}
                title={viewing ? `${viewing.name} — Products` : ""}
                wide
            >
                {viewing && (
                    <div className="space-y-4">
                        <div className="border-b border-iris-400/10 pb-3">
                            <p className="text-sm text-[#d7cdf5]">{viewing.description || "No description"}</p>
                            {!viewLoading && !viewError && (
                                <p className="mt-2 text-xs uppercase tracking-widest text-[#7c7396]">
                                    {num(viewProducts?.length ?? 0)} product
                                    {(viewProducts?.length ?? 0) === 1 ? "" : "s"} in this category
                                </p>
                            )}
                        </div>

                        {viewLoading ? (
                            <Spinner label="Loading products" />
                        ) : viewError ? (
                            <ErrorBlock message={viewError} onRetry={() => openView(viewing)} />
                        ) : viewProducts.length === 0 ? (
                            <EmptyState title="No products in this category yet." />
                        ) : (
                            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                                {viewProducts.map((p) => (
                                    <div
                                        key={p._id}
                                        className="flex flex-col gap-3 rounded-xl border border-iris-400/10 bg-void/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                                            <p className="mono-tag mt-0.5 text-xs uppercase tracking-widest text-iris-400">
                                                {p.sku}
                                            </p>
                                            <p className="mt-1 truncate text-xs text-[#9c92b8]">
                                                Supplier: {p.supplier?.name || "—"}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                                            <StockBadge quantity={p.quantityInStock} reorderLevel={p.reorderLevel} />
                                            <p className="text-xs text-[#d7cdf5]">
                                                {num(p.quantityInStock)} on hand · {money(p.unitPrice)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <ConfirmDialog
                open={Boolean(deleting)}
                title="Delete category"
                message={`Permanently delete “${deleting?.name}”? Products linked to this category will keep the reference but lose its details.`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleting(null)}
                busy={deleteBusy}
            />
        </div>
    );
}
