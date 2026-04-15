// ══════════════════════════════════════════════════════════════════
// Super-Binary-Analyser — ULTRA Signal Engine v3.0
// 24h High-Accuracy · Session-Aware · All-Market Intelligence
// Indicators: RSI·MACD·EMA·BB·Stoch·ADX·ATR·Candles·Pivot·Fib
//             Liquidity·CandlePower·S/R·Trend·5SecConfirmation
// ══════════════════════════════════════════════════════════════════

import { OHLCV } from './twelvedata';

export type SignalType = 'BUY' | 'SELL' | 'WAIT';
export type SignalStrength = 'STRONG' | 'MEDIUM' | 'WEAK';

export interface Signal {
  id: string;
  pair: string;
  type: SignalType;
  strength: SignalStrength;
  confidence: number;
  timestamp: number;
  entry: number;
  indicators: IndicatorResult;
  expirySeconds: number;
  expiry: number;
  session: string;
  sessionScore: number;
  manipulationWarning: boolean;
  manipulationReason: string;
  safeSignal: boolean;
  // New v3 fields
  pivotPoint: number;
  resistance1: number;
  support1: number;
  fibLevel: string;
  liquidityZone: 'HIGH' | 'MEDIUM' | 'LOW';
  trendDirection: 'UP' | 'DOWN' | 'SIDEWAYS';
  candlePower: number; // 0–100
  confirmation5s: boolean;
  entryQuality: 'PERFECT' | 'GOOD' | 'FAIR' | 'POOR';
}

export interface IndicatorResult {
  rsi: number;
  rsiSignal: SignalType;
  rsiDivergence: boolean;
  macdLine: number;
  macdSignal: number;
  macdHistogram: number;
  macdDirection: SignalType;
  macdCrossover: boolean;
  ema5: number;
  ema20: number;
  ema50: number;
  ema200: number;
  emaCross: SignalType;
  emaAlignment: boolean;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  bbWidth: number;
  bbPosition: 'UPPER' | 'MIDDLE' | 'LOWER';
  bbSignal: SignalType;
  bbSqueeze: boolean;
  stochK: number;
  stochD: number;
  stochSignal: SignalType;
  stochCross: boolean;
  adx: number;
  adxTrend: 'TRENDING' | 'RANGING';
  adxMomentum: 'RISING' | 'FALLING';
  atr: number;
  atrNormal: boolean;
  atrPercentile: number;
  candlePattern: string;
  candleSignal: SignalType;
  candlePatternStrength: number;
  trendStrength: number;
  volumeConfirmation: boolean;
  volumeSpike: boolean;
  volumeRatio: number;
  overallScore: number;
  // New v3 indicators
  rsiPrev: number;
  momentumScore: number;
  priceVelocity: number;
  supportLevel: number;
  resistanceLevel: number;
  nearKeyLevel: boolean;
  levelType: 'SUPPORT' | 'RESISTANCE' | 'NONE';
}

// ── Math Helpers ───────────────────────────────────────────────────
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const avg = (arr: number[]) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

const calcEMA = (data: number[], period: number): number[] => {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
};

const calcSMA = (data: number[], period: number): number => {
  if (data.length === 0) return 0;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
};

const calcRSI = (closes: number[], period: number = 14): number => {
  if (closes.length < period + 1) return 50;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss += Math.abs(diff);
  }
  avgGain /= period; avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
};

const calcMACD = (closes: number[]) => {
  if (closes.length < 35) return { line: 0, signal: 0, histogram: 0, prevHistogram: 0 };
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine, 9);
  const last = macdLine.length - 1;
  return {
    line: macdLine[last],
    signal: signalLine[last],
    histogram: macdLine[last] - signalLine[last],
    prevHistogram: last > 0 ? macdLine[last - 1] - signalLine[last - 1] : 0,
  };
};

