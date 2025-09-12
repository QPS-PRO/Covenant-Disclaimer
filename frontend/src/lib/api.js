const base =
    (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
    process.env.REACT_APP_API_BASE_URL ||
    "http://localhost:8000/api";

export async function apiGet(path, { token } = {}) {
    const res = await fetch(`${base}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}
