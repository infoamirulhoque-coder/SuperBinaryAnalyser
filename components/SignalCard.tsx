import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
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
  const slideAnim = useRef(new Animated.Value(-24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barAnim = useRef(new Animated.Value(0)).current;
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 90, friction: 11, useNativeDriver: true }),
      Animated.timing(barAnim, { toValue: signal.confidence / 100, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();

    if (isLatest && signal.type !== 'WAIT') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.025, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setCountdown(Math.max(0, Math.floor((signal.expiry - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(iv);
  }, [signal.expiry]);

  const isBuy = signal.type === 'BUY';
  const isSell = signal.type === 'SELL';
  const signalColor = isBuy ? Colors.buy : isSell ? Colors.sell : Colors.wait;
  const gradColors: [string, string] = isBuy ? ['#00E676', '#00C853'] : isSell ? ['#FF3D57', '#D32F2F'] : ['#FFC107', '#FF8F00'];

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const ind = signal.indicators;

  return (
    <Animated.View
      style={[
        styles.container,
        isLatest && !signal.manipulationWarning && (isBuy ? Shadow.buy : isSell ? Shadow.sell : {}),
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: isLatest ? pulseAnim : 1 }] },
      ]}
    >
      <LinearGradient
        colors={[Colors.bgElevated, Colors.bgCard]}
        style={[styles.card, { borderColor: `${signal.manipulationWarning ? Colors.wait : signalColor}35` }]}
      >
        {/* Manipulation Warning Banner */}
        {signal.manipulationWarning && (
          <View style={styles.manipBanner}>
            <MaterialIcons name="warning" size={13} color={Colors.wait} />
            <Text style={styles.manipText} numberOfLines={2}>{signal.manipulationReason}</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.pairBlock}>
            <Text style={styles.pairText}>{signal.pair}</Text>
            <Text style={styles.timeText}>{formatTime(signal.timestamp)}</Text>
            <Text style={styles.sessionText}>📍 {signal.session}</Text>
          </View>

          <View style={styles.rightBlock}>
            <LinearGradient colors={gradColors} style={styles.signalBadge}>
              <MaterialIcons
                name={isBuy ? 'trending-up' : isSell ? 'trending-down' : 'trending-flat'}
                size={18} color="#fff"
              />
              <Text style={styles.signalText}>{signal.type}</Text>
            </LinearGradient>
            {signal.safeSignal && (
              <View style={styles.safeBadge}>
                <MaterialIcons name="verified" size={10} color={Colors.buy} />
                <Text style={styles.safeText}>SAFE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Confidence bar */}
        <View style={styles.confRow}>
          <Text style={styles.confLabel}>Signal Confidence</Text>
          <Text style={[styles.confPct, { color: signalColor }]}>{signal.confidence}%</Text>
        </View>
        <View style={styles.confBarBg}>
          <Animated.View style={[styles.confBarFill, { width: barWidth as any, backgroundColor: signalColor }]} />
        </View>

        {/* ADX + Volume row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>ADX</Text>
            <Text style={[styles.metaValue, { color: ind.adxTrend === 'TRENDING' ? Colors.buy : Colors.wait }]}>
              {ind.adx.toFixed(1)} {ind.adxTrend === 'TRENDING' ? '↑TREND' : '~RANGE'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>ATR</Text>
            <Text style={[styles.metaValue, { color: ind.atrNormal ? Colors.textSecondary : Colors.sell }]}>
              {ind.atr.toFixed(5)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>BB Width</Text>
            <Text style={styles.metaValue}>{(ind.bbWidth * 100).toFixed(3)}%</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Vol</Text>
            <Text style={[styles.metaValue, { color: ind.volumeSpike ? Colors.sell : ind.volumeConfirmation ? Colors.buy : Colors.textMuted }]}>
              {ind.volumeSpike ? '⚡SPIKE' : ind.volumeConfirmation ? '✓OK' : '—'}
            </Text>
          </View>
        </View>

        {/* Indicator pills */}
        <View style={styles.indicatorsGrid}>
          <IndicatorPill label="RSI" value={ind.rsi.toFixed(1)} signal={ind.rsiSignal} />
          <IndicatorPill label="MACD" value={ind.macdHistogram >= 0 ? `+${ind.macdHistogram.toFixed(5)}` : ind.macdHistogram.toFixed(5)} signal={ind.macdDirection} />
          <IndicatorPill label="EMA" value={ind.ema5 > ind.ema20 ? '5>20↑' : '5<20↓'} signal={ind.emaCross} />
          <IndicatorPill label="BB" value={ind.bbPosition} signal={ind.bbSignal} />
          <IndicatorPill label="STOCH" value={`K${ind.stochK.toFixed(0)}`} signal={ind.stochSignal} />
          <IndicatorPill label="CANDLE" value={ind.candlePattern} signal={ind.candleSignal} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <FooterItem label="Entry" value={signal.entry.toFixed(5)} />
          <FooterItem
            label="Strength"
            value={signal.strength}
            valueColor={signal.strength === 'STRONG' ? Colors.buy : signal.strength === 'MEDIUM' ? Colors.gold : Colors.textSecondary}
          />
          <FooterItem
            label="Expires"
            value={countdown > 0 ? `${countdown}s` : 'EXPIRED'}
            valueColor={countdown > 30 ? Colors.buy : countdown > 0 ? Colors.wait : Colors.sell}
          />
          <FooterItem
            label="Session +"
            value={`+${signal.sessionScore}`}
            valueColor={signal.sessionScore >= 20 ? Colors.gold : Colors.textSecondary}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function IndicatorPill({ label, value, signal }: { label: string; value: string; signal: string }) {
  const color = signal === 'BUY' ? Colors.buy : signal === 'SELL' ? Colors.sell : Colors.textMuted;
  const bg = signal === 'BUY' ? `${Colors.buy}15` : signal === 'SELL' ? `${Colors.sell}15` : 'transparent';
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: `${color}35` }]}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={[styles.pillValue, { color }]} numberOfLines={1} ellipsizeMode="tail">{value}</Text>
    </View>
  );
}

