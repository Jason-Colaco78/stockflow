import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { EmptyState, ErrorBlock, PageHeader, Spinner } from "../components/ui.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { dateTime, num, relativeTime } from "../utils/format.js";

const TYPES = [
    { key: "all", label: "All" },
    { key: "IN", label: "Stock IN" },
    { key: "OUT", label: "Stock OUT" }
];

export default function Transactions() {
    const { data, loading, error, reload } = useApiData(
        async () => (await api.get("/transactions")).data.data || [],
        { errorMessage: "Failed to load transactions" }
    );
    const transactions = useMemo(() => data ?? [], [data]);
    const load = () => reload();

    const [search, setSearch] = useState("");
    const [type, setType] = useState("all");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return transactions.filter((t) => {
            if (type !== "all" && t.type !== type) return false;
            if (
                q &&
                !`${t.product?.name ?? ""} ${t.product?.sku ?? ""} ${t.note ?? ""}`
                    .toLowerCase()
                    .includes(q)
            )
                return false;
            return true;
        });
    }, [transactions, search, type]);

    const totals = useMemo(() => {
        let inQty = 0;
        let outQty = 0;
        for (const t of transactions) {
            if (t.type === "IN") inQty += t.quantity;
            else outQty += t.quantity;
        }
        return { inQty, outQty };
    }, [transactions]);

    return (
        <div>
            <PageHeader
                eyebrow="Movement Log"
                title="Transactions"
                subtitle="Every stock IN and OUT event, newest first."
                actions={
                    <button className="btn btn-ghost" onClick={load}>
                        ⟳ Refresh
                    </button>
                }
            />

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <Stat label="Total Events" value={num(transactions.length)} />
                <Stat label="Units In" value={num(totals.inQty)} cls="text-signal-ok" />
                <Stat label="Units Out" value={num(totals.outQty)} cls="text-signal-out" />
            </div>

            <div className="glass mb-5 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
                <input
                    className="field sm:max-w-xs"
                    placeholder="Search product, SKU, note…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex gap-1.5">
                    {TYPES.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setType(t.key)}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                type === t.key
                                    ? "bg-iris-500/25 text-ink"
                                    : "bg-mist/5 text-ink-soft hover:text-ink"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <Spinner label="Loading movement log" />
            ) : error ? (
                <ErrorBlock message={error} onRetry={load} />
            ) : transactions.length === 0 ? (
                <EmptyState
                    title="No transactions yet"
                    hint="Record stock movement from a product's detail page."
                />
            ) : filtered.length === 0 ? (
                <EmptyState title="No matches" hint="Adjust your search or filter." />
            ) : (
                <div className="glass overflow-hidden rounded-2xl">
                    <div className="hidden grid-cols-[90px_1fr_100px_1fr_180px] gap-4 border-b border-iris-400/15 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-ink-mute lg:grid">
                        <span>Type</span>
                        <span>Product</span>
                        <span>Qty</span>
                        <span>Note</span>
                        <span>When</span>
                    </div>
                    <ul className="divide-y divide-iris-400/10">
                        {filtered.map((t) => (
                            <li
                                key={t._id}
                                className="grid gap-2 px-5 py-4 lg:grid-cols-[90px_1fr_100px_1fr_180px] lg:items-center lg:gap-4"
                            >
                                <span
                                    className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                                        t.type === "IN"
                                            ? "border-signal-ok/40 bg-signal-ok/15 text-signal-ok"
                                            : "border-signal-out/40 bg-signal-out/15 text-signal-out"
                                    }`}
                                >
                                    {t.type === "IN" ? "↓ IN" : "↑ OUT"}
                                </span>
                                <span className="min-w-0">
                                    {t.product ? (
                                        <Link
                                            to={`/products/${t.product._id}`}
                                            className="truncate font-medium text-ink hover:text-iris-300"
                                        >
                                            {t.product.name}
                                        </Link>
                                    ) : (
                                        <span className="text-ink-mute">Deleted product</span>
                                    )}
                                    {t.product?.sku && (
                                        <span className="mono-tag ml-2 text-[11px] text-ink-mute">
                                            {t.product.sku}
                                        </span>
                                    )}
                                </span>
                                <span className="font-semibold text-ink">{num(t.quantity)}</span>
                                <span className="truncate text-sm text-ink-soft">{t.note || "—"}</span>
                                <span className="mono-tag text-[11px] text-ink-mute">
                                    {dateTime(t.createdAt)} · {relativeTime(t.createdAt)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value, cls = "text-ink" }) {
    return (
        <div className="glass rounded-2xl p-4">
            <p className="mono-tag text-[11px] uppercase tracking-widest text-ink-mute">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${cls}`}>{value}</p>
        </div>
    );
}
