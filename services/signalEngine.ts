// Super-Binary-Analyser Signal Engine
// High-Accuracy 1-Minute Binary Trading Signal System

import { OHLCV } from './twelvedata';

export type SignalType = 'BUY' | 'SELL' | 'WAIT';
export type SignalStrength = 'STRONG' | 'MEDIUM' | 'WEAK';

export interface Signal {
  id: string;
  pair: string;
  type: SignalType;
  strength: SignalStrength;
  confidence: number; // 0-100
  timestamp: number;
  entry: number;
  indicators: IndicatorResult;
  expirySeconds: number;
  expiry: number; // timestamp
}

export interface IndicatorResult {
  rsi: number;
  rsiSignal: SignalType;
  macdLine: number;
  macdSignal: number;
  macdHistogram: number;
  macdDirection: SignalType;
  ema5: number;
  ema20: number;
  emaCross: SignalType;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  bbPosition: 'UPPER' | 'MIDDLE' | 'LOWER';
  bbSignal: SignalType;
  stochK: number;
  stochD: number;
  stochSignal: SignalType;
  candlePattern: string;
  candleSignal: SignalType;
  trendStrength: number;
  volumeConfirmation: boolean;
  overallScore: number;
}

// ---- Math Utilities ----
const calcEMA = (data: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  const ema: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
};

const calcSMA = (data: number[], period: number): number => {
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
};

const calcRSI = (closes: number[], period: number = 14): number => {
  if (closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

const calcMACD = (closes: number[]) => {
  if (closes.length < 27) return { line: 0, signal: 0, histogram: 0 };
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine, 9);
  const last = macdLine.length - 1;
  return {
    line: macdLine[last],
    signal: signalLine[last],
    histogram: macdLine[last] - signalLine[last],
  };
};

const calcBB = (closes: number[], period: number = 20, mult: number = 2) => {
  const sma = calcSMA(closes, period);
  const slice = closes.slice(-period);
  const variance = slice.reduce((acc, v) => acc + Math.pow(v - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  return {
    upper: sma + mult * stdDev,
    middle: sma,
    lower: sma - mult * stdDev,
  };
};

const calcStochastic = (candles: OHLCV[], period: number = 14): { k: number; d: number } => {
  if (candles.length < period) return { k: 50, d: 50 };
  const slice = candles.slice(-period);
  const highestHigh = Math.max(...slice.map((c) => c.high));
  const lowestLow = Math.min(...slice.map((c) => c.low));
  const curClose = candles[candles.length - 1].close;
  const k = ((curClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  // Smooth D (3-period SMA of K)
  const kValues: number[] = [];
  for (let i = Math.max(0, candles.length - period - 2); i <= candles.length - 1; i++) {
    const s = candles.slice(Math.max(0, i - period + 1), i + 1);
    const hh = Math.max(...s.map((c) => c.high));
    const ll = Math.min(...s.map((c) => c.low));
    const cc = candles[i].close;
    kValues.push(((cc - ll) / (hh - ll)) * 100 || 50);
  }
  const d = calcSMA(kValues, Math.min(3, kValues.length));
  return { k, d };
};

const detectCandlePattern = (candles: OHLCV[]): { pattern: string; signal: SignalType } => {
  if (candles.length < 3) return { pattern: 'None', signal: 'WAIT' };
  const [c2, c1, c0] = candles.slice(-3);
  const body0 = Math.abs(c0.close - c0.open);
  const body1 = Math.abs(c1.close - c1.open);
  const range0 = c0.high - c0.low;
  const range1 = c1.high - c1.low;
  const isBullish0 = c0.close > c0.open;
  const isBearish0 = c0.close < c0.open;
  const isBullish1 = c1.close > c1.open;
  const isBearish1 = c1.close < c1.open;

  // Doji
  if (body0 < range0 * 0.1) return { pattern: 'Doji', signal: 'WAIT' };

  // Hammer (bullish)
  const lowerWick0 = isBullish0 ? c0.open - c0.low : c0.close - c0.low;
  if (lowerWick0 > body0 * 2 && isBearish1)
    return { pattern: 'Hammer', signal: 'BUY' };

  // Shooting Star (bearish)
  const upperWick0 = isBullish0 ? c0.high - c0.close : c0.high - c0.open;
  if (upperWick0 > body0 * 2 && isBullish1)
    return { pattern: 'Shooting Star', signal: 'SELL' };

  // Bullish Engulfing
  if (isBullish0 && isBearish1 && c0.open < c1.close && c0.close > c1.open)
    return { pattern: 'Bullish Engulfing', signal: 'BUY' };

  // Bearish Engulfing
  if (isBearish0 && isBullish1 && c0.open > c1.close && c0.close < c1.open)
    return { pattern: 'Bearish Engulfing', signal: 'SELL' };

  // Morning Star
  if (isBearish1 && isBullish0 && body1 < range1 * 0.3 && c0.close > c2.open + body0 * 0.5)
    return { pattern: 'Morning Star', signal: 'BUY' };

  // Evening Star  
  if (isBullish1 && isBearish0 && body1 < range1 * 0.3 && c0.close < c2.open - body0 * 0.5)
    return { pattern: 'Evening Star', signal: 'SELL' };

  // Strong bullish candle
  if (isBullish0 && body0 > range0 * 0.7) return { pattern: 'Marubozu Bull', signal: 'BUY' };

  // Strong bearish candle
  if (isBearish0 && body0 > range0 * 0.7) return { pattern: 'Marubozu Bear', signal: 'SELL' };

  return { pattern: 'No Pattern', signal: 'WAIT' };
};

const calcTrendStrength = (closes: number[]): number => {
  if (closes.length < 20) return 50;
  const recent = closes.slice(-10);
  const older = closes.slice(-20, -10);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  const pct = ((recentAvg - olderAvg) / olderAvg) * 100;
  return Math.min(100, Math.max(0, 50 + pct * 10));
};

// ---- Main Signal Engine ----
export const analyzeCandles = (candles: OHLCV[], symbol: string): Signal => {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  // RSI
  const rsi = calcRSI(closes, 14);
  let rsiSignal: SignalType =
    rsi < 30 ? 'BUY' : rsi > 70 ? 'SELL' : rsi < 45 ? 'BUY' : rsi > 55 ? 'SELL' : 'WAIT';

  // MACD
  const macd = calcMACD(closes);
  let macdDirection: SignalType =
    macd.histogram > 0 && macd.line > macd.signal ? 'BUY'
    : macd.histogram < 0 && macd.line < macd.signal ? 'SELL'
    : 'WAIT';

  // EMA Cross
  const ema5arr = calcEMA(closes, 5);
  const ema20arr = calcEMA(closes, 20);
  const ema5 = ema5arr[ema5arr.length - 1];
  const ema20 = ema20arr[ema20arr.length - 1];
  const ema5prev = ema5arr[ema5arr.length - 2];
  const ema20prev = ema20arr[ema20arr.length - 2];
  let emaCross: SignalType =
    ema5 > ema20 && ema5prev <= ema20prev ? 'BUY'
    : ema5 < ema20 && ema5prev >= ema20prev ? 'SELL'
    : ema5 > ema20 ? 'BUY'
    : ema5 < ema20 ? 'SELL'
    : 'WAIT';

  // Bollinger Bands
  const bb = calcBB(closes);
  const curClose = closes[closes.length - 1];
  let bbPosition: 'UPPER' | 'MIDDLE' | 'LOWER' =
    curClose >= bb.upper ? 'UPPER' : curClose <= bb.lower ? 'LOWER' : 'MIDDLE';
  let bbSignal: SignalType =
    bbPosition === 'LOWER' ? 'BUY'
    : bbPosition === 'UPPER' ? 'SELL'
    : 'WAIT';

  // Stochastic
  const stoch = calcStochastic(candles);
  let stochSignal: SignalType =
    stoch.k < 20 && stoch.d < 20 ? 'BUY'
    : stoch.k > 80 && stoch.d > 80 ? 'SELL'
    : stoch.k > stoch.d && stoch.k < 50 ? 'BUY'
    : stoch.k < stoch.d && stoch.k > 50 ? 'SELL'
    : 'WAIT';

  // Candle Pattern
  const { pattern, signal: candleSignal } = detectCandlePattern(candles);

  // Volume confirmation
  const recentVols = candles.slice(-5).map((c) => c.volume);
  const avgVol = recentVols.slice(0, -1).reduce((a, b) => a + b, 0) / 4;
  const volumeConfirmation = recentVols[recentVols.length - 1] > avgVol * 1.1;

  // Trend strength
  const trendStrength = calcTrendStrength(closes);

  // ---- Score Aggregation ----
  const signalWeights = {
    rsi: 20,
    macd: 25,
    ema: 20,
    bb: 15,
    stoch: 10,
    candle: 10,
  };

  let buyScore = 0;
  let sellScore = 0;

  if (rsiSignal === 'BUY') buyScore += signalWeights.rsi;
  else if (rsiSignal === 'SELL') sellScore += signalWeights.rsi;

  if (macdDirection === 'BUY') buyScore += signalWeights.macd;
  else if (macdDirection === 'SELL') sellScore += signalWeights.macd;

  if (emaCross === 'BUY') buyScore += signalWeights.ema;
  else if (emaCross === 'SELL') sellScore += signalWeights.ema;

  if (bbSignal === 'BUY') buyScore += signalWeights.bb;
  else if (bbSignal === 'SELL') sellScore += signalWeights.bb;

  if (stochSignal === 'BUY') buyScore += signalWeights.stoch;
  else if (stochSignal === 'SELL') sellScore += signalWeights.stoch;

  if (candleSignal === 'BUY') buyScore += signalWeights.candle;
  else if (candleSignal === 'SELL') sellScore += signalWeights.candle;

  // Volume bonus
  if (volumeConfirmation) {
    buyScore *= 1.05;
    sellScore *= 1.05;
  }

  const total = buyScore + sellScore;
  const overallScore = total > 0 ? Math.round((Math.max(buyScore, sellScore) / 100) * 100) : 50;
  const confidence = Math.min(95, Math.max(50, overallScore));

  let type: SignalType;
  let strength: SignalStrength;

  const diff = Math.abs(buyScore - sellScore);

  if (diff < 15) {
    type = 'WAIT';
    strength = 'WEAK';
  } else if (buyScore > sellScore) {
    type = 'BUY';
    strength = diff > 40 ? 'STRONG' : diff > 20 ? 'MEDIUM' : 'WEAK';
  } else {
    type = 'SELL';
    strength = diff > 40 ? 'STRONG' : diff > 20 ? 'MEDIUM' : 'WEAK';
  }

  const now = Date.now();
  return {
    id: `${symbol}-${now}`,
    pair: symbol,
    type,
    strength,
    confidence,
    timestamp: now,
    entry: curClose,
    expirySeconds: 60,
    expiry: now + 60000,
    indicators: {
      rsi,
      rsiSignal,
      macdLine: macd.line,
      macdSignal: macd.signal,
      macdHistogram: macd.histogram,
      macdDirection,
      ema5,
      ema20,
      emaCross,
      bbUpper: bb.upper,
      bbMiddle: bb.middle,
      bbLower: bb.lower,
      bbPosition,
      bbSignal,
      stochK: stoch.k,
      stochD: stoch.d,
      stochSignal,
      candlePattern: pattern,
      candleSignal,
      trendStrength,
      volumeConfirmation,
      overallScore: confidence,
    },
  };
};