const calcBB = (closes: number[], period: number = 20, mult: number = 2) => {
  if (closes.length < period) return { upper: 0, middle: 0, lower: 0, width: 0 };
  const sma = calcSMA(closes, period);
  const slice = closes.slice(-period);
  const variance = slice.reduce((acc, v) => acc + Math.pow(v - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  const upper = sma + mult * stdDev;
  const lower = sma - mult * stdDev;
  return { upper, middle: sma, lower, width: sma > 0 ? (upper - lower) / sma : 0 };
};

const calcStochastic = (candles: OHLCV[], period: number = 14): { k: number; d: number; prevK: number } => {
  if (candles.length < period + 1) return { k: 50, d: 50, prevK: 50 };
  const kValues: number[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const hh = Math.max(...slice.map((c) => c.high));
    const ll = Math.min(...slice.map((c) => c.low));
    const range = hh - ll;
    kValues.push(range > 0 ? ((candles[i].close - ll) / range) * 100 : 50);
  }
  const k = kValues[kValues.length - 1];
  const prevK = kValues.length >= 2 ? kValues[kValues.length - 2] : k;
  const d = calcSMA(kValues, Math.min(3, kValues.length));
  return { k, d, prevK };
};

const calcADX = (candles: OHLCV[], period: number = 14): { adx: number; prevAdx: number } => {
  if (candles.length < period + 2) return { adx: 25, prevAdx: 25 };
  const trValues: number[] = [], plusDM: number[] = [], minusDM: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1];
    trValues.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
    const up = c.high - p.high, dn = p.low - c.low;
    plusDM.push(up > dn && up > 0 ? up : 0);
    minusDM.push(dn > up && dn > 0 ? dn : 0);
  }
  const atr14 = calcSMA(trValues, period);
  if (atr14 === 0) return { adx: 25, prevAdx: 25 };
  const pdi = (calcSMA(plusDM, period) / atr14) * 100;
  const mdi = (calcSMA(minusDM, period) / atr14) * 100;
  const dx = pdi + mdi > 0 ? (Math.abs(pdi - mdi) / (pdi + mdi)) * 100 : 0;
  // Prev ADX
  const prevAtr = calcSMA(trValues.slice(0, -1), period);
  const prevPdi = prevAtr > 0 ? (calcSMA(plusDM.slice(0, -1), period) / prevAtr) * 100 : 0;
  const prevMdi = prevAtr > 0 ? (calcSMA(minusDM.slice(0, -1), period) / prevAtr) * 100 : 0;
  const prevDx = prevPdi + prevMdi > 0 ? (Math.abs(prevPdi - prevMdi) / (prevPdi + prevMdi)) * 100 : 0;
  return { adx: dx, prevAdx: prevDx };
};

const calcATR = (candles: OHLCV[], period: number = 14): number => {
  if (candles.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1];
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
  }
  return calcSMA(trs, period);
};

// ── Pivot Point (Standard) ─────────────────────────────────────────
const calcPivot = (candles: OHLCV[]) => {
  if (candles.length < 2) return { pp: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 };
  // Use previous 20 candles for pivot calculation
  const slice = candles.slice(-21, -1);
  const high = Math.max(...slice.map(c => c.high));
  const low = Math.min(...slice.map(c => c.low));
  const close = slice[slice.length - 1].close;
  const pp = (high + low + close) / 3;
  const r1 = 2 * pp - low;
  const r2 = pp + (high - low);
  const r3 = high + 2 * (pp - low);
  const s1 = 2 * pp - high;
  const s2 = pp - (high - low);
  const s3 = low - 2 * (high - pp);
  return { pp, r1, r2, r3, s1, s2, s3 };
};

// ── Fibonacci Levels ───────────────────────────────────────────────
const calcFibonacci = (candles: OHLCV[], lookback: number = 50) => {
  const slice = candles.slice(-lookback);
  const high = Math.max(...slice.map(c => c.high));
  const low = Math.min(...slice.map(c => c.low));
  const diff = high - low;
  return {
    f0: low,
    f236: low + diff * 0.236,
    f382: low + diff * 0.382,
    f500: low + diff * 0.500,
    f618: low + diff * 0.618,
    f786: low + diff * 0.786,
    f100: high,
    high,
    low,
  };
};

// ── Support & Resistance Detection ───────────────────────────────
const calcSupportResistance = (candles: OHLCV[], lookback: number = 40) => {
  const slice = candles.slice(-lookback);
  const curClose = candles[candles.length - 1].close;
  // Find swing highs/lows
  const swingHighs: number[] = [];
  const swingLows: number[] = [];
  for (let i = 2; i < slice.length - 2; i++) {
    if (slice[i].high > slice[i-1].high && slice[i].high > slice[i-2].high &&
        slice[i].high > slice[i+1].high && slice[i].high > slice[i+2].high) {
      swingHighs.push(slice[i].high);
    }
    if (slice[i].low < slice[i-1].low && slice[i].low < slice[i-2].low &&
        slice[i].low < slice[i+1].low && slice[i].low < slice[i+2].low) {
      swingLows.push(slice[i].low);
    }
  }
  // Find nearest S/R to current price
  const nearResistance = swingHighs.filter(h => h > curClose).sort((a,b) => a - b)[0] ?? curClose * 1.001;
  const nearSupport = swingLows.filter(l => l < curClose).sort((a,b) => b - a)[0] ?? curClose * 0.999;
  const atr = calcATR(candles, 14);
  const atNearLevel = Math.abs(curClose - nearResistance) < atr * 0.5 ||
                      Math.abs(curClose - nearSupport) < atr * 0.5;
  const levelType = atNearLevel
    ? (Math.abs(curClose - nearResistance) < Math.abs(curClose - nearSupport) ? 'RESISTANCE' : 'SUPPORT')
    : 'NONE';
  return { support: nearSupport, resistance: nearResistance, atNearLevel, levelType };
};

// ── Liquidity Zone Detection ───────────────────────────────────────
const calcLiquidity = (candles: OHLCV[]): 'HIGH' | 'MEDIUM' | 'LOW' => {
  if (candles.length < 10) return 'MEDIUM';
  const recent = candles.slice(-10);
  const avgVol = avg(recent.map(c => c.volume));
  const volStd = Math.sqrt(recent.reduce((a, c) => a + Math.pow(c.volume - avgVol, 2), 0) / recent.length);
  const avgRange = avg(recent.map(c => c.high - c.low));
  // High liquidity: consistent volume + normal spread
  if (avgVol > 5000 && volStd / avgVol < 0.5) return 'HIGH';
  if (avgVol > 1000 && avgRange > 0) return 'MEDIUM';
  return 'LOW';
};

// ── Candle Power Score ────────────────────────────────────────────
const calcCandlePower = (candles: OHLCV[]): number => {
  if (candles.length < 5) return 50;
  const recent = candles.slice(-5);
  let bullPower = 0, bearPower = 0;
  for (const c of recent) {
    const body = Math.abs(c.close - c.open);
    const range = c.high - c.low || 0.0001;
    const power = (body / range) * 100;
    if (c.close > c.open) bullPower += power;
    else bearPower += power;
  }
  const total = bullPower + bearPower;
  if (total === 0) return 50;
  const last = recent[recent.length - 1];
  if (last.close > last.open) return clamp(Math.round((bullPower / total) * 100), 0, 100);
  return clamp(Math.round((bearPower / total) * 100), 0, 100);
};

// ── Trend Direction ───────────────────────────────────────────────
const calcTrendDirection = (closes: number[], ema20: number, ema50: number): 'UP' | 'DOWN' | 'SIDEWAYS' => {
  const recentClose = closes[closes.length - 1];
  const older = closes[closes.length - 20];
  const pctChange = older > 0 ? ((recentClose - older) / older) * 100 : 0;
  if (ema20 > ema50 * 1.0003 && pctChange > 0.1) return 'UP';
  if (ema20 < ema50 * 0.9997 && pctChange < -0.1) return 'DOWN';
  return 'SIDEWAYS';
};

// ── 5-Second Candle Confirmation ──────────────────────────────────
const calc5sConfirmation = (candles: OHLCV[], signalType: SignalType): boolean => {
  if (candles.length < 3 || signalType === 'WAIT') return false;
  const [c2, c1, c0] = candles.slice(-3);
  // Last 3 candles agree with signal direction
  if (signalType === 'BUY') {
    const allBullish = c0.close > c0.open && c1.close > c1.open;
    const momentum = c0.close > c1.close;
    return allBullish || momentum;
  } else {
    const allBearish = c0.close < c0.open && c1.close < c1.open;
    const momentum = c0.close < c1.close;
    return allBearish || momentum;
  }
};

// ── Price Velocity ─────────────────────────────────────────────────
const calcPriceVelocity = (closes: number[]): number => {
  if (closes.length < 10) return 0;
  const recent = closes.slice(-10);
  let velocity = 0;
  for (let i = 1; i < recent.length; i++) {
    velocity += (recent[i] - recent[i - 1]) / (recent[i - 1] || 1) * 100;
  }
  return velocity;
};

// ── RSI Divergence ────────────────────────────────────────────────
const detectRSIDivergence = (closes: number[], rsiCurrent: number): boolean => {
  if (closes.length < 20) return false;
  const prev5 = closes.slice(-15, -5);
  const last5 = closes.slice(-5);
  const avgPrev = avg(prev5);
  const avgLast = avg(last5);
  const rsiPrev = calcRSI(closes.slice(0, -5), 14);
  // Bullish divergence: price lower but RSI higher
  if (avgLast < avgPrev && rsiCurrent > rsiPrev + 5) return true;
  // Bearish divergence: price higher but RSI lower
  if (avgLast > avgPrev && rsiCurrent < rsiPrev - 5) return true;
  return false;
};

