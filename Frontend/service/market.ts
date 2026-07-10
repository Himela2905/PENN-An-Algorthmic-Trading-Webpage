import { MarketIndex } from "@/types/market";

const BASE_URL = "http://localhost:5000";

export async function getMarketOverview(): Promise<MarketIndex[]> {
  try {
    const res = await fetch(`${BASE_URL}/homepage/overview`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch market overview");
    }

    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}