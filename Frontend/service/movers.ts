const API = "http://localhost:5000";

export async function getMovers() {

    const res = await fetch(`${API}/homepage/movers`, {
        cache: "no-store"
    });

    return res.json();
}