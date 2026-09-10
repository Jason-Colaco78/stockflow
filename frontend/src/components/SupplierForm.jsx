import { useState } from "react";
import api, { apiError } from "../api";
import { useToast } from "../context/ToastContext.jsx";

// Parent passes a `key` tied to the record id, so initial values are built once.
function toFormState(initial) {
    return {
        name: initial?.name ?? "",
        contactName: initial?.contactName ?? "",
        email: initial?.email ?? "",
        phone: initial?.phone ?? "",
        address: initial?.address ?? ""
    };
}

export default function SupplierForm({ initial, onSaved, onCancel }) {
    const toast = useToast();
    const isEdit = Boolean(initial?._id);
    const [form, setForm] = useState(() => toFormState(initial));
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const set = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        setErrors((p) => ({ ...p, [key]: undefined }));
    };

    const validate = () => {
        const next = {};
        if (!form.name.trim()) next.name = "Supplier name is required";
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            next.email = "Enter a valid email";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        const payload = {
            name: form.name.trim(),
            contactName: form.contactName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            address: form.address.trim()
        };
        setSaving(true);
        try {
            if (isEdit) {
                await api.put(`/suppliers/${initial._id}`, payload);
                toast.success("Supplier updated");
            } else {
                await api.post("/suppliers", payload);
                toast.success("Supplier created");
            }
            onSaved();
        } catch (err) {
            toast.error(apiError(err, "Failed to save supplier"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <Field label="Supplier Name" error={errors.name}>
                <input className="field" value={form.name} onChange={set("name")} placeholder="Northgate Industrial" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Contact Name">
                    <input className="field" value={form.contactName} onChange={set("contactName")} placeholder="Dana Reyes" />
                </Field>
                <Field label="Phone">
                    <input className="field" value={form.phone} onChange={set("phone")} placeholder="+1 555 0134" />
                </Field>
            </div>
            <Field label="Email" error={errors.email}>
                <input className="field" value={form.email} onChange={set("email")} placeholder="ops@northgate.com" />
            </Field>
            <Field label="Address">
                <textarea className="field min-h-20 resize-y" value={form.address} onChange={set("address")} placeholder="Dock 4, 1200 Warehouse Row…" />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Supplier"}
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
