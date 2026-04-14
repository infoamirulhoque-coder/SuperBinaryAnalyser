// Market Data Service — Provider info hidden
// Ultra-efficient: minimal API calls, aggressive caching, weekend guard

const PROVIDER_BASE = 'https://api.twelvedata.com';

export interface OHLCV {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

let _apiKey = '';

export const setApiKey = (key: string) => { _apiKey = key.trim(); };
export const getApiKey = (): string => _apiKey;
export const hasApiKey = (): boolean => _apiKey.length > 0;

// ── Weekend Guard ──────────────────────────────────────────────────
// Forex market is closed Saturday 00:00 UTC → Sunday 21:00 UTC
export const isWeekend = (): boolean => {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun,1=Mon,...,6=Sat
  const hour = now.getUTCHours();
  // Saturday all day
  if (day === 6) return true;
  // Sunday before 21:00 UTC (market opens 21:00 UTC Sunday / Sydney)
  if (day === 0 && hour < 21) return true;
  return false;
};

export const getWeekendMessage = (): string => {
  const now = new Date();
  const day = now.getUTCDay();
  // Find next Sunday 21:00 UTC
  const daysUntilSunday = (7 - day) % 7;
  return day === 6
    ? 'Forex markets are CLOSED on Saturday. Engine locked until Sunday 21:00 UTC.'
    : 'Forex markets are CLOSED on Sunday until 21:00 UTC. Engine locked.';
};

// ── Cache Layer (saves API credits aggressively) ───────────────────
interface CacheEntry {
  data: OHLCV[];
  fetchedAt: number;
}

const candleCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 55_000; // 55s — refresh just before next candle

const getCached = (symbol: string): OHLCV[] | null => {
  const entry = candleCache.get(symbol);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    candleCache.delete(symbol);
    return null;
  }
  return entry.data;
};

const setCache = (symbol: string, data: OHLCV[]) => {
  candleCache.set(symbol, { data, fetchedAt: Date.now() });
};

// ── Fetch OHLCV — cost-optimised (outputsize=80 not 100) ───────────
export const fetchOHLCV = async (
  symbol: string,
  outputsize: number = 80,
  forceRefresh: boolean = false
): Promise<OHLCV[]> => {
  if (!_apiKey) throw new Error('API key not configured');
  if (isWeekend()) throw new Error('WEEKEND_CLOSED');

  if (!forceRefresh) {
    const cached = getCached(symbol);
    if (cached) return cached;
  }

  const url =
    `${PROVIDER_BASE}/time_series?symbol=${encodeURIComponent(symbol)}&interval=1min&outputsize=${outputsize}&apikey=${_apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 'error' || !data.values) {
      throw new Error(data.message || 'Failed to fetch market data');
    }
    const candles: OHLCV[] = data.values.map((v: any) => ({
      datetime: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseFloat(v.volume || '1000'),
    }));
    setCache(symbol, candles);
    return candles;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('Request timeout');
    throw new Error(err.message || 'Network error');
  }
};

// ── Real-time quote (single API call, cheap) ───────────────────────
let _quoteCache: Record<string, { data: MarketQuote; ts: number }> = {};
const QUOTE_TTL = 30_000;

export const fetchQuote = async (symbol: string): Promise<MarketQuote | null> => {
  if (!_apiKey || isWeekend()) return null;
  const cached = _quoteCache[symbol];
  if (cached && Date.now() - cached.ts < QUOTE_TTL) return cached.data;

  try {
    const url = `${PROVIDER_BASE}/price?symbol=${encodeURIComponent(symbol)}&apikey=${_apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.price) return null;
    const quote: MarketQuote = {
      symbol,
      price: parseFloat(data.price),
      change: 0,
      changePercent: 0,
      open: parseFloat(data.price),
      high: parseFloat(data.price),
      low: parseFloat(data.price),
      close: parseFloat(data.price),
    };
    _quoteCache[symbol] = { data: quote, ts: Date.now() };
    return quote;
  } catch {
    return null;
  }
};

// ── Validate API key (1 call only, checks usage endpoint) ─────────
export const validateApiKey = async (key: string): Promise<boolean> => {
  try {
    const url = `${PROVIDER_BASE}/api_usage?apikey=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout?.(8000) });
    const data = await res.json();
    return data.current_usage !== undefined || data.plan !== undefined;
  } catch {
    return false;
  }
};

// ── Clear all caches (used on settings reset) ─────────────────────
export const clearAllCaches = () => {
  candleCache.clear();
  _quoteCache = {};
};
