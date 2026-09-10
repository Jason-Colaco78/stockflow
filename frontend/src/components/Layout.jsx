import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const NAV = [
    { to: "/", label: "Dashboard", icon: "▟", end: true },
    { to: "/products", label: "Products", icon: "▤" },
    { to: "/transactions", label: "Transactions", icon: "⇄" },
    { to: "/suppliers", label: "Suppliers", icon: "☰" }
];

function NavItems({ onNavigate }) {
    return (
        <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                            isActive
                                ? "bg-iris-500/20 text-white shadow-[inset_0_0_0_1px_rgba(167,139,250,0.35)]"
                                : "text-[#9c92b8] hover:bg-white/5 hover:text-white"
                        }`
                    }
                >
                    <span className="text-base opacity-80">{item.icon}</span>
                    {item.label}
                </NavLink>
            ))}
        </nav>
    );
}

export default function Layout() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen lg:flex">
            {/* desktop sidebar */}
            <aside className="glass sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-iris-400/15 p-5 lg:flex">
                <Brand />
                <div className="mt-8 flex-1">
                    <NavItems />
                </div>
                <ControlFooter />
            </aside>

            {/* mobile top bar */}
            <header className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden">
                <Brand compact />
                <button
                    className="btn btn-ghost px-3 py-2"
                    onClick={() => setMobileOpen((v) => !v)}
                    aria-label="Toggle navigation"
                >
                    {mobileOpen ? "×" : "☰"}
                </button>
            </header>
            {mobileOpen && (
                <div className="glass border-b border-iris-400/15 px-4 py-4 lg:hidden">
                    <NavItems onNavigate={() => setMobileOpen(false)} />
                </div>
            )}

            <main className="min-w-0 flex-1">
                <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function Brand({ compact }) {
    return (
        <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-iris-400 to-iris-700 text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.9)]">
                <span className="text-sm font-black">SF</span>
            </div>
            <div className={compact ? "" : "leading-tight"}>
                <p className="text-sm font-bold tracking-wide text-white">STOCKFLOW</p>
                {!compact && (
                    <p className="mono-tag text-[10px] uppercase tracking-[0.25em] text-iris-400">
                        Inventory · Ops
                    </p>
                )}
            </div>
        </div>
    );
}

function ControlFooter() {
    return (
        <div className="mono-tag mt-6 rounded-xl border border-iris-400/15 bg-void/40 p-3 text-[10px] uppercase tracking-widest text-[#7c7396]">
            <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal-ok" />
                Control Center Online
            </div>
        </div>
    );
}
