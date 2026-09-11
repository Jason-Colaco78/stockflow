/* eslint-disable react-refresh/only-export-components -- provider + useTheme hook intentionally colocated */
import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "stockflow-theme";
const ThemeContext = createContext(null);

function getInitialTheme() {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
