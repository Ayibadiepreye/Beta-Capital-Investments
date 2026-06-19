import { Router, type IRouter, type Request, type Response } from "express";
import axios from "axios";

const router: IRouter = Router();

const ALLOWED_COINS = new Set([
  "bitcoin", "ethereum", "binancecoin", "solana", "ripple",
  "tether", "cardano", "dogecoin", "matic-network", "litecoin", "gold",
]);

const cache = new Map<string, { data: unknown; expires: number }>();
function getCache(key: string) {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data;
  return null;
}
function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

router.get("/market/prices", async (_req: Request, res: Response) => {
  try {
    const cached = getCache("market_prices");
    if (cached) return res.json(cached);

    const ids = [...ALLOWED_COINS].filter(c => c !== "gold").join(",");
    const { data } = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { timeout: 8000 }
    );
    setCache("market_prices", data, 60_000);
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ message: "Market data temporarily unavailable" });
  }
});

router.get("/market/chart/:coinId", async (req: Request, res: Response) => {
  const { coinId } = req.params;
  const days = parseInt(String(req.query.days ?? "7"), 10) || 7;

  if (!ALLOWED_COINS.has(coinId) || coinId === "gold") {
    return res.status(400).json({ message: "Invalid coin" });
  }

  const cacheKey = `chart_${coinId}_${days}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const { data } = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      { timeout: 10_000 }
    );
    setCache(cacheKey, data, 5 * 60_000);
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ message: "Chart data temporarily unavailable" });
  }
});

router.get("/market/gold", async (req: Request, res: Response) => {
  const days = parseInt(String(req.query.days ?? "7"), 10) || 7;
  const range = days <= 7 ? "7d" : days <= 30 ? "1mo" : "3mo";
  const interval = days <= 7 ? "1h" : "1d";

  const cacheKey = `gold_${days}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const { data } = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?range=${range}&interval=${interval}`,
      {
        timeout: 10_000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BetaCapital/1.0)",
          "Accept": "application/json",
        },
      }
    );
    const result = data?.chart?.result?.[0];
    if (!result) return res.status(502).json({ message: "Gold data unavailable" });
    setCache(cacheKey, data.chart, 5 * 60_000);
    res.json(data.chart);
  } catch (err: any) {
    res.status(502).json({ message: "Gold data temporarily unavailable" });
  }
});

export default router;
