import { useCallback, useEffect, useRef, useState } from "react";
import { apiError } from "../api";

/**
 * Fetch data on mount and expose a reload() for retries / post-mutation refresh.
 *
 * All state updates happen after an await (never synchronously inside the mount
 * effect), and reload() runs as a quiet background refresh by default so the
 * page doesn't flash its full-screen loading state on every change.
 */
export function useApiData(fetcher, { errorMessage = "Failed to load data" } = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetcherRef = useRef(fetcher);
    useEffect(() => {
        fetcherRef.current = fetcher;
    });

    const reload = useCallback(
        async ({ showLoading = false } = {}) => {
            if (showLoading) setLoading(true);
            setError("");
            try {
                setData(await fetcherRef.current());
            } catch (err) {
                setError(apiError(err, errorMessage));
            } finally {
                setLoading(false);
            }
        },
        [errorMessage]
    );

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const result = await fetcherRef.current();
                if (alive) setData(result);
            } catch (err) {
                if (alive) setError(apiError(err, errorMessage));
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [errorMessage]);

    return { data, loading, error, reload, setData };
}
