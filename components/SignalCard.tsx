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
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();

    if (isLatest && signal.type !== 'WAIT') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((signal.expiry - Date.now()) / 1000));
      setCountdown(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [signal.expiry]);

  const isBuy = signal.type === 'BUY';
  const isSell = signal.type === 'SELL';
  const isWait = signal.type === 'WAIT';

  const signalColor = isBuy ? Colors.buy : isSell ? Colors.sell : Colors.wait;
  const signalBg = isBuy ? Colors.buyBg : isSell ? Colors.sellBg : Colors.waitBg;
  const gradColors: [string, string] = isBuy
    ? ['#00E676', '#00C853']
    : isSell
    ? ['#FF3D57', '#D32F2F']
    : ['#FFC107', '#FF8F00'];

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const ind = signal.indicators;

  return (
    <Animated.View
      style={[
        styles.container,
        isLatest && (isBuy ? Shadow.buy : isSell ? Shadow.sell : {}),
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: isLatest ? pulseAnim : 1 }] },
      ]}
    >
      <LinearGradient
        colors={[Colors.bgElevated, Colors.bgCard]}
        style={[styles.card, { borderColor: `${signalColor}40` }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.pairBlock}>
            <Text style={styles.pairText}>{signal.pair}</Text>
            <Text style={styles.timeText}>{formatTime(signal.timestamp)}</Text>
          </View>

          <LinearGradient colors={gradColors} style={styles.signalBadge}>
            <MaterialIcons
              name={isBuy ? 'trending-up' : isSell ? 'trending-down' : 'trending-flat'}
              size={20}
              color="#fff"
            />
            <Text style={styles.signalText}>{signal.type}</Text>
          </LinearGradient>
        </View>

        {/* Confidence bar */}
        <View style={styles.confRow}>
          <Text style={styles.confLabel}>Confidence</Text>
          <Text style={[styles.confPct, { color: signalColor }]}>{signal.confidence}%</Text>
        </View>
        <View style={styles.confBarBg}>
          <Animated.View
            style={[
              styles.confBarFill,
              { width: `${signal.confidence}%` as any, backgroundColor: signalColor },
            ]}
          />
        </View>

        {/* Indicators grid */}
        <View style={styles.indicatorsGrid}>
          <IndicatorPill label="RSI" value={ind.rsi.toFixed(1)} signal={ind.rsiSignal} />
          <IndicatorPill label="MACD" value={ind.macdHistogram > 0 ? '+' : ''} signal={ind.macdDirection} />
          <IndicatorPill label="EMA" value={ind.ema5 > ind.ema20 ? '↑' : '↓'} signal={ind.emaCross} />
          <IndicatorPill label="BB" value={ind.bbPosition} signal={ind.bbSignal} />
          <IndicatorPill label="STOCH" value={`${ind.stochK.toFixed(0)}`} signal={ind.stochSignal} />
          <IndicatorPill label="CANDLE" value={ind.candlePattern.split(' ')[0]} signal={ind.candleSignal} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Entry</Text>
            <Text style={styles.footerValue}>{signal.entry.toFixed(5)}</Text>
          </View>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Strength</Text>
            <Text style={[styles.footerValue, {
              color: signal.strength === 'STRONG' ? Colors.buy
                : signal.strength === 'MEDIUM' ? Colors.gold
                : Colors.textSecondary
            }]}>{signal.strength}</Text>
          </View>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Expiry</Text>
            <Text style={[styles.footerValue, { color: countdown > 30 ? Colors.buy : Colors.sell }]}>
              {countdown > 0 ? `${countdown}s` : 'Expired'}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Volume</Text>
            <Text style={[styles.footerValue, { color: ind.volumeConfirmation ? Colors.buy : Colors.textMuted }]}>
              {ind.volumeConfirmation ? '✓' : '—'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function IndicatorPill({ label, value, signal }: { label: string; value: string; signal: string }) {
  const color = signal === 'BUY' ? Colors.buy : signal === 'SELL' ? Colors.sell : Colors.textMuted;
  const bg = signal === 'BUY' ? Colors.buyBg : signal === 'SELL' ? Colors.sellBg : 'transparent';
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: `${color}30` }]}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={[styles.pillValue, { color }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.sm },
  card: { borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, gap: Spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pairBlock: { gap: 2 },
  pairText: { fontSize: Fonts.sizes.lg, color: Colors.textPrimary, fontWeight: Fonts.weights.bold },
  timeText: { fontSize: Fonts.sizes.xs, color: Colors.textMuted },
  signalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  signalText: { fontSize: Fonts.sizes.md, color: '#fff', fontWeight: Fonts.weights.black, letterSpacing: 1 },
  confRow: { flexDirection: 'row', justifyContent: 'space-between' },
  confLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted },
  confPct: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold },
  confBarBg: { height: 4, backgroundColor: Colors.bgInput, borderRadius: 2, overflow: 'hidden' },
  confBarFill: { height: '100%', borderRadius: 2 },
  indicatorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    borderWidth: 1, borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
    alignItems: 'center', minWidth: 56,
  },
  pillLabel: { fontSize: 8, color: Colors.textMuted, fontWeight: Fonts.weights.bold, letterSpacing: 0.5 },
  pillValue: { fontSize: 9, fontWeight: Fonts.weights.bold },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border },
  footerItem: { alignItems: 'center', gap: 2 },
  footerLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted },
  footerValue: { fontSize: Fonts.sizes.sm, color: Colors.textPrimary, fontWeight: Fonts.weights.semibold },
});
