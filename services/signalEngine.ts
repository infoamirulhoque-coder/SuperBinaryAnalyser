// ══════════════════════════════════════════════════════════════════
// Super-Binary-Analyser — Ultra Signal Engine v2.0
// 24h High-Accuracy · Session-Aware · Candle Manipulation Detection
// Multi-indicator confluence: RSI·MACD·EMA·BB·Stoch·ADX·ATR·Candles
// ══════════════════════════════════════════════════════════════════

import { OHLCV } from './twelvedata';

export type SignalType = 'BUY' | 'SELL' | 'WAIT';
export type SignalStrength = 'STRONG' | 'MEDIUM' | 'WEAK';

export interface Signal {
  id: string;
  pair: string;
  type: SignalType;
  strength: SignalStrength;
  confidence: number; // 50–95
  timestamp: number;
  entry: number;
  indicators: IndicatorResult;
  expirySeconds: number;
  expiry: number;
  session: string;
  sessionScore: number; // bonus from active sessions
  manipulationWarning: boolean;
  manipulationReason: string;
  safeSignal: boolean; // true = no manipulation detected
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
  ema50: number;
  emaCross: SignalType;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  bbWidth: number;
  bbPosition: 'UPPER' | 'MIDDLE' | 'LOWER';
  bbSignal: SignalType;
  stochK: number;
  stochD: number;
  stochSignal: SignalType;
  adx: number;
  adxTrend: 'TRENDING' | 'RANGING';
  atr: number;
  atrNormal: boolean;
  candlePattern: string;
  candleSignal: SignalType;
  trendStrength: number;
  volumeConfirmation: boolean;
  volumeSpike: boolean;
  overallScore: number;
}

// ── Math helpers ───────────────────────────────────────────────────
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

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
  let avgGain = 0;
  let avgLoss = 0;
  // First average
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;
  // Wilder smoothing
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
};