// ── Momentum Score ────────────────────────────────────────────────
const calcMomentumScore = (closes: number[], rsi: number, adx: number): number => {
  const velocity = calcPriceVelocity(closes);
  const adxFactor = clamp(adx / 50, 0, 1);
  const rsiFactor = rsi > 50 ? (rsi - 50) / 50 : (50 - rsi) / 50;
  return clamp(Math.round((Math.abs(velocity) * 20 + adxFactor * 40 + rsiFactor * 40)), 0, 100);
};

// ── Fibonacci Level Detection ─────────────────────────────────────
const getFibLevel = (price: number, fib: ReturnType<typeof calcFibonacci>): string => {
  const levels = [
    { name: '0%', val: fib.f0 },
    { name: '23.6%', val: fib.f236 },
    { name: '38.2%', val: fib.f382 },
    { name: '50%', val: fib.f500 },
    { name: '61.8%', val: fib.f618 },
    { name: '78.6%', val: fib.f786 },
    { name: '100%', val: fib.f100 },
  ];
  const diff = fib.high - fib.low;
  const threshold = diff * 0.04;
  const near = levels.find(l => Math.abs(price - l.val) < threshold);
  return near ? `Fib ${near.name}` : 'Between Fibs';
};

// ── Candle Manipulation Detection ─────────────────────────────────
const detectManipulation = (candles: OHLCV[], atr: number): { detected: boolean; reason: string } => {
  if (candles.length < 5 || atr === 0) return { detected: false, reason: '' };
  const last = candles[candles.length - 1];
  const body = Math.abs(last.close - last.open);
  const range = last.high - last.low;
  const upperWick = last.high - Math.max(last.close, last.open);
  const lowerWick = Math.min(last.close, last.open) - last.low;
  if (range > atr * 3.5) return { detected: true, reason: 'Price spike (3.5×ATR) — news spike detected' };
  if (body > 0 && (upperWick > body * 4.5 || lowerWick > body * 4.5))
    return { detected: true, reason: 'Pin-bar trap — false breakout / stop hunt' };
  const recent5 = candles.slice(-7, -1);
  const colors = recent5.map(c => c.close > c.open ? 1 : -1);
  if (colors.every(c => c === colors[0]) && colors.length >= 6)
    return { detected: true, reason: `${colors[0] > 0 ? 'Pump' : 'Dump'} detected — reversal risk` };
  const avgVol = avg(candles.slice(-6, -1).map(c => c.volume));
  if (last.volume > avgVol * 3 && body < atr * 0.25)
    return { detected: true, reason: 'Volume absorption / stop hunt pattern' };
  const prevClose = candles[candles.length - 2].close;
  if (Math.abs(last.open - prevClose) > atr * 0.6)
    return { detected: true, reason: 'Gap open — wait for gap fill' };
  return { detected: false, reason: '' };
};

// ── Session Detection ─────────────────────────────────────────────
const getCurrentSession = (): { name: string; score: number } => {
  const h = new Date().getUTCHours();
  if (h >= 8 && h < 12) return { name: 'London + Frankfurt', score: 22 };
  if (h >= 13 && h < 17) return { name: 'London + New York ⚡', score: 30 };
  if (h >= 17 && h < 20) return { name: 'New York', score: 18 };
  if (h >= 20 && h < 22) return { name: 'New York Close', score: 12 };
  if (h >= 22 || h < 1)  return { name: 'Sydney Open', score: 10 };
  if (h >= 0 && h < 3)   return { name: 'Tokyo + Sydney', score: 14 };
  if (h >= 3 && h < 8)   return { name: 'Tokyo + London', score: 18 };
  return { name: 'Off-peak', score: 5 };
};

