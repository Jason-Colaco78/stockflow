import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { apiError } from "../api";
import { ErrorBlock, Spinner, StockBadge } from "../components/ui.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { dateTime, money, num, relativeTime } from "../utils/format.js";
import { stockStatus } from "../utils/stock.js";

export default function ProductDetails() {
    const { id } = useParams();
    const toast = useToast();

    const { data, loading, error, reload } = useApiData(
        async () => {
            const [p, t] = await Promise.all([
                api.get(`/products/${id}`),
                api.get("/transactions")
            ]);
            return {
                product: p.data.data,
                transactions: (t.data.data || []).filter(
                    (tx) => tx.product?._id === id
                )
            };
        },
        { errorMessage: "Failed to load product" }
    );
    const load = () => reload();
    const product = data?.product;
    const transactions = data?.transactions ?? [];

    if (loading) return <Spinner label="Loading product" />;
    if (error) return <ErrorBlock message={error} onRetry={load} />;
    if (!product) return null;

    return (
        <div>
            <Link
                to="/products"
                className="mono-tag mb-4 inline-flex text-xs uppercase tracking-widest text-iris-300 hover:text-white"
            >
                ← Back to Products
            </Link>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="glass grid-floor rounded-2xl p-6 lg:col-span-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-white">{product.name}</h1>
                            <p className="mono-tag mt-1 text-sm uppercase tracking-widest text-iris-400">
                                SKU · {product.sku}
                            </p>
                        </div>
                        <StockBadge
                            quantity={product.quantityInStock}
                            reorderLevel={product.reorderLevel}
                        />
                    </div>

                    {product.imageUrl && (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="mt-4 max-h-64 w-full rounded-xl border border-iris-400/15 object-cover"
                        />
                    )}

                    {product.description && (
                        <p className="mt-4 max-w-prose text-sm text-[#c9c1de]">{product.description}</p>
                    )}

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <Info label="Category" value={product.category?.name || "—"} sub={product.category?.description} />
                        <Info label="Supplier" value={product.supplier?.name || "—"} sub={product.supplier?.email} />
                        <Info label="Unit Price" value={money(product.unitPrice)} />
                        <Info label="Reorder Level" value={`${num(product.reorderLevel)} units`} />
                    </div>

                    {product.supplier && (
                        <div className="mt-6 rounded-xl border border-iris-400/15 bg-void/40 p-4">
                            <p className="mono-tag mb-2 text-[11px] uppercase tracking-widest text-[#7c7396]">
                                Supplier contact
                            </p>
                            <div className="grid gap-1 text-sm text-[#d7cdf5] sm:grid-cols-2">
                                <span>{product.supplier.contactName || "—"}</span>
                                <span>{product.supplier.phone || "—"}</span>
                                <span>{product.supplier.email || "—"}</span>
                                <span>{product.supplier.address || "—"}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <StockPanel
                        quantity={product.quantityInStock}
                        reorderLevel={product.reorderLevel}
                    />
                    <MovementControls productId={product._id} onDone={load} toast={toast} />
                </div>
            </div>

            <div className="glass mt-4 rounded-2xl p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#9c92b8]">
                    Movement History
                </h2>
                {transactions.length === 0 ? (
                    <p className="text-sm text-[#7c7396]">No transactions recorded for this product yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {transactions.map((t) => (
                            <li
                                key={t._id}
                                className="flex flex-wrap items-center gap-3 rounded-xl bg-void/40 px-3 py-2.5"
                            >
                                <span
                                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                                        t.type === "IN"
                                            ? "bg-signal-ok/15 text-signal-ok"
                                            : "bg-signal-out/15 text-signal-out"
                                    }`}
                                >
                                    {t.type === "IN" ? "↓" : "↑"}
                                </span>
                                <span className="text-sm font-semibold text-white">
                                    {t.type} {num(t.quantity)}
                                </span>
                                <span className="flex-1 truncate text-sm text-[#9c92b8]">
                                    {t.note || "No note"}
                                </span>
                                <span className="mono-tag text-[11px] text-[#7c7396]">
                                    {dateTime(t.createdAt)} · {relativeTime(t.createdAt)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function Info({ label, value, sub }) {
    return (
        <div>
            <p className="mono-tag text-[11px] uppercase tracking-widest text-[#7c7396]">{label}</p>
            <p className="text-[#e7e2f5]">{value}</p>
            {sub && <p className="mt-0.5 truncate text-xs text-[#7c7396]">{sub}</p>}
        </div>
    );
}

function StockPanel({ quantity, reorderLevel }) {
    const status = stockStatus(quantity, reorderLevel);
    const pct = Math.min(100, reorderLevel > 0 ? (quantity / (reorderLevel * 2)) * 100 : quantity > 0 ? 100 : 0);
    const barColor =
        status === "out" ? "bg-signal-out" : status === "low" ? "bg-signal-low" : "bg-signal-ok";
    return (
        <div className="glass rounded-2xl p-6">
            <p className="mono-tag text-[11px] uppercase tracking-widest text-[#7c7396]">Current stock</p>
            <p className="mt-1 text-4xl font-bold text-white">{num(quantity)}</p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-void/60">
                <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="mono-tag mt-2 text-[11px] text-[#7c7396]">
                Reorder at {num(reorderLevel)} units
            </p>
        </div>
    );
}

function MovementControls({ productId, onDone, toast }) {
    const [type, setType] = useState("IN");
    const [quantity, setQuantity] = useState("");
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);
    const [fieldError, setFieldError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        const qty = Number(quantity);
        if (!Number.isInteger(qty) || qty < 1) {
            setFieldError("Enter a whole number greater than 0");
            return;
        }
        setFieldError("");
        setBusy(true);
        try {
            await api.post("/transactions", {
                productId,
                type,
                quantity: qty,
                note: note.trim()
            });
            toast.success(`Stock ${type} recorded (${qty} units)`);
            setQuantity("");
            setNote("");
            await onDone();
        } catch (err) {
            toast.error(apiError(err, "Stock movement failed"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} className="glass rounded-2xl p-6">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#9c92b8]">
                Record Movement
            </p>
            <div className="mb-3 grid grid-cols-2 gap-2">
                {["IN", "OUT"].map((t) => (
                    <button
                        type="button"
                        key={t}
                        onClick={() => setType(t)}
                        className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                            type === t
                                ? t === "IN"
                                    ? "bg-signal-ok/20 text-signal-ok ring-1 ring-signal-ok/40"
                                    : "bg-signal-out/20 text-signal-out ring-1 ring-signal-out/40"
                                : "bg-white/5 text-[#9c92b8] hover:text-white"
                        }`}
                    >
                        Stock {t}
                    </button>
                ))}
            </div>
            <label className="label">Quantity</label>
            <input
                type="number"
                min="1"
                step="1"
                className="field"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
            />
            {fieldError && <p className="mt-1 text-xs text-signal-out">{fieldError}</p>}
            <label className="label mt-3">Note (optional)</label>
            <input
                className="field"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="PO #, damage, cycle count…"
            />
            <button
                type="submit"
                className={`btn mt-4 w-full ${type === "IN" ? "btn-primary" : "btn-danger"}`}
                disabled={busy}
            >
                {busy ? "Recording…" : `Confirm Stock ${type}`}
            </button>
        </form>
    );
}