const calcMACD = (closes: number[]) => {
  if (closes.length < 35) return { line: 0, signal: 0, histogram: 0 };
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
  if (closes.length < period) return { upper: 0, middle: 0, lower: 0, width: 0 };
  const sma = calcSMA(closes, period);
  const slice = closes.slice(-period);
  const variance = slice.reduce((acc, v) => acc + Math.pow(v - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  const upper = sma + mult * stdDev;
  const lower = sma - mult * stdDev;
  const width = sma > 0 ? (upper - lower) / sma : 0;
  return { upper, middle: sma, lower, width };
};

const calcStochastic = (candles: OHLCV[], period: number = 14): { k: number; d: number } => {
  if (candles.length < period) return { k: 50, d: 50 };
  const kValues: number[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const hh = Math.max(...slice.map((c) => c.high));
    const ll = Math.min(...slice.map((c) => c.low));
    const range = hh - ll;
    kValues.push(range > 0 ? ((candles[i].close - ll) / range) * 100 : 50);
  }
  const k = kValues[kValues.length - 1];
  const d = calcSMA(kValues, Math.min(3, kValues.length));
  return { k, d };
};

// ADX (Average Directional Index) — trend strength
const calcADX = (candles: OHLCV[], period: number = 14): number => {
  if (candles.length < period + 1) return 25;
  const trValues: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const p = candles[i - 1];
    const hl = c.high - c.low;
    const hcp = Math.abs(c.high - p.close);
    const lcp = Math.abs(c.low - p.close);
    trValues.push(Math.max(hl, hcp, lcp));

    const upMove = c.high - p.high;
    const downMove = p.low - c.low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  const atr14 = calcSMA(trValues, period);
  if (atr14 === 0) return 25;
  const pdi = (calcSMA(plusDM, period) / atr14) * 100;
  const mdi = (calcSMA(minusDM, period) / atr14) * 100;
  const dx = pdi + mdi > 0 ? (Math.abs(pdi - mdi) / (pdi + mdi)) * 100 : 0;
  return dx;
};

// ATR (Average True Range) — volatility measure
const calcATR = (candles: OHLCV[], period: number = 14): number => {
  if (candles.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const p = candles[i - 1];
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
  }
  return calcSMA(trs, period);
};

// ── Candle Manipulation Detection ─────────────────────────────────
interface ManipulationCheck {
  detected: boolean;
  reason: string;
}

const detectManipulation = (candles: OHLCV[], atr: number): ManipulationCheck => {
  if (candles.length < 5 || atr === 0) return { detected: false, reason: '' };

  const recent = candles.slice(-5);
  const last = recent[recent.length - 1];
  const body = Math.abs(last.close - last.open);
  const range = last.high - last.low;
  const upperWick = last.high - Math.max(last.close, last.open);
  const lowerWick = Math.min(last.close, last.open) - last.low;

  // 1. Spike candle: range > 3× ATR = likely manipulation / news spike
  if (range > atr * 3) {
    return { detected: true, reason: 'Price spike (3×ATR) — possible news manipulation' };
  }

  // 2. Pinbar trap: tiny body, huge wick (wick > 4× body) = trap candle
  if (body > 0 && (upperWick > body * 4 || lowerWick > body * 4)) {
    return { detected: true, reason: 'Pin-bar trap detected — false breakout risk' };
  }

  // 3. Consecutive same-color candles > 5 = possible manipulation pump/dump
  const colors = candles.slice(-6).map((c) => (c.close > c.open ? 1 : -1));
  const allSame = colors.every((c) => c === colors[0]);
  if (allSame && colors.length >= 6) {
    return { detected: true, reason: `${colors[0] > 0 ? 'Pump' : 'Dump'} pattern — reversal risk high` };
  }

  // 4. Volume spike with tiny body = absorption / stop hunt
  const avgVol = recent.slice(0, -1).reduce((a, c) => a + c.volume, 0) / 4;
  if (last.volume > avgVol * 3 && body < atr * 0.3) {
    return { detected: true, reason: 'Volume absorption — stop hunt suspected' };
  }

  // 5. Gap open (candle open far from prev close > 0.5×ATR)
  const prevClose = candles[candles.length - 2].close;
  if (Math.abs(last.open - prevClose) > atr * 0.5) {
    return { detected: true, reason: 'Gap open detected — wait for fill' };
  }

  return { detected: false, reason: '' };
};

// ── Session Detection ──────────────────────────────────────────────
interface SessionInfo {
  name: string;
  score: number; // volatility bonus
}

const getCurrentSession = (): SessionInfo => {
  const hour = new Date().getUTCHours();
  // Session overlaps get highest bonus
  if (hour >= 8 && hour < 12) return { name: 'London + Frankfurt', score: 20 };
  if (hour >= 13 && hour < 17) return { name: 'London + New York', score: 25 }; // highest vol
  if (hour >= 17 && hour < 20) return { name: 'New York', score: 15 };
  if (hour >= 20 && hour < 22) return { name: 'New York Close', score: 10 };
  if (hour >= 22 || hour < 1) return { name: 'Sydney', score: 8 };
  if (hour >= 0 && hour < 3) return { name: 'Tokyo + Sydney', score: 12 };
  if (hour >= 3 && hour < 8) return { name: 'Tokyo + London', score: 15 };
  return { name: 'Off-peak', score: 5 };
};

// ── Candle Pattern Detection ───────────────────────────────────────
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

  // Doji (indecision)
  if (body0 < range0 * 0.08) return { pattern: 'Doji', signal: 'WAIT', strength: 2 };

  // Strong Marubozu patterns (highest confidence)
  if (isBull0 && body0 > range0 * 0.85 && upperWick0 < body0 * 0.05 && lowerWick0 < body0 * 0.05)
    return { pattern: 'Bull Marubozu', signal: 'BUY', strength: 10 };
  if (isBear0 && body0 > range0 * 0.85 && upperWick0 < body0 * 0.05 && lowerWick0 < body0 * 0.05)
    return { pattern: 'Bear Marubozu', signal: 'SELL', strength: 10 };

  // Hammer (bullish reversal) — long lower wick after downtrend
  if (lowerWick0 > body0 * 2 && upperWick0 < body0 * 0.5 && isBear1)
    return { pattern: 'Hammer', signal: 'BUY', strength: 8 };

  // Inverted Hammer
  if (upperWick0 > body0 * 2 && lowerWick0 < body0 * 0.5 && isBear1)
    return { pattern: 'Inv Hammer', signal: 'BUY', strength: 6 };

  // Hanging Man (bearish) — long lower wick after uptrend
  if (lowerWick0 > body0 * 2 && upperWick0 < body0 * 0.5 && isBull1)
    return { pattern: 'Hanging Man', signal: 'SELL', strength: 7 };

  // Shooting Star (bearish) — long upper wick after uptrend
  if (upperWick0 > body0 * 2 && lowerWick0 < body0 * 0.5 && isBull1)
    return { pattern: 'Shooting Star', signal: 'SELL', strength: 8 };

  // Bullish Engulfing
  if (isBull0 && isBear1 && c0.open <= c1.close && c0.close >= c1.open && body0 > body1)
    return { pattern: 'Bull Engulf', signal: 'BUY', strength: 9 };

  // Bearish Engulfing
  if (isBear0 && isBull1 && c0.open >= c1.close && c0.close <= c1.open && body0 > body1)
    return { pattern: 'Bear Engulf', signal: 'SELL', strength: 9 };

  // Piercing Line (bullish)
  if (isBull0 && isBear1 && c0.open < c1.low && c0.close > (c1.open + c1.close) / 2)
    return { pattern: 'Piercing', signal: 'BUY', strength: 8 };

  // Dark Cloud Cover (bearish)
  if (isBear0 && isBull1 && c0.open > c1.high && c0.close < (c1.open + c1.close) / 2)
    return { pattern: 'Dark Cloud', signal: 'SELL', strength: 8 };

  // Morning Star (3-candle bullish reversal)
  if (isBear2 && body1 < range1 * 0.25 && isBull0 && c0.close > c2.open + body0 * 0.3)
    return { pattern: 'Morning Star', signal: 'BUY', strength: 9 };

  // Evening Star (3-candle bearish reversal)
  if (isBull2 && body1 < range1 * 0.25 && isBear0 && c0.close < c2.open - body0 * 0.3)
    return { pattern: 'Evening Star', signal: 'SELL', strength: 9 };

  // Three White Soldiers (strong bullish continuation)
  if (isBull0 && isBull1 && isBull2 && c0.close > c1.close && c1.close > c2.close
    && body0 > range0 * 0.6 && body1 > range1 * 0.6)
    return { pattern: '3 Soldiers', signal: 'BUY', strength: 9 };

  // Three Black Crows (strong bearish continuation)
  if (isBear0 && isBear1 && isBear2 && c0.close < c1.close && c1.close < c2.close
    && body0 > range0 * 0.6 && body1 > range1 * 0.6)
    return { pattern: '3 Crows', signal: 'SELL', strength: 9 };

  // Tweezer Bottom (bullish)
  if (Math.abs(c0.low - c1.low) < (c0.high - c0.low) * 0.05 && isBull0 && isBear1)
    return { pattern: 'Tweezer Bot', signal: 'BUY', strength: 7 };

  // Tweezer Top (bearish)
  if (Math.abs(c0.high - c1.high) < (c0.high - c0.low) * 0.05 && isBear0 && isBull1)
    return { pattern: 'Tweezer Top', signal: 'SELL', strength: 7 };

  // Generic strong candle
  if (isBull0 && body0 > range0 * 0.65) return { pattern: 'Strong Bull', signal: 'BUY', strength: 6 };
  if (isBear0 && body0 > range0 * 0.65) return { pattern: 'Strong Bear', signal: 'SELL', strength: 6 };

  return { pattern: 'No Pattern', signal: 'WAIT', strength: 0 };
};

const calcTrendStrength = (closes: number[]): number => {
  if (closes.length < 20) return 50;
  const recent = closes.slice(-5);
  const older = closes.slice(-20, -5);
  const ra = recent.reduce((a, b) => a + b, 0) / recent.length;
  const oa = older.reduce((a, b) => a + b, 0) / older.length;
  const pct = oa > 0 ? ((ra - oa) / oa) * 100 : 0;
  return clamp(50 + pct * 8, 0, 100);
};

// ── Main Signal Engine ─────────────────────────────────────────────
export const analyzeCandles = (candles: OHLCV[], symbol: string): Signal => {
  // Need min 50 candles for reliable analysis
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  // ── Indicators ──────────────────────────────────────────────────

  // RSI (14) — overbought/oversold
  const rsi = calcRSI(closes, 14);
  const rsiSignal: SignalType =
    rsi <= 25 ? 'BUY'     // extreme oversold
    : rsi <= 35 ? 'BUY'
    : rsi >= 75 ? 'SELL'  // extreme overbought
    : rsi >= 65 ? 'SELL'
    : rsi < 48 ? 'BUY'
    : rsi > 52 ? 'SELL'
    : 'WAIT';

  // RSI weight: stronger signal when extreme
  const rsiWeight = rsi <= 25 || rsi >= 75 ? 28 : rsi <= 35 || rsi >= 65 ? 22 : 18;

  // MACD
  const macd = calcMACD(closes);
  const macdDirection: SignalType =
    macd.histogram > 0 && macd.line > 0 ? 'BUY'
    : macd.histogram < 0 && macd.line < 0 ? 'SELL'
    : macd.histogram > 0 ? 'BUY'
    : macd.histogram < 0 ? 'SELL'
    : 'WAIT';

  // EMA Triple Cross (5/20/50)
  const ema5arr = calcEMA(closes, 5);
  const ema20arr = calcEMA(closes, 20);
  const ema50arr = calcEMA(closes, 50);
  const ema5 = ema5arr[ema5arr.length - 1] ?? closes[closes.length - 1];
  const ema20 = ema20arr[ema20arr.length - 1] ?? closes[closes.length - 1];
  const ema50 = ema50arr[ema50arr.length - 1] ?? closes[closes.length - 1];
  const ema5prev = ema5arr[ema5arr.length - 2] ?? ema5;
  const ema20prev = ema20arr[ema20arr.length - 2] ?? ema20;

  const emaCrossGolden = ema5 > ema20 && ema5prev <= ema20prev; // Golden cross
  const emaCrossDead = ema5 < ema20 && ema5prev >= ema20prev;   // Death cross
  const emaCross: SignalType =
    emaCrossGolden ? 'BUY'
    : emaCrossDead ? 'SELL'
    : ema5 > ema20 && ema20 > ema50 ? 'BUY'    // full bull alignment
    : ema5 < ema20 && ema20 < ema50 ? 'SELL'   // full bear alignment
    : ema5 > ema20 ? 'BUY'
    : ema5 < ema20 ? 'SELL'
    : 'WAIT';

  // EMA weight: fresh crossovers are stronger signals
  const emaWeight = (emaCrossGolden || emaCrossDead) ? 26 : 20;

  // Bollinger Bands
  const bb = calcBB(closes);
  const curClose = closes[closes.length - 1];
  const bbPosition: 'UPPER' | 'MIDDLE' | 'LOWER' =
    curClose >= bb.upper ? 'UPPER' : curClose <= bb.lower ? 'LOWER' : 'MIDDLE';
  // Squeeze: narrow BB = breakout incoming
  const bbSqueezing = bb.width < 0.001;
  const bbSignal: SignalType =
    bbPosition === 'LOWER' ? 'BUY'
    : bbPosition === 'UPPER' ? 'SELL'
    : 'WAIT';

  // Stochastic
  const stoch = calcStochastic(candles, 14);
  const stochSignal: SignalType =
    stoch.k <= 20 && stoch.d <= 20 ? 'BUY'
    : stoch.k >= 80 && stoch.d >= 80 ? 'SELL'
    : stoch.k > stoch.d && stoch.k < 45 ? 'BUY'
    : stoch.k < stoch.d && stoch.k > 55 ? 'SELL'
    : 'WAIT';

  // ADX — trend strength filter
  const adx = calcADX(candles, 14);
  const adxTrend: 'TRENDING' | 'RANGING' = adx >= 25 ? 'TRENDING' : 'RANGING';

  // ATR — volatility
  const atr = calcATR(candles, 14);
  const avgBodySize = closes.slice(-10).reduce((a, b, i, arr) => {
    if (i === 0) return 0;
    return a + Math.abs(b - arr[i - 1]);
  }, 0) / 9;
  const atrNormal = atr > 0 && atr < avgBodySize * 10; // detect extreme spikes

  // Volume analysis
  const recentVols = candles.slice(-6).map((c) => c.volume);
  const avgVol = recentVols.slice(0, -1).reduce((a, b) => a + b, 0) / 5;
  const lastVol = recentVols[recentVols.length - 1];
  const volumeConfirmation = lastVol > avgVol * 1.05;
  const volumeSpike = lastVol > avgVol * 2.5;

  // Candle pattern
  const { pattern, signal: candleSignal, strength: candleStrength } = detectCandlePattern(candles);

  // Trend strength
  const trendStrength = calcTrendStrength(closes);

  // Candle manipulation detection
  const manip = detectManipulation(candles, atr);

  // Session awareness
  const session = getCurrentSession();

  // ── Weighted Score Aggregation ───────────────────────────────────
  // Dynamic weights based on market conditions
  const weights = {
    rsi: rsiWeight,          // 18–28
    macd: 22,
    ema: emaWeight,          // 20–26
    bb: 14,
    stoch: 10,
    candle: Math.min(15, candleStrength + 5), // 5–15 based on pattern strength
  };

  let buyScore = 0;
  let sellScore = 0;
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const addScore = (sig: SignalType, w: number) => {
    if (sig === 'BUY') buyScore += w;
    else if (sig === 'SELL') sellScore += w;
  };

  addScore(rsiSignal, weights.rsi);
  addScore(macdDirection, weights.macd);
  addScore(emaCross, weights.ema);
  addScore(bbSignal, weights.bb);
  addScore(stochSignal, weights.stoch);
  addScore(candleSignal, weights.candle);

  // Volume confirmation bonus (5% boost to winning side)
  if (volumeConfirmation) {
    if (buyScore >= sellScore) buyScore *= 1.05;
    else sellScore *= 1.05;
  }

  // ADX trending bonus: confirmed trend gets extra weight
  if (adxTrend === 'TRENDING') {
    if (buyScore >= sellScore) buyScore *= 1.08;
    else sellScore *= 1.08;
  }

  // BB squeeze: reduce confidence (unclear direction)
  if (bbSqueezing) {
    buyScore *= 0.92;
    sellScore *= 0.92;
  }

  // Session bonus for high-volatility sessions
  const sessionBonus = session.score / 100;
  if (buyScore >= sellScore) buyScore *= (1 + sessionBonus * 0.1);
  else sellScore *= (1 + sessionBonus * 0.1);

  // Manipulation penalty — reduce confidence significantly
  if (manip.detected) {
    buyScore *= 0.7;
    sellScore *= 0.7;
  }

  // Volume spike reduces confidence (erratic moves)
  if (volumeSpike) {
    buyScore *= 0.85;
    sellScore *= 0.85;
  }

  const diff = Math.abs(buyScore - sellScore);
  const bigger = Math.max(buyScore, sellScore);
  const rawConfidence = bigger > 0 ? (diff / bigger) * 100 : 0;
  const confidence = clamp(Math.round(50 + rawConfidence * 0.45 + session.score * 0.1), 50, 95);

  let type: SignalType;
  let strength: SignalStrength;

  // Min threshold: must have clear majority to signal
  const minThreshold = manip.detected ? 25 : adxTrend === 'RANGING' ? 18 : 14;

  if (diff < minThreshold) {
    type = 'WAIT';
    strength = 'WEAK';
  } else if (buyScore > sellScore) {
    type = 'BUY';
    strength = diff > 40 ? 'STRONG' : diff > 22 ? 'MEDIUM' : 'WEAK';
  } else {
    type = 'SELL';
    strength = diff > 40 ? 'STRONG' : diff > 22 ? 'MEDIUM' : 'WEAK';
  }

  // If manipulation detected and signal is WEAK → force WAIT (safe signal only)
  if (manip.detected && strength === 'WEAK') {
    type = 'WAIT';
  }

  const safeSignal = !manip.detected && atrNormal && !volumeSpike;

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
    indicators: {
      rsi,
      rsiSignal,
      macdLine: macd.line,
      macdSignal: macd.signal,
      macdHistogram: macd.histogram,
      macdDirection,
      ema5,
      ema20,
      ema50,
      emaCross,
      bbUpper: bb.upper,
      bbMiddle: bb.middle,
      bbLower: bb.lower,
      bbWidth: bb.width,
      bbPosition,
      bbSignal,
      stochK: stoch.k,
      stochD: stoch.d,
      stochSignal,
      adx,
      adxTrend,
      atr,
      atrNormal,
      candlePattern: pattern,
      candleSignal,
      trendStrength,
      volumeConfirmation,
      volumeSpike,
      overallScore: confidence,
    },
  };
};