// ── Candle Pattern Detection ──────────────────────────────────────
const detectCandlePattern = (candles: OHLCV[]): { pattern: string; signal: SignalType; strength: number } => {
  if (candles.length < 4) return { pattern: 'None', signal: 'WAIT', strength: 0 };
  const [c3, c2, c1, c0] = candles.slice(-4);
  const body0 = Math.abs(c0.close - c0.open);
  const body1 = Math.abs(c1.close - c1.open);
  const range0 = c0.high - c0.low || 0.0001;
  const range1 = c1.high - c1.low || 0.0001;
  const isBull0 = c0.close > c0.open;
  const isBear0 = c0.close < c0.open;
  const isBull1 = c1.close > c1.open;
  const isBear1 = c1.close < c1.open;
  const isBull2 = c2.close > c2.open;
  const isBear2 = c2.close < c2.open;
  const upperWick0 = c0.high - Math.max(c0.close, c0.open);
  const lowerWick0 = Math.min(c0.close, c0.open) - c0.low;
  const upperWick1 = c1.high - Math.max(c1.close, c1.open);
  const lowerWick1 = Math.min(c1.close, c1.open) - c1.low;

  if (body0 < range0 * 0.06) return { pattern: 'Doji', signal: 'WAIT', strength: 1 };
  if (isBull0 && body0 > range0 * 0.88) return { pattern: 'Bull Marubozu', signal: 'BUY', strength: 10 };
  if (isBear0 && body0 > range0 * 0.88) return { pattern: 'Bear Marubozu', signal: 'SELL', strength: 10 };
  if (lowerWick0 > body0 * 2.5 && upperWick0 < body0 * 0.5 && isBear1) return { pattern: 'Hammer', signal: 'BUY', strength: 9 };
  if (upperWick0 > body0 * 2.5 && lowerWick0 < body0 * 0.5 && isBull1) return { pattern: 'Shooting Star', signal: 'SELL', strength: 9 };
  if (lowerWick0 > body0 * 2.5 && upperWick0 < body0 * 0.5 && isBull1) return { pattern: 'Hanging Man', signal: 'SELL', strength: 8 };
  if (upperWick0 > body0 * 2.5 && lowerWick0 < body0 * 0.5 && isBear1) return { pattern: 'Inv Hammer', signal: 'BUY', strength: 7 };
  if (isBull0 && isBear1 && c0.open <= c1.close && c0.close >= c1.open && body0 > body1)
    return { pattern: 'Bull Engulf', signal: 'BUY', strength: 10 };
  if (isBear0 && isBull1 && c0.open >= c1.close && c0.close <= c1.open && body0 > body1)
    return { pattern: 'Bear Engulf', signal: 'SELL', strength: 10 };
  if (isBull0 && isBear1 && c0.open < c1.low && c0.close > (c1.open + c1.close) / 2)
    return { pattern: 'Piercing', signal: 'BUY', strength: 9 };
  if (isBear0 && isBull1 && c0.open > c1.high && c0.close < (c1.open + c1.close) / 2)
    return { pattern: 'Dark Cloud', signal: 'SELL', strength: 9 };
  if (isBear2 && body1 < range1 * 0.3 && isBull0 && c0.close > c2.open + body0 * 0.25)
    return { pattern: 'Morning Star', signal: 'BUY', strength: 9 };
  if (isBull2 && body1 < range1 * 0.3 && isBear0 && c0.close < c2.open - body0 * 0.25)
    return { pattern: 'Evening Star', signal: 'SELL', strength: 9 };
  if (isBull0 && isBull1 && isBull2 && c0.close > c1.close && c1.close > c2.close && body0 > range0 * 0.6)
    return { pattern: '3 Soldiers', signal: 'BUY', strength: 9 };
  if (isBear0 && isBear1 && isBear2 && c0.close < c1.close && c1.close < c2.close && body0 > range0 * 0.6)
    return { pattern: '3 Crows', signal: 'SELL', strength: 9 };
  if (Math.abs(c0.low - c1.low) < range0 * 0.05 && isBull0 && isBear1)
    return { pattern: 'Tweezer Bot', signal: 'BUY', strength: 8 };
  if (Math.abs(c0.high - c1.high) < range0 * 0.05 && isBear0 && isBull1)
    return { pattern: 'Tweezer Top', signal: 'SELL', strength: 8 };
  // Inside bar
  if (c0.high < c1.high && c0.low > c1.low)
    return { pattern: 'Inside Bar', signal: 'WAIT', strength: 3 };
  // Outside bar (volatility expansion)
  if (c0.high > c1.high && c0.low < c1.low && body0 > body1 * 1.5)
    return { pattern: isBull0 ? 'Bull Outside' : 'Bear Outside', signal: isBull0 ? 'BUY' : 'SELL', strength: 8 };
  if (isBull0 && body0 > range0 * 0.65) return { pattern: 'Strong Bull', signal: 'BUY', strength: 6 };
  if (isBear0 && body0 > range0 * 0.65) return { pattern: 'Strong Bear', signal: 'SELL', strength: 6 };
  return { pattern: 'No Pattern', signal: 'WAIT', strength: 0 };
};

