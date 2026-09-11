import { useState } from "react";
import api, { apiError } from "../api";
import { useToast } from "../context/ToastContext.jsx";

// Parent passes a `key` tied to the record id, so initial values are built once.
function toFormState(initial) {
    return {
        name: initial?.name ?? "",
        description: initial?.description ?? ""
    };
}

export default function CategoryForm({ initial, onSaved, onCancel }) {
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
        if (!form.name.trim()) next.name = "Category name is required";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        const payload = {
            name: form.name.trim(),
            description: form.description.trim()
        };
        setSaving(true);
        try {
            if (isEdit) {
                await api.put(`/categories/${initial._id}`, payload);
                toast.success("Category updated");
            } else {
                await api.post("/categories", payload);
                toast.success("Category created");
            }
            onSaved();
        } catch (err) {
            toast.error(apiError(err, "Failed to save category"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <Field label="Category Name" error={errors.name}>
                <input className="field" value={form.name} onChange={set("name")} placeholder="Power Tools" />
            </Field>
            <Field label="Description">
                <textarea
                    className="field min-h-20 resize-y"
                    value={form.description}
                    onChange={set("description")}
                    placeholder="Cordless drills, saws, and related accessories…"
                />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Category"}
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
