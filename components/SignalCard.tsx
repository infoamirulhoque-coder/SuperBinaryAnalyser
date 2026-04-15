import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius, Shadow } from '@/constants/theme';
import { Signal } from '@/services/signalEngine';

interface SignalCardProps {
  signal: Signal;
  isLatest?: boolean;
}

export function SignalCard({ signal, isLatest = false }: SignalCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-28)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barAnim = useRef(new Animated.Value(0)).current;
  const powerAnim = useRef(new Animated.Value(0)).current;
  const [countdown, setCountdown] = useState(Math.max(0, Math.floor((signal.expiry - Date.now()) / 1000)));
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 90, friction: 11, useNativeDriver: true }),
      Animated.timing(barAnim, { toValue: signal.confidence / 100, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(powerAnim, { toValue: signal.candlePower / 100, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();

    if (isLatest && signal.type !== 'WAIT') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setCountdown(Math.max(0, Math.floor((signal.expiry - Date.now()) / 1000))), 1000);
    return () => clearInterval(iv);
  }, [signal.expiry]);

  const toggleExpand = () => {
    const toVal = expanded ? 0 : 1;
    Animated.spring(expandAnim, { toValue: toVal, tension: 80, friction: 10, useNativeDriver: true }).start();
    setExpanded(!expanded);
  };

  const isBuy = signal.type === 'BUY';
  const isSell = signal.type === 'SELL';
  const signalColor = isBuy ? Colors.buy : isSell ? Colors.sell : Colors.wait;
  const gradColors: [string, string] = isBuy ? ['#00E676', '#00C853'] : isSell ? ['#FF3D57', '#D32F2F'] : ['#FFC107', '#FF8F00'];
  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const powerWidth = powerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const qualityColor = signal.entryQuality === 'PERFECT' ? Colors.gold
    : signal.entryQuality === 'GOOD' ? Colors.buy
    : signal.entryQuality === 'FAIR' ? Colors.wait : Colors.textMuted;

  const qualityIcon = signal.entryQuality === 'PERFECT' ? 'stars'
    : signal.entryQuality === 'GOOD' ? 'verified'
    : signal.entryQuality === 'FAIR' ? 'check-circle'
    : 'radio-button-unchecked';

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
  };

  const ind = signal.indicators;

  const expandDetails = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Animated.View style={[
      styles.container,
      isLatest && !signal.manipulationWarning && (isBuy ? Shadow.buy : isSell ? Shadow.sell : {}),
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: isLatest ? pulseAnim : 1 }] },
    ]}>
      <LinearGradient
        colors={[Colors.bgElevated, Colors.bgCard]}
        style={[styles.card, { borderColor: `${signal.manipulationWarning ? Colors.wait : signalColor}30` }]}
      >
        {/* Manipulation Warning */}
        {signal.manipulationWarning && (
          <View style={styles.manipBanner}>
            <MaterialIcons name="warning" size={12} color={Colors.wait} />
            <Text style={styles.manipText} numberOfLines={2}>{signal.manipulationReason}</Text>
          </View>
        )}

        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.pairBlock}>
            <Text style={styles.pairText}>{signal.pair}</Text>
            <Text style={styles.timeText}>{formatTime(signal.timestamp)}</Text>
            <View style={styles.sessionRow}>
              <MaterialIcons name="place" size={9} color={Colors.blue} />
              <Text style={styles.sessionText}>{signal.session}</Text>
            </View>
          </View>

          <View style={styles.rightBlock}>
            <LinearGradient colors={gradColors} style={styles.signalBadge}>
              <MaterialIcons
                name={isBuy ? 'trending-up' : isSell ? 'trending-down' : 'trending-flat'}
                size={16} color="#fff"
              />
              <Text style={styles.signalText}>{signal.type}</Text>
            </LinearGradient>

            <View style={styles.badges}>
              {signal.safeSignal && (
                <View style={styles.safeBadge}>
                  <MaterialIcons name="verified" size={9} color={Colors.buy} />
                  <Text style={styles.safeTxt}>SAFE</Text>
                </View>
              )}
              {signal.confirmation5s && (
                <View style={styles.confirm5sBadge}>
                  <MaterialIcons name="check" size={9} color={Colors.blue} />
                  <Text style={styles.confirm5sTxt}>5s✓</Text>
                </View>
              )}
              <View style={[styles.qualityBadge, { backgroundColor: `${qualityColor}18`, borderColor: `${qualityColor}40` }]}>
                <MaterialIcons name={qualityIcon as any} size={9} color={qualityColor} />
                <Text style={[styles.qualityTxt, { color: qualityColor }]}>{signal.entryQuality}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Confidence bar */}
        <View style={styles.confRow}>
          <Text style={styles.confLabel}>Signal Confidence</Text>
          <View style={styles.confRight}>
            <Text style={[styles.strengthBadge, {
              color: signal.strength === 'STRONG' ? Colors.gold : signal.strength === 'MEDIUM' ? Colors.blue : Colors.textMuted,
            }]}>{signal.strength}</Text>
            <Text style={[styles.confPct, { color: signalColor }]}>{signal.confidence}%</Text>
          </View>
        </View>
        <View style={styles.confBarBg}>
          <Animated.View style={[styles.confBarFill, { width: barWidth as any, backgroundColor: signalColor }]} />
        </View>

        {/* Candle Power bar */}
        <View style={styles.confRow}>
          <Text style={styles.confLabel}>Candle Power</Text>
          <Text style={[styles.confPct, { color: signal.candlePower > 65 ? signalColor : Colors.textMuted }]}>
            {signal.candlePower}%
          </Text>
        </View>
        <View style={styles.confBarBg}>
          <Animated.View style={[styles.confBarFill, { width: powerWidth as any, backgroundColor: `${signalColor}80` }]} />
        </View>

        {/* Key market data row */}
        <View style={styles.marketRow}>
          <MarketPill
            label="Liquidity"
            value={signal.liquidityZone}
            color={signal.liquidityZone === 'HIGH' ? Colors.buy : signal.liquidityZone === 'MEDIUM' ? Colors.gold : Colors.textMuted}
          />
          <MarketPill
            label="Trend"
            value={signal.trendDirection}
            color={signal.trendDirection === 'UP' ? Colors.buy : signal.trendDirection === 'DOWN' ? Colors.sell : Colors.wait}
          />
          <MarketPill
            label="Fib"
            value={signal.fibLevel.replace('Fib ', '')}
            color={Colors.purple}
          />
          <MarketPill
            label="Session+"
            value={`+${signal.sessionScore}`}
            color={signal.sessionScore >= 25 ? Colors.gold : Colors.textSecondary}
          />
        </View>

        {/* ADX + ATR row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>ADX</Text>
            <Text style={[styles.metaValue, { color: ind.adxTrend === 'TRENDING' ? Colors.buy : Colors.wait }]}>
              {ind.adx.toFixed(1)} {ind.adxMomentum === 'RISING' ? '↑' : '↓'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>ATR%</Text>
            <Text style={[styles.metaValue, { color: ind.atrNormal ? Colors.textSecondary : Colors.sell }]}>
              {ind.atrPercentile}P
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>BB Width</Text>
            <Text style={styles.metaValue}>{(ind.bbWidth * 100).toFixed(3)}%</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Vol Ratio</Text>
            <Text style={[styles.metaValue, {
              color: ind.volumeSpike ? Colors.sell : ind.volumeConfirmation ? Colors.buy : Colors.textMuted
            }]}>
              {ind.volumeRatio.toFixed(2)}x
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Mom.</Text>
            <Text style={[styles.metaValue, { color: ind.momentumScore > 60 ? signalColor : Colors.textMuted }]}>
              {ind.momentumScore}
            </Text>
          </View>
        </View>

        {/* Indicator pills */}
        <View style={styles.indicatorsGrid}>
          <IndicatorPill label="RSI" value={`${ind.rsi.toFixed(1)}${ind.rsiDivergence ? '⚡' : ''}`} signal={ind.rsiSignal} />
          <IndicatorPill label="MACD" value={`${ind.macdCrossover ? '✕' : ''}${ind.macdHistogram >= 0 ? '+' : ''}${ind.macdHistogram.toFixed(5)}`} signal={ind.macdDirection} />
          <IndicatorPill label="EMA" value={ind.emaAlignment ? 'ALIGNED' : (ind.ema5 > ind.ema20 ? '↑' : '↓')} signal={ind.emaCross} />
          <IndicatorPill label="BB" value={ind.bbSqueeze ? 'SQUEEZE' : ind.bbPosition} signal={ind.bbSignal} />
          <IndicatorPill label="STOCH" value={`K${ind.stochK.toFixed(0)}${ind.stochCross ? '✕' : ''}`} signal={ind.stochSignal} />
          <IndicatorPill label="CANDLE" value={ind.candlePattern} signal={ind.candleSignal} />
          <IndicatorPill
            label="S/R"
            value={ind.nearKeyLevel ? ind.levelType : 'NONE'}
            signal={ind.nearKeyLevel ? (ind.levelType === 'SUPPORT' ? 'BUY' : 'SELL') : 'WAIT'}
          />
          <IndicatorPill
            label="Diverge"
            value={ind.rsiDivergence ? 'YES' : 'NO'}
            signal={ind.rsiDivergence ? (ind.rsi < 50 ? 'BUY' : 'SELL') : 'WAIT'}
          />
        </View>

        {/* S/R + Pivot row */}
        <View style={styles.levelRow}>
          <View style={styles.levelItem}>
            <Text style={styles.levelLabel}>Pivot</Text>
            <Text style={styles.levelVal}>{signal.pivotPoint.toFixed(5)}</Text>
          </View>
          <View style={styles.levelItem}>
            <Text style={[styles.levelLabel, { color: Colors.sell }]}>Resist.</Text>
            <Text style={[styles.levelVal, { color: Colors.sell }]}>{signal.resistance1.toFixed(5)}</Text>
          </View>
          <View style={styles.levelItem}>
            <Text style={[styles.levelLabel, { color: Colors.buy }]}>Support</Text>
            <Text style={[styles.levelVal, { color: Colors.buy }]}>{signal.support1.toFixed(5)}</Text>
          </View>
          <View style={styles.levelItem}>
            <Text style={styles.levelLabel}>Entry</Text>
            <Text style={styles.levelVal}>{signal.entry.toFixed(5)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <FooterItem
            label="Expiry"
            value={countdown > 0 ? `${countdown}s` : 'EXPIRED'}
            color={countdown > 30 ? Colors.buy : countdown > 0 ? Colors.wait : Colors.sell}
          />
          <FooterItem label="Strength" value={signal.strength}
            color={signal.strength === 'STRONG' ? Colors.gold : signal.strength === 'MEDIUM' ? Colors.blue : Colors.textMuted}
          />
          <FooterItem label="Quality" value={signal.entryQuality ?? 'FAIR'} color={qualityColor} />
          <FooterItem label="Pattern" value={ind.candlePattern} color={
            ind.candleSignal === 'BUY' ? Colors.buy : ind.candleSignal === 'SELL' ? Colors.sell : Colors.textMuted
          } />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function IndicatorPill({ label, value, signal }: { label: string; value: string; signal: string }) {
  const color = signal === 'BUY' ? Colors.buy : signal === 'SELL' ? Colors.sell : Colors.textMuted;
  const bg = signal === 'BUY' ? `${Colors.buy}12` : signal === 'SELL' ? `${Colors.sell}12` : 'transparent';
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: `${color}35` }]}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={[styles.pillValue, { color }]} numberOfLines={1} ellipsizeMode="tail">{value}</Text>
    </View>
  );
}

function MarketPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.marketPill, { borderColor: `${color}30`, backgroundColor: `${color}08` }]}>
      <Text style={styles.marketPillLabel}>{label}</Text>
      <Text style={[styles.marketPillValue, { color }]}>{value}</Text>
    </View>
  );
}

function FooterItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.footerItem}>
      <Text style={styles.footerLabel}>{label}</Text>
      <Text style={[styles.footerValue, color ? { color } : {}]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.sm },
  card: { borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, gap: Spacing.xs },
  manipBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: `${Colors.wait}15`, borderRadius: Radius.sm,
    padding: Spacing.xs, borderWidth: 1, borderColor: `${Colors.wait}35`,
  },
  manipText: { fontSize: Fonts.sizes.xs, color: Colors.wait, flex: 1, lineHeight: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pairBlock: { gap: 2, flex: 1 },
  pairText: { fontSize: Fonts.sizes.lg, color: Colors.textPrimary, fontWeight: Fonts.weights.bold },
  timeText: { fontSize: Fonts.sizes.xs, color: Colors.textMuted },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sessionText: { fontSize: Fonts.sizes.xs, color: Colors.blue },
  rightBlock: { alignItems: 'flex-end', gap: 5 },
  signalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  signalText: { fontSize: Fonts.sizes.md, color: '#fff', fontWeight: Fonts.weights.black, letterSpacing: 1 },
  badges: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' },
  safeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: `${Colors.buy}15`, borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1, borderColor: `${Colors.buy}30`,
  },
  safeTxt: { fontSize: 8, color: Colors.buy, fontWeight: Fonts.weights.black },
  confirm5sBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: `${Colors.blue}15`, borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1, borderColor: `${Colors.blue}30`,
  },
  confirm5sTxt: { fontSize: 8, color: Colors.blue, fontWeight: Fonts.weights.black },
  qualityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1,
  },
  qualityTxt: { fontSize: 8, fontWeight: Fonts.weights.black },
  confRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted },
  confPct: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold },
  strengthBadge: { fontSize: 8, fontWeight: Fonts.weights.black },
  confBarBg: { height: 4, backgroundColor: Colors.bgInput, borderRadius: 2, overflow: 'hidden' },
  confBarFill: { height: '100%', borderRadius: 2 },
  marketRow: { flexDirection: 'row', gap: Spacing.xs },
  marketPill: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.xs,
    borderRadius: Radius.sm, borderWidth: 1,
  },
  marketPillLabel: { fontSize: 7, color: Colors.textMuted, fontWeight: Fonts.weights.bold },
  marketPillValue: { fontSize: 9, fontWeight: Fonts.weights.black },
  metaRow: { flexDirection: 'row', gap: Spacing.xs },
  metaItem: { flex: 1, alignItems: 'center' },
  metaLabel: { fontSize: 7, color: Colors.textMuted, fontWeight: Fonts.weights.bold },
  metaValue: { fontSize: 8, color: Colors.textSecondary, fontWeight: Fonts.weights.semibold, textAlign: 'center' },
  indicatorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  pill: {
    borderWidth: 1, borderRadius: Radius.sm,
    paddingHorizontal: 6, paddingVertical: 3,
    alignItems: 'center', minWidth: 50, maxWidth: 100,
  },
  pillLabel: { fontSize: 7, color: Colors.textMuted, fontWeight: Fonts.weights.bold, letterSpacing: 0.3 },
  pillValue: { fontSize: 8, fontWeight: Fonts.weights.bold },
  levelRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.bgInput, borderRadius: Radius.sm, padding: Spacing.sm,
  },
  levelItem: { alignItems: 'center', flex: 1 },
  levelLabel: { fontSize: 7, color: Colors.textMuted, fontWeight: Fonts.weights.bold },
  levelVal: { fontSize: 8, color: Colors.textSecondary, fontWeight: Fonts.weights.semibold, fontFamily: 'monospace' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  footerItem: { alignItems: 'center', gap: 2, flex: 1 },
  footerLabel: { fontSize: 7, color: Colors.textMuted },
  footerValue: { fontSize: Fonts.sizes.xs, color: Colors.textPrimary, fontWeight: Fonts.weights.semibold },
});