// ── Entry Quality Assessment ──────────────────────────────────────
const assessEntryQuality = (
  signalType: SignalType,
  manip: boolean,
  safeSignal: boolean,
  adxTrend: 'TRENDING' | 'RANGING',
  sessionScore: number,
  confidence: number,
  confirmation5s: boolean,
  nearKeyLevel: boolean,
  levelType: string,
): 'PERFECT' | 'GOOD' | 'FAIR' | 'POOR' => {
  if (signalType === 'WAIT') return 'POOR';
  if (manip) return 'POOR';
  let score = 0;
  if (safeSignal) score += 2;
  if (adxTrend === 'TRENDING') score += 2;
  if (sessionScore >= 20) score += 2;
  if (confidence >= 80) score += 2;
  if (confirmation5s) score += 2;
  // Near level adds quality if signal aligns
  if (nearKeyLevel && levelType === 'SUPPORT' && signalType === 'BUY') score += 2;
  if (nearKeyLevel && levelType === 'RESISTANCE' && signalType === 'SELL') score += 2;
  if (score >= 10) return 'PERFECT';
  if (score >= 7) return 'GOOD';
  if (score >= 4) return 'FAIR';
  return 'POOR';
};

// ── MAIN SIGNAL ENGINE v3.0 ───────────────────────────────────────
export const analyzeCandles = (candles: OHLCV[], symbol: string): Signal => {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const curClose = closes[closes.length - 1];

  // ── Core Indicators ────────────────────────────────────────────
  const rsi = calcRSI(closes, 14);
  const rsiPrev = calcRSI(closes.slice(0, -1), 14);
  const rsiDivergence = detectRSIDivergence(closes, rsi);
  const rsiSignal: SignalType =
    rsi <= 20 ? 'BUY' : rsi <= 30 ? 'BUY' : rsi >= 80 ? 'SELL' : rsi >= 70 ? 'SELL'
    : rsi < 45 ? 'BUY' : rsi > 55 ? 'SELL' : 'WAIT';
  const rsiWeight = rsi <= 20 || rsi >= 80 ? 30 : rsi <= 30 || rsi >= 70 ? 24 : 18;

  // MACD with crossover detection
  const macd = calcMACD(closes);
  const macdCrossover = (macd.histogram > 0 && macd.prevHistogram <= 0) || (macd.histogram < 0 && macd.prevHistogram >= 0);
  const macdDirection: SignalType =
    macd.histogram > 0 && macd.line > 0 ? 'BUY'
    : macd.histogram < 0 && macd.line < 0 ? 'SELL'
    : macd.histogram > 0 ? 'BUY' : macd.histogram < 0 ? 'SELL' : 'WAIT';
  const macdWeight = macdCrossover ? 28 : 20;

  // EMA (5/20/50/200)
  const ema5arr = calcEMA(closes, 5);
  const ema20arr = calcEMA(closes, 20);
  const ema50arr = calcEMA(closes, 50);
  const ema200arr = calcEMA(closes, 200);
  const ema5 = ema5arr[ema5arr.length - 1] ?? curClose;
  const ema20 = ema20arr[ema20arr.length - 1] ?? curClose;
  const ema50 = ema50arr[ema50arr.length - 1] ?? curClose;
  const ema200 = ema200arr[ema200arr.length - 1] ?? curClose;
  const ema5p = ema5arr[ema5arr.length - 2] ?? ema5;
  const ema20p = ema20arr[ema20arr.length - 2] ?? ema20;
  const emaCrossGolden = ema5 > ema20 && ema5p <= ema20p;
  const emaCrossDead = ema5 < ema20 && ema5p >= ema20p;
  const emaAlignment = (ema5 > ema20 && ema20 > ema50 && ema50 > ema200) ||
                       (ema5 < ema20 && ema20 < ema50 && ema50 < ema200);
  const emaCross: SignalType =
    emaCrossGolden ? 'BUY' : emaCrossDead ? 'SELL'
    : ema5 > ema20 && ema20 > ema50 ? 'BUY'
    : ema5 < ema20 && ema20 < ema50 ? 'SELL'
    : ema5 > ema20 ? 'BUY' : ema5 < ema20 ? 'SELL' : 'WAIT';
  const emaWeight = (emaCrossGolden || emaCrossDead) ? 28 : emaAlignment ? 25 : 18;

  // Bollinger Bands
  const bb = calcBB(closes);
  const bbPosition: 'UPPER' | 'MIDDLE' | 'LOWER' =
    curClose >= bb.upper ? 'UPPER' : curClose <= bb.lower ? 'LOWER' : 'MIDDLE';
  const bbSqueeze = bb.width < 0.0008;
  const bbSignal: SignalType = bbPosition === 'LOWER' ? 'BUY' : bbPosition === 'UPPER' ? 'SELL' : 'WAIT';

  // Stochastic with crossover
  const stoch = calcStochastic(candles, 14);
  const stochCross = (stoch.k > stoch.d && stoch.prevK <= stoch.d) || (stoch.k < stoch.d && stoch.prevK >= stoch.d);
  const stochSignal: SignalType =
    stoch.k <= 15 && stoch.d <= 20 ? 'BUY'
    : stoch.k >= 85 && stoch.d >= 80 ? 'SELL'
    : stoch.k > stoch.d && stoch.k < 40 ? 'BUY'
    : stoch.k < stoch.d && stoch.k > 60 ? 'SELL' : 'WAIT';
  const stochWeight = stochCross ? 16 : 10;

  // ADX
  const adxResult = calcADX(candles, 14);
  const adx = adxResult.adx;
  const adxTrend: 'TRENDING' | 'RANGING' = adx >= 22 ? 'TRENDING' : 'RANGING';
  const adxMomentum: 'RISING' | 'FALLING' = adx > adxResult.prevAdx ? 'RISING' : 'FALLING';

  // ATR
  const atr = calcATR(candles, 14);
  const atrHistory = candles.slice(-50).map((c, i, arr) =>
    i === 0 ? 0 : Math.max(c.high - c.low, Math.abs(c.high - arr[i-1].close), Math.abs(c.low - arr[i-1].close))
  );
  const atrSorted = [...atrHistory].sort((a, b) => a - b);
  const atrPercentile = atrSorted.length > 0
    ? Math.round((atrSorted.indexOf(atr) / atrSorted.length) * 100) : 50;
  const avgBodySize = avg(closes.slice(-10).map((c, i, arr) => i === 0 ? 0 : Math.abs(c - arr[i-1])));
  const atrNormal = atr > 0 && atr < avgBodySize * 12;

  // Volume
  const recentVols = candles.slice(-7).map(c => c.volume);
  const avgVol = avg(recentVols.slice(0, -1));
  const lastVol = recentVols[recentVols.length - 1];
  const volumeRatio = avgVol > 0 ? lastVol / avgVol : 1;
  const volumeConfirmation = volumeRatio > 1.1;
  const volumeSpike = volumeRatio > 2.8;

  // Candle Pattern
  const { pattern, signal: candleSignal, strength: candleStrength } = detectCandlePattern(candles);
  const candleWeight = Math.min(18, candleStrength + 5);

  // Trend
  const trendDirection = calcTrendDirection(closes, ema20, ema50);
  const trendStrength = clamp(50 + (ema5 - ema50) / (atr || 0.0001) * 10, 0, 100);

  // Manipulation
  const manip = detectManipulation(candles, atr);

  // Session
  const session = getCurrentSession();

  // New v3 indicators
  const pivot = calcPivot(candles);
  const fib = calcFibonacci(candles, 50);
  const fibLevel = getFibLevel(curClose, fib);
  const sr = calcSupportResistance(candles, 40);
  const liquidity = calcLiquidity(candles);
  const candlePower = calcCandlePower(candles);
  const priceVelocity = calcPriceVelocity(closes);
  const momentumScore = calcMomentumScore(closes, rsi, adx);

  // ── Weighted Score Aggregation ─────────────────────────────────
  let buyScore = 0, sellScore = 0;

  const addScore = (sig: SignalType, w: number) => {
    if (sig === 'BUY') buyScore += w;
    else if (sig === 'SELL') sellScore += w;
  };

  addScore(rsiSignal, rsiWeight);
  addScore(macdDirection, macdWeight);
  addScore(emaCross, emaWeight);
  addScore(bbSignal, 14);
  addScore(stochSignal, stochWeight);
  addScore(candleSignal, candleWeight);

  // RSI divergence bonus
  if (rsiDivergence) {
    if (rsi < 50) buyScore += 8;
    else sellScore += 8;
  }

  // Candle power alignment
  if (candlePower > 65) {
    const lastCandle = candles[candles.length - 1];
    if (lastCandle.close > lastCandle.open) buyScore += 6;
    else sellScore += 6;
  }

  // Liquidity bonus
  if (liquidity === 'HIGH') {
    buyScore *= 1.04;
    sellScore *= 1.04;
  } else if (liquidity === 'LOW') {
    buyScore *= 0.88;
    sellScore *= 0.88;
  }

  // Key S/R level bonus when price at level
  if (sr.atNearLevel) {
    if (sr.levelType === 'SUPPORT') buyScore += 10;
    else if (sr.levelType === 'RESISTANCE') sellScore += 10;
  }

  // Fibonacci key level bonus
  if (fibLevel.includes('61.8') || fibLevel.includes('38.2') || fibLevel.includes('50%')) {
    if (buyScore >= sellScore) buyScore += 5;
    else sellScore += 5;
  }

  // Volume confirmation
  if (volumeConfirmation && !volumeSpike) {
    if (buyScore >= sellScore) buyScore *= 1.06;
    else sellScore *= 1.06;
  }

  // ADX trending bonus
  if (adxTrend === 'TRENDING') {
    if (adxMomentum === 'RISING') {
      if (buyScore >= sellScore) buyScore *= 1.10;
      else sellScore *= 1.10;
    } else {
      if (buyScore >= sellScore) buyScore *= 1.05;
      else sellScore *= 1.05;
    }
  }

  // EMA full alignment mega bonus
  if (emaAlignment) {
    if (emaCross === 'BUY') buyScore *= 1.08;
    else if (emaCross === 'SELL') sellScore *= 1.08;
  }

  // MACD crossover bonus
  if (macdCrossover) {
    if (macdDirection === 'BUY') buyScore += 8;
    else if (macdDirection === 'SELL') sellScore += 8;
  }

  // BB squeeze: reduce confidence
  if (bbSqueeze) { buyScore *= 0.88; sellScore *= 0.88; }

  // Session bonus
  const sessionBonus = session.score / 100;
  if (buyScore >= sellScore) buyScore *= (1 + sessionBonus * 0.12);
  else sellScore *= (1 + sessionBonus * 0.12);

  // Manipulation & volume spike penalties
  if (manip.detected) { buyScore *= 0.65; sellScore *= 0.65; }
  if (volumeSpike) { buyScore *= 0.82; sellScore *= 0.82; }

  // Price velocity alignment bonus
  if (priceVelocity > 0.05 && buyScore > sellScore) buyScore += 5;
  else if (priceVelocity < -0.05 && sellScore > buyScore) sellScore += 5;

  const diff = Math.abs(buyScore - sellScore);
  const bigger = Math.max(buyScore, sellScore);
  const rawConf = bigger > 0 ? (diff / bigger) * 100 : 0;
  const confidence = clamp(Math.round(52 + rawConf * 0.42 + session.score * 0.12), 52, 96);

  const minThreshold = manip.detected ? 28 : adxTrend === 'RANGING' ? 20 : 14;

  let type: SignalType;
  let strength: SignalStrength;

  if (diff < minThreshold) {
    type = 'WAIT'; strength = 'WEAK';
  } else if (buyScore > sellScore) {
    type = 'BUY';
    strength = diff > 45 ? 'STRONG' : diff > 25 ? 'MEDIUM' : 'WEAK';
  } else {
    type = 'SELL';
    strength = diff > 45 ? 'STRONG' : diff > 25 ? 'MEDIUM' : 'WEAK';
  }

  if (manip.detected && strength === 'WEAK') type = 'WAIT';

  const safeSignal = !manip.detected && atrNormal && !volumeSpike;
  const confirmation5s = calc5sConfirmation(candles, type);

  const entryQuality = assessEntryQuality(
    type, manip.detected, safeSignal, adxTrend, session.score,
    confidence, confirmation5s, sr.atNearLevel, sr.levelType
  );

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
    expiry: now + 60_000,
    session: session.name,
    sessionScore: session.score,
    manipulationWarning: manip.detected,
    manipulationReason: manip.reason,
    safeSignal,
    pivotPoint: pivot.pp,
    resistance1: pivot.r1,
    support1: pivot.s1,
    fibLevel,
    liquidityZone: liquidity,
    trendDirection,
    candlePower,
    confirmation5s,
    entryQuality,
    indicators: {
      rsi, rsiSignal, rsiDivergence, rsiPrev,
      macdLine: macd.line, macdSignal: macd.signal,
      macdHistogram: macd.histogram, macdDirection, macdCrossover,
      ema5, ema20, ema50, ema200, emaCross, emaAlignment,
      bbUpper: bb.upper, bbMiddle: bb.middle, bbLower: bb.lower,
      bbWidth: bb.width, bbPosition, bbSignal, bbSqueeze,
      stochK: stoch.k, stochD: stoch.d, stochSignal, stochCross,
      adx, adxTrend, adxMomentum, atr, atrNormal, atrPercentile,
      candlePattern: pattern, candleSignal, candlePatternStrength: candleStrength,
      trendStrength, volumeConfirmation, volumeSpike, volumeRatio,
      overallScore: confidence,
      momentumScore, priceVelocity,
      supportLevel: sr.support, resistanceLevel: sr.resistance,
      nearKeyLevel: sr.atNearLevel, levelType: sr.levelType,
    },
  };
};
