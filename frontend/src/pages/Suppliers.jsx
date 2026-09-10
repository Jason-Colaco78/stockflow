import { useMemo, useState } from "react";
import api, { apiError } from "../api";
import {
    ConfirmDialog,
    EmptyState,
    ErrorBlock,
    Modal,
    PageHeader,
    Spinner
} from "../components/ui.jsx";
import SupplierForm from "../components/SupplierForm.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { num } from "../utils/format.js";

export default function Suppliers() {
    const toast = useToast();

    const { data, loading, error, reload } = useApiData(
        async () => (await api.get("/suppliers")).data.data || [],
        { errorMessage: "Failed to load suppliers" }
    );
    const suppliers = useMemo(() => data ?? [], [data]);
    const load = () => reload();

    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return suppliers;
        return suppliers.filter((s) =>
            `${s.name} ${s.contactName ?? ""} ${s.email ?? ""}`.toLowerCase().includes(q)
        );
    }, [suppliers, search]);

    const onSaved = () => {
        setFormOpen(false);
        setEditing(null);
        load();
    };

    const confirmDelete = async () => {
        setDeleteBusy(true);
        try {
            await api.delete(`/suppliers/${deleting._id}`);
            toast.success(`Deleted “${deleting.name}”`);
            setDeleting(null);
            load();
        } catch (err) {
            toast.error(apiError(err, "Failed to delete supplier"));
        } finally {
            setDeleteBusy(false);
        }
    };

    return (
        <div>
            <PageHeader
                eyebrow="Network"
                title="Suppliers"
                subtitle={`${num(suppliers.length)} vendors in the supply network.`}
                actions={
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                    >
                        + Add Supplier
                    </button>
                }
            />

            <div className="glass mb-5 rounded-2xl p-4">
                <input
                    className="field sm:max-w-xs"
                    placeholder="Search name, contact, email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <Spinner label="Loading suppliers" />
            ) : error ? (
                <ErrorBlock message={error} onRetry={load} />
            ) : suppliers.length === 0 ? (
                <EmptyState
                    title="No suppliers yet"
                    hint="Add vendors so you can link them to products."
                    action={
                        <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
                            + Add Supplier
                        </button>
                    }
                />
            ) : filtered.length === 0 ? (
                <EmptyState title="No matches" hint="Try a different search." />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((s) => (
                        <div key={s._id} className="glass glass-hover flex flex-col rounded-2xl p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-iris-500/20 text-sm font-bold text-iris-300">
                                    {s.name?.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-white">{s.name}</p>
                                    <p className="truncate text-xs text-[#9c92b8]">
                                        {s.contactName || "No contact"}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-1 text-sm text-[#d7cdf5]">
                                <p className="truncate">✉ {s.email || "—"}</p>
                                <p className="truncate">☎ {s.phone || "—"}</p>
                                <p className="line-clamp-2">⌂ {s.address || "—"}</p>
                            </div>
                            <div className="mt-4 flex gap-1.5 border-t border-iris-400/10 pt-4">
                                <button className="btn btn-ghost px-3 py-1.5 text-xs" onClick={() => setViewing(s)}>
                                    View
                                </button>
                                <button
                                    className="btn btn-ghost px-3 py-1.5 text-xs"
                                    onClick={() => {
                                        setEditing(s);
                                        setFormOpen(true);
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-danger px-3 py-1.5 text-xs"
                                    onClick={() => setDeleting(s)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditing(null);
                }}
                title={editing ? "Edit Supplier" : "New Supplier"}
            >
                <SupplierForm
                    key={editing?._id || "new"}
                    initial={editing}
                    onSaved={onSaved}
                    onCancel={() => {
                        setFormOpen(false);
                        setEditing(null);
                    }}
                />
            </Modal>

            <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing?.name}>
                <dl className="space-y-3 text-sm">
                    <Row label="Contact" value={viewing?.contactName} />
                    <Row label="Email" value={viewing?.email} />
                    <Row label="Phone" value={viewing?.phone} />
                    <Row label="Address" value={viewing?.address} />
                </dl>
            </Modal>

            <ConfirmDialog
                open={Boolean(deleting)}
                title="Delete supplier"
                message={`Permanently delete “${deleting?.name}”? Products linked to this supplier will keep the reference but lose its details.`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleting(null)}
                busy={deleteBusy}
            />
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between gap-4 border-b border-iris-400/10 pb-2">
            <dt className="mono-tag text-[11px] uppercase tracking-widest text-[#7c7396]">{label}</dt>
            <dd className="text-right text-[#e7e2f5]">{value || "—"}</dd>
        </div>
    );
}
