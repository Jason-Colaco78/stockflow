import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { ErrorBlock, EmptyState, Modal, PageHeader, Spinner, StockBadge } from "../components/ui.jsx";
import ProductForm from "../components/ProductForm.jsx";
import CategoryForm from "../components/CategoryForm.jsx";
import SupplierForm from "../components/SupplierForm.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { num, relativeTime } from "../utils/format.js";
import { stockStatus } from "../utils/stock.js";

export default function Dashboard() {
    const { data, loading, error, reload } = useApiData(
        async () => {
            const [dashRes, productsRes, txRes] = await Promise.all([
                api.get("/dashboard"),
                api.get("/products"),
                api.get("/transactions")
            ]);
            return {
                summary: dashRes.data.data,
                products: productsRes.data.data || [],
                transactions: txRes.data.data || []
            };
        },
        { errorMessage: "Failed to load dashboard" }
    );
    const load = () => reload();

    const [addProductOpen, setAddProductOpen] = useState(false);
    const [addCategoryOpen, setAddCategoryOpen] = useState(false);
    const [addSupplierOpen, setAddSupplierOpen] = useState(false);

    const products = useMemo(() => data?.products ?? [], [data]);
    const transactions = useMemo(() => data?.transactions ?? [], [data]);

    const statusCounts = useMemo(() => {
        const counts = { normal: 0, low: 0, out: 0 };
        for (const p of products) counts[stockStatus(p.quantityInStock, p.reorderLevel)]++;
        return counts;
    }, [products]);

    const attentionProducts = useMemo(
        () =>
            products
                .filter((p) => stockStatus(p.quantityInStock, p.reorderLevel) !== "normal")
                .sort((a, b) => {
                    const rank = (p) => (p.quantityInStock === 0 ? 0 : 1);
                    return rank(a) - rank(b) || a.quantityInStock - b.quantityInStock;
                }),
        [products]
    );

    const topHoldings = useMemo(
        () => [...products].sort((a, b) => b.quantityInStock - a.quantityInStock).slice(0, 5),
        [products]
    );

    const todaysMovement = useMemo(() => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        let inUnits = 0;
        let outUnits = 0;
        for (const t of transactions) {
            if (new Date(t.createdAt) >= startOfDay) {
                if (t.type === "IN") inUnits += t.quantity;
                else outUnits += t.quantity;
            }
        }
        return { inUnits, outUnits };
    }, [transactions]);

    const recentTransactions = transactions.slice(0, 5);

    const insights = useMemo(() => {
        const total = products.length;
        const list = [];
        list.push(
            statusCounts.low > 0
                ? `${statusCounts.low} product${statusCounts.low > 1 ? "s are" : " is"} below its reorder level.`
                : "No products are below their reorder level."
        );
        list.push(
            statusCounts.out > 0
                ? `${statusCounts.out} product${statusCounts.out > 1 ? "s are" : " is"} completely out of stock.`
                : "No products are out of stock."
        );
        if (total > 0) {
            list.push(
                `${statusCounts.normal} of ${total} product${total === 1 ? "" : "s"} currently ${
                    statusCounts.normal === 1 ? "has" : "have"
                } healthy stock.`
            );
        }
        if (topHoldings[0]) {
            list.push(
                `${topHoldings[0].name} currently holds the largest inventory quantity (${num(
                    topHoldings[0].quantityInStock
                )} units).`
            );
        }
        return list;
    }, [statusCounts, products.length, topHoldings]);

    const pct = (v) => (products.length ? Math.round((v / products.length) * 100) : 0);

    if (loading) return <Spinner label="Syncing control center" />;
    if (error) return <ErrorBlock message={error} onRetry={load} />;
    if (!data) return null;

    return (
        <div>
            <PageHeader
                eyebrow="Control Center"
                title="Warehouse Overview"
                subtitle="Live snapshot of inventory levels and recent movement."
                actions={
                    <button className="btn btn-ghost" onClick={load}>
                        ⟳ Refresh
                    </button>
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Total Products" value={num(data.summary.totalProducts)} icon="▤" tone="iris" to="/products" />
                <Metric
                    label="Units in Stock"
                    value={num(data.summary.totalUnitsInStock)}
                    icon="▦"
                    tone="iris"
                    to="#stock-distribution"
                />
                <Metric label="Categories" value={num(data.summary.totalCategories)} icon="⊞" tone="muted" to="/categories" />
                <Metric label="Suppliers" value={num(data.summary.totalSuppliers)} icon="☰" tone="muted" to="/suppliers" />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="glass attention-panel rounded-2xl p-5 lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-soft">
                            Needs Attention
                        </h2>
                        {attentionProducts.length > 0 && (
                            <span className="mono-tag rounded-full bg-signal-low/15 px-2.5 py-0.5 text-xs font-semibold text-signal-low">
                                {attentionProducts.length}
                            </span>
                        )}
                    </div>
                    {products.length === 0 ? (
                        <EmptyState title="No products yet" hint="Add a product to start tracking inventory levels." />
                    ) : attentionProducts.length === 0 ? (
                        <EmptyState title="All inventory levels are healthy." />
                    ) : (
                        <ul className="space-y-2">
                            {attentionProducts.slice(0, 6).map((p) => (
                                <li key={p._id}>
                                    <AttentionRow product={p} />
                                </li>
                            ))}
                        </ul>
                    )}
                    {attentionProducts.length > 6 && (
                        <Link
                            to="/products"
                            className="mono-tag mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-iris-300 hover:text-ink"
                        >
                            +{attentionProducts.length - 6} more need attention →
                        </Link>
                    )}
                </div>

                <div id="stock-distribution" className="glass scroll-mt-20 rounded-2xl p-5">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink-soft">
                        Stock Distribution
                    </h2>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-void/60">
                        <div className="bg-signal-ok" style={{ width: `${pct(statusCounts.normal)}%` }} />
                        <div className="bg-signal-low" style={{ width: `${pct(statusCounts.low)}%` }} />
                        <div className="bg-signal-out" style={{ width: `${pct(statusCounts.out)}%` }} />
                    </div>
                    <div className="mt-4 space-y-2">
                        <DistributionRow label="Healthy" value={statusCounts.normal} pct={pct(statusCounts.normal)} dot="bg-signal-ok" cls="text-signal-ok" />
                        <DistributionRow label="Low Stock" value={statusCounts.low} pct={pct(statusCounts.low)} dot="bg-signal-low" cls="text-signal-low" />
                        <DistributionRow label="Out of Stock" value={statusCounts.out} pct={pct(statusCounts.out)} dot="bg-signal-out" cls="text-signal-out" />
                    </div>
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="glass rounded-2xl p-5">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink-soft">
                        Control Signals
                    </h2>
                    <ul className="space-y-3">
                        {insights.map((line, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-iris-400" />
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="glass rounded-2xl p-5 lg:col-span-2">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink-soft">
                        Largest Inventory Positions
                    </h2>
                    {topHoldings.length === 0 ? (
                        <EmptyState title="No products yet" hint="Add a product to start tracking inventory levels." />
                    ) : (
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {topHoldings.map((p) => (
                                <li key={p._id}>
                                    <HoldingRow product={p} maxQty={topHoldings[0].quantityInStock} />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="glass rounded-2xl p-5 lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-soft">
                            Recent Movement
                        </h2>
                        <Link to="/transactions" className="text-xs text-iris-300 hover:text-ink">
                            View all
                        </Link>
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-panel/60 px-3.5 py-3">
                            <p className="mono-tag text-[11px] uppercase tracking-widest text-ink-mute">Today · IN</p>
                            <p className="mt-1 text-xl font-bold text-signal-ok">+{num(todaysMovement.inUnits)}</p>
                        </div>
                        <div className="rounded-xl bg-panel/60 px-3.5 py-3">
                            <p className="mono-tag text-[11px] uppercase tracking-widest text-ink-mute">Today · OUT</p>
                            <p className="mt-1 text-xl font-bold text-signal-out">-{num(todaysMovement.outUnits)}</p>
                        </div>
                    </div>
                    {recentTransactions.length ? (
                        <ul className="space-y-2">
                            {recentTransactions.map((t) => (
                                <li key={t._id}>
                                    <MovementRow t={t} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="No movement yet" hint="Stock IN / OUT activity will appear here." />
                    )}
                </div>

                <div className="glass rounded-2xl p-5">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink-soft">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                        <button className="btn btn-ghost justify-start" onClick={() => setAddProductOpen(true)}>
                            + Add Product
                        </button>
                        <button className="btn btn-ghost justify-start" onClick={() => setAddCategoryOpen(true)}>
                            + Add Category
                        </button>
                        <button className="btn btn-ghost justify-start" onClick={() => setAddSupplierOpen(true)}>
                            + Add Supplier
                        </button>
                        <Link to="/transactions" className="btn btn-ghost justify-start">
                            View Transactions
                        </Link>
                    </div>
                </div>
            </div>

            <Modal open={addProductOpen} onClose={() => setAddProductOpen(false)} title="New Product" wide>
                <ProductForm
                    key={addProductOpen ? "open" : "closed"}
                    onSaved={() => {
                        setAddProductOpen(false);
                        load();
                    }}
                    onCancel={() => setAddProductOpen(false)}
                />
            </Modal>

            <Modal open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)} title="New Category">
                <CategoryForm
                    key={addCategoryOpen ? "open" : "closed"}
                    onSaved={() => {
                        setAddCategoryOpen(false);
                        load();
                    }}
                    onCancel={() => setAddCategoryOpen(false)}
                />
            </Modal>

            <Modal open={addSupplierOpen} onClose={() => setAddSupplierOpen(false)} title="New Supplier">
                <SupplierForm
                    key={addSupplierOpen ? "open" : "closed"}
                    onSaved={() => {
                        setAddSupplierOpen(false);
                        load();
                    }}
                    onCancel={() => setAddSupplierOpen(false)}
                />
            </Modal>
        </div>
    );
}

function Metric({ label, value, icon, tone, to }) {
    const content = (
        <>
            <div className="flex items-start justify-between">
                <span className="mono-tag text-xs uppercase tracking-widest text-ink-soft">{label}</span>
                <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                        tone === "iris" ? "bg-iris-500/20 text-iris-300" : "bg-mist/5 text-ink-soft"
                    }`}
                >
                    {icon}
                </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
        </>
    );

    if (!to) {
        return <div className="glass glass-hover grid-floor rounded-2xl p-5">{content}</div>;
    }

    if (to.startsWith("#")) {
        return (
            <a
                href={to}
                onClick={(e) => {
                    e.preventDefault();
                    document.querySelector(to)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="glass glass-hover grid-floor block cursor-pointer rounded-2xl p-5 text-left"
            >
                {content}
            </a>
        );
    }

    return (
        <Link to={to} className="glass glass-hover grid-floor block cursor-pointer rounded-2xl p-5 text-left">
            {content}
        </Link>
    );
}

function DistributionRow({ label, value, pct, dot, cls }) {
    return (
        <div className="flex items-center justify-between rounded-xl bg-panel/60 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                <span className="mono-tag text-[11px] uppercase tracking-widest text-ink-mute">{label}</span>
            </div>
            <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${cls}`}>{num(value)}</span>
                <span className="mono-tag text-xs text-ink-mute">{pct}%</span>
            </div>
        </div>
    );
}

function AttentionRow({ product }) {
    return (
        <Link
            to={`/products/${product._id}`}
            className="flex items-center justify-between gap-3 rounded-xl bg-panel/60 px-3.5 py-3 transition hover:bg-iris-500/15"
        >
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
                <p className="mono-tag mt-0.5 text-[11px] uppercase tracking-widest text-iris-400">{product.sku}</p>
                <p className="mt-1 text-xs text-ink-soft">
                    {num(product.quantityInStock)} on hand · Reorder level {num(product.reorderLevel)}
                </p>
            </div>
            <StockBadge quantity={product.quantityInStock} reorderLevel={product.reorderLevel} />
        </Link>
    );
}

function HoldingRow({ product, maxQty }) {
    const width = maxQty > 0 ? Math.max((product.quantityInStock / maxQty) * 100, 4) : 0;
    return (
        <Link
            to={`/products/${product._id}`}
            className="block rounded-xl bg-panel/60 px-3.5 py-3 transition hover:bg-iris-500/15"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
                    <p className="mono-tag text-[11px] uppercase tracking-widest text-iris-400">{product.sku}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <StockBadge quantity={product.quantityInStock} reorderLevel={product.reorderLevel} />
                    <span className="text-lg font-bold text-ink">{num(product.quantityInStock)}</span>
                </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-void/60">
                <div className="h-full rounded-full bg-iris-500" style={{ width: `${width}%` }} />
            </div>
        </Link>
    );
}

function MovementRow({ t }) {
    const inner = (
        <>
            <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    t.type === "IN" ? "bg-signal-ok/15 text-signal-ok" : "bg-signal-out/15 text-signal-out"
                }`}
            >
                {t.type === "IN" ? "↓" : "↑"}
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{t.product?.name || "Deleted product"}</p>
                <p className="mono-tag text-[11px] text-ink-mute">
                    {t.type} · {t.quantity} units · {relativeTime(t.createdAt)}
                </p>
                {t.note && <p className="mt-0.5 truncate text-xs text-ink-soft">{t.note}</p>}
            </div>
        </>
    );

    if (t.product?._id) {
        return (
            <Link
                to={`/products/${t.product._id}`}
                className="flex items-center gap-3 rounded-xl bg-panel/60 px-3 py-2.5 transition hover:bg-iris-500/15"
            >
                {inner}
            </Link>
        );
    }

    return <div className="flex items-center gap-3 rounded-xl bg-panel/60 px-3 py-2.5">{inner}</div>;
}
