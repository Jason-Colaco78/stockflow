/* eslint-disable react-refresh/only-export-components -- provider + useToast hook intentionally colocated */
import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

let idSeed = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts((list) => list.filter((t) => t.id !== id));
    }, []);

    const push = useCallback(
        (type, message) => {
            const id = ++idSeed;
            setToasts((list) => [...list, { id, type, message }]);
            setTimeout(() => dismiss(id), 4200);
        },
        [dismiss]
    );

    const toast = {
        success: (m) => push("success", m),
        error: (m) => push("error", m),
        info: (m) => push("info", m)
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed bottom-5 right-5 z-[100] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="status"
                        className={`glass flex items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-xl ${
                            t.type === "success"
                                ? "border-l-2 border-l-signal-ok"
                                : t.type === "error"
                                ? "border-l-2 border-l-signal-out"
                                : "border-l-2 border-l-iris-400"
                        }`}
                    >
                        <span className="mt-0.5">
                            {t.type === "success" ? "✓" : t.type === "error" ? "!" : "i"}
                        </span>
                        <span className="flex-1 text-[#e7e2f5]">{t.message}</span>
                        <button
                            onClick={() => dismiss(t.id)}
                            className="text-[#9c92b8] hover:text-white"
                            aria-label="Dismiss"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}
