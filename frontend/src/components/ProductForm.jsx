import { useEffect, useState } from "react";
import api, { apiError } from "../api";
import { useToast } from "../context/ToastContext.jsx";

// Parent passes a `key` tied to the record id, so this only needs to build
// initial field values once per mount (no prop-sync effect required).
function toFormState(initial) {
    return {
        name: initial?.name ?? "",
        sku: initial?.sku ?? "",
        description: initial?.description ?? "",
        category: initial?.category?._id ?? "",
        supplier: initial?.supplier?._id ?? "",
        unitPrice: initial?.unitPrice ?? "",
        reorderLevel: initial?.reorderLevel ?? "",
        quantityInStock: ""
    };
}

export default function ProductForm({ initial, onSaved, onCancel }) {
    const toast = useToast();
    const isEdit = Boolean(initial?._id);

    const [form, setForm] = useState(() => toFormState(initial));
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [refsLoading, setRefsLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let alive = true;
        (async () => {
            setRefsLoading(true);
            try {
                const [c, s] = await Promise.all([
                    api.get("/categories"),
                    api.get("/suppliers")
                ]);
                if (!alive) return;
                setCategories(c.data.data || []);
                setSuppliers(s.data.data || []);
            } catch (err) {
                if (alive) toast.error(apiError(err, "Failed to load form data"));
            } finally {
                if (alive) setRefsLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [toast]);

    const set = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const validate = () => {
        const next = {};
        if (!form.name.trim()) next.name = "Name is required";
        if (!form.sku.trim()) next.sku = "SKU is required";
        if (!form.category) next.category = "Select a category";
        if (!form.supplier) next.supplier = "Select a supplier";
        if (form.unitPrice === "" || Number(form.unitPrice) < 0)
            next.unitPrice = "Enter a valid price";
        if (form.reorderLevel === "" || Number(form.reorderLevel) < 0)
            next.reorderLevel = "Enter a valid reorder level";
        if (!isEdit && form.quantityInStock !== "" && Number(form.quantityInStock) < 0)
            next.quantityInStock = "Cannot be negative";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const payload = {
            name: form.name.trim(),
            sku: form.sku.trim(),
            description: form.description.trim(),
            category: form.category,
            supplier: form.supplier,
            unitPrice: Number(form.unitPrice),
            reorderLevel: Number(form.reorderLevel)
        };

        setSaving(true);
        try {
            if (isEdit) {
                await api.put(`/products/${initial._id}`, payload);
                toast.success("Product updated");
            } else {
                await api.post("/products", {
                    ...payload,
                    quantityInStock:
                        form.quantityInStock === "" ? 0 : Number(form.quantityInStock)
                });
                toast.success("Product created");
            }
            onSaved();
        } catch (err) {
            toast.error(apiError(err, "Failed to save product"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product Name" error={errors.name}>
                    <input className="field" value={form.name} onChange={set("name")} placeholder="Torque Wrench 1/2in" />
                </Field>
                <Field label="SKU / Bin Code" error={errors.sku}>
                    <input
                        className="field mono-tag uppercase"
                        value={form.sku}
                        onChange={set("sku")}
                        placeholder="TWR-050-A"
                    />
                </Field>
            </div>

            <Field label="Description">
                <textarea
                    className="field min-h-20 resize-y"
                    value={form.description}
                    onChange={set("description")}
                    placeholder="Notes, specs, handling instructions…"
                />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" error={errors.category}>
                    <select className="field" value={form.category} onChange={set("category")} disabled={refsLoading}>
                        <option value="">{refsLoading ? "Loading…" : "Select category"}</option>
                        {categories.map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Supplier" error={errors.supplier}>
                    <select className="field" value={form.supplier} onChange={set("supplier")} disabled={refsLoading}>
                        <option value="">{refsLoading ? "Loading…" : "Select supplier"}</option>
                        {suppliers.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                    </select>
                </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Unit Price" error={errors.unitPrice}>
                    <input type="number" min="0" step="0.01" className="field" value={form.unitPrice} onChange={set("unitPrice")} placeholder="0.00" />
                </Field>
                <Field label="Reorder Level" error={errors.reorderLevel}>
                    <input type="number" min="0" step="1" className="field" value={form.reorderLevel} onChange={set("reorderLevel")} placeholder="0" />
                </Field>
                {!isEdit && (
                    <Field label="Opening Stock" error={errors.quantityInStock}>
                        <input type="number" min="0" step="1" className="field" value={form.quantityInStock} onChange={set("quantityInStock")} placeholder="0" />
                    </Field>
                )}
            </div>

            {isEdit && (
                <p className="mono-tag rounded-lg border border-iris-400/15 bg-void/40 px-3 py-2 text-xs text-[#7c7396]">
                    Stock quantity is controlled through transactions, not this form.
                </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || refsLoading}>
                    {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
                </button>
            </div>
        </form>
    );
}

function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="label">{label}</span>
            {children}
            {error && <span className="mt-1 block text-xs text-signal-out">{error}</span>}
        </label>
    );
}
