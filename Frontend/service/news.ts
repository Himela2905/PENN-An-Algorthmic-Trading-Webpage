const API = "http://localhost:5000";

export async function getNews() {
    const res = await fetch(`${API}/homepage/news`, {
        cache: "no-store",
    });

    return res.json();
}