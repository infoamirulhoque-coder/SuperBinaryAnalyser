// Market Data Service - Provider info hidden
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

export const setApiKey = (key: string) => {
  _apiKey = key;
};

export const getApiKey = (): string => _apiKey;

export const hasApiKey = (): boolean => _apiKey.length > 0;

// Fetch OHLCV candles for 1min timeframe
export const fetchOHLCV = async (
  symbol: string,
  outputsize: number = 100
): Promise<OHLCV[]> => {
  if (!_apiKey) throw new Error('API key not configured');
  try {
    const url = `${PROVIDER_BASE}/time_series?symbol=${symbol}&interval=1min&outputsize=${outputsize}&apikey=${_apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'error' || !data.values) {
      throw new Error(data.message || 'Failed to fetch market data');
    }
    return data.values.map((v: any) => ({
      datetime: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseFloat(v.volume || '0'),
    }));
  } catch (err: any) {
    throw new Error(err.message || 'Network error');
  }
};

// Fetch real-time quote
export const fetchQuote = async (symbol: string): Promise<MarketQuote | null> => {
  if (!_apiKey) return null;
  try {
    const url = `${PROVIDER_BASE}/quote?symbol=${symbol}&apikey=${_apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'error' || !data.close) return null;
    return {
      symbol,
      price: parseFloat(data.close),
      change: parseFloat(data.change || '0'),
      changePercent: parseFloat(data.percent_change || '0'),
      open: parseFloat(data.open || '0'),
      high: parseFloat(data.fifty_two_week?.high || data.high || '0'),
      low: parseFloat(data.fifty_two_week?.low || data.low || '0'),
      close: parseFloat(data.close),
    };
  } catch {
    return null;
  }
};

// Validate API key
export const validateApiKey = async (key: string): Promise<boolean> => {
  try {
    const url = `${PROVIDER_BASE}/api_usage?apikey=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.current_usage !== undefined || data.plan !== undefined;
  } catch {
    return false;
  }
};