function FooterItem({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.footerItem}>
      <Text style={styles.footerLabel}>{label}</Text>
      <Text style={[styles.footerValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.sm },
  card: { borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, gap: Spacing.sm },
  manipBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: `${Colors.wait}18`, borderRadius: Radius.sm,
    padding: Spacing.sm, borderWidth: 1, borderColor: `${Colors.wait}40`,
  },
  manipText: { fontSize: Fonts.sizes.xs, color: Colors.wait, flex: 1, lineHeight: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pairBlock: { gap: 2 },
  pairText: { fontSize: Fonts.sizes.lg, color: Colors.textPrimary, fontWeight: Fonts.weights.bold },
  timeText: { fontSize: Fonts.sizes.xs, color: Colors.textMuted },
  sessionText: { fontSize: Fonts.sizes.xs, color: Colors.blue },
  rightBlock: { alignItems: 'flex-end', gap: 4 },
  signalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  signalText: { fontSize: Fonts.sizes.md, color: '#fff', fontWeight: Fonts.weights.black, letterSpacing: 1 },
  safeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: `${Colors.buy}18`, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: `${Colors.buy}30`,
  },
  safeText: { fontSize: 8, color: Colors.buy, fontWeight: Fonts.weights.black },
  confRow: { flexDirection: 'row', justifyContent: 'space-between' },
  confLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted },
  confPct: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold },
  confBarBg: { height: 5, backgroundColor: Colors.bgInput, borderRadius: 3, overflow: 'hidden' },
  confBarFill: { height: '100%', borderRadius: 3 },
  metaRow: { flexDirection: 'row', gap: Spacing.xs, paddingVertical: 2 },
  metaItem: { flex: 1, alignItems: 'center' },
  metaLabel: { fontSize: 8, color: Colors.textMuted, fontWeight: Fonts.weights.bold },
  metaValue: { fontSize: 8, color: Colors.textSecondary, fontWeight: Fonts.weights.semibold, textAlign: 'center' },
  indicatorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  pill: {
    borderWidth: 1, borderRadius: Radius.sm,
    paddingHorizontal: 7, paddingVertical: 4,
    alignItems: 'center', minWidth: 54, maxWidth: 90,
  },
  pillLabel: { fontSize: 8, color: Colors.textMuted, fontWeight: Fonts.weights.bold, letterSpacing: 0.5 },
  pillValue: { fontSize: 8, fontWeight: Fonts.weights.bold },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  footerItem: { alignItems: 'center', gap: 2 },
  footerLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted },
  footerValue: { fontSize: Fonts.sizes.sm, color: Colors.textPrimary, fontWeight: Fonts.weights.semibold },
});
