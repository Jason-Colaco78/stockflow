import { useEffect } from "react";
import { STATUS_META, stockStatus } from "../utils/stock.js";

export function StockBadge({ quantity, reorderLevel }) {
    const meta = STATUS_META[stockStatus(quantity, reorderLevel)];
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.cls}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

/* ---------- feedback blocks ---------- */

export function Spinner({ label = "Loading" }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#9c92b8]">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-iris-500/30 border-t-iris-400" />
            <span className="mono-tag text-xs uppercase tracking-widest">{label}…</span>
        </div>
    );
}

export function ErrorBlock({ message, onRetry }) {
    return (
        <div className="glass flex flex-col items-center gap-3 rounded-2xl border-signal-out/30 px-6 py-14 text-center">
            <span className="text-2xl">⚠</span>
            <p className="text-sm text-[#f2c9d2]">{message}</p>
            {onRetry && (
                <button className="btn btn-ghost mt-1" onClick={onRetry}>
                    Retry
                </button>
            )}
        </div>
    );
}

export function EmptyState({ title, hint, action }) {
    return (
        <div className="glass grid-floor flex flex-col items-center gap-2 rounded-2xl px-6 py-16 text-center">
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-iris-500/15 text-xl">
                ▦
            </div>
            <p className="text-base font-semibold text-[#e7e2f5]">{title}</p>
            {hint && <p className="max-w-sm text-sm text-[#9c92b8]">{hint}</p>}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}

/* ---------- page header ---------- */

export function PageHeader({ eyebrow, title, subtitle, actions }) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                {eyebrow && (
                    <p className="mono-tag mb-1 text-xs uppercase tracking-[0.3em] text-iris-400">
                        {eyebrow}
                    </p>
                )}
                <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-[#9c92b8]">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    );
}

/* ---------- modal ---------- */

export function Modal({ open, onClose, title, children, wide }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-void/70 p-4 backdrop-blur-sm sm:p-8"
            onMouseDown={onClose}
        >
            <div
                className={`glass my-auto w-full rounded-2xl p-6 ${wide ? "max-w-2xl" : "max-w-lg"}`}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-xl leading-none text-[#9c92b8] hover:text-white"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel, busy }) {
    return (
        <Modal open={open} onClose={busy ? () => {} : onCancel} title={title}>
            <p className="text-sm text-[#c9c1de]">{message}</p>
            <div className="mt-6 flex justify-end gap-2">
                <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>
                    Cancel
                </button>
                <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
                    {busy ? "Working…" : confirmLabel}
                </button>
            </div>
        </Modal>
    );
}
