export function stockStatus(quantity, reorderLevel) {
    if (quantity === 0) return "out";
    if (quantity <= reorderLevel) return "low";
    return "normal";
}

export const STATUS_META = {
    out: {
        label: "Out of Stock",
        cls: "bg-signal-out/15 text-signal-out border-signal-out/40",
        dot: "bg-signal-out"
    },
    low: {
        label: "Low Stock",
        cls: "bg-signal-low/15 text-signal-low border-signal-low/40",
        dot: "bg-signal-low"
    },
    normal: {
        label: "Normal",
        cls: "bg-signal-ok/15 text-signal-ok border-signal-ok/40",
        dot: "bg-signal-ok"
    }
};
