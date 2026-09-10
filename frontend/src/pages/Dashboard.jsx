import { Link } from "react-router-dom";
import api from "../api";
import { ErrorBlock, PageHeader, Spinner, EmptyState } from "../components/ui.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { num, relativeTime } from "../utils/format.js";

export default function Dashboard() {
    const { data, loading, error, reload } = useApiData(
        async () => (await api.get("/dashboard")).data.data,
        { errorMessage: "Failed to load dashboard" }
    );
    const load = () => reload();

    if (loading) return <Spinner label="Syncing control center" />;
    if (error) return <ErrorBlock message={error} onRetry={load} />;
    if (!data) return null;

    const healthy =
        data.totalProducts - data.lowStockProducts - data.outOfStockProducts;
    const attention = data.lowStockProducts + data.outOfStockProducts;

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
                <Metric label="Total Products" value={num(data.totalProducts)} icon="▤" tone="iris" />
                <Metric label="Units in Stock" value={num(data.totalUnitsInStock)} icon="▦" tone="iris" />
                <Metric label="Categories" value={num(data.totalCategories)} icon="⊞" tone="muted" />
                <Metric label="Suppliers" value={num(data.totalSuppliers)} icon="☰" tone="muted" />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="glass rounded-2xl p-5 lg:col-span-2">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#9c92b8]">
                        Stock Health
                    </h2>
                    <StockBar
                        healthy={Math.max(healthy, 0)}
                        low={data.lowStockProducts}
                        out={data.outOfStockProducts}
                        total={data.totalProducts}
                    />
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <HealthTile label="Healthy" value={Math.max(healthy, 0)} cls="text-signal-ok" dot="bg-signal-ok" />
                        <HealthTile label="Low Stock" value={data.lowStockProducts} cls="text-signal-low" dot="bg-signal-low" />
                        <HealthTile label="Out of Stock" value={data.outOfStockProducts} cls="text-signal-out" dot="bg-signal-out" />
                    </div>
                    {attention > 0 && (
                        <Link
                            to="/products"
                            className="mono-tag mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-iris-300 hover:text-white"
                        >
                            {attention} product{attention > 1 ? "s" : ""} need attention →
                        </Link>
                    )}
                </div>

                <div className="glass rounded-2xl p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-[#9c92b8]">
                            Recent Movement
                        </h2>
                        <Link to="/transactions" className="text-xs text-iris-300 hover:text-white">
                            View all
                        </Link>
                    </div>
                    {data.recentTransactions?.length ? (
                        <ul className="space-y-2">
                            {data.recentTransactions.map((t) => (
                                <li key={t._id} className="flex items-center gap-3 rounded-xl bg-void/40 px-3 py-2.5">
                                    <span
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                            t.type === "IN"
                                                ? "bg-signal-ok/15 text-signal-ok"
                                                : "bg-signal-out/15 text-signal-out"
                                        }`}
                                    >
                                        {t.type === "IN" ? "↓" : "↑"}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-[#e7e2f5]">
                                            {t.product?.name || "Deleted product"}
                                        </p>
                                        <p className="mono-tag text-[11px] text-[#7c7396]">
                                            {t.type} · {t.quantity} units · {relativeTime(t.createdAt)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="No movement yet" hint="Stock IN / OUT activity will appear here." />
                    )}
                </div>
            </div>
        </div>
    );
}

function Metric({ label, value, icon, tone }) {
    return (
        <div className="glass glass-hover grid-floor rounded-2xl p-5">
            <div className="flex items-start justify-between">
                <span className="mono-tag text-xs uppercase tracking-widest text-[#9c92b8]">{label}</span>
                <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                        tone === "iris" ? "bg-iris-500/20 text-iris-300" : "bg-white/5 text-[#9c92b8]"
                    }`}
                >
                    {icon}
                </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-white">{value}</p>
        </div>
    );
}

function StockBar({ healthy, low, out, total }) {
    const t = total || 1;
    const seg = (v) => `${(v / t) * 100}%`;
    return (
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-void/60">
            <div className="bg-signal-ok" style={{ width: seg(healthy) }} />
            <div className="bg-signal-low" style={{ width: seg(low) }} />
            <div className="bg-signal-out" style={{ width: seg(out) }} />
        </div>
    );
}

function HealthTile({ label, value, cls, dot }) {
    return (
        <div className="rounded-xl bg-void/40 px-3 py-3">
            <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                <span className="mono-tag text-[11px] uppercase tracking-widest text-[#7c7396]">{label}</span>
            </div>
            <p className={`mt-1 text-xl font-bold ${cls}`}>{num(value)}</p>
        </div>
    );
}
