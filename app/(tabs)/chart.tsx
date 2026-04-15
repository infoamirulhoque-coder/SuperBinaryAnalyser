import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { TradingChart, ScreenshotChart } from '@/components/TradingChart';
import { PairSelector } from '@/components/PairSelector';
import { useApp } from '@/contexts/AppContext';

const { width } = Dimensions.get('window');

const INTERVALS = [
  { label: '1M', value: '1' },
  { label: '5M', value: '5' },
  { label: '15M', value: '15' },
  { label: '30M', value: '30' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
];

const CHART_MODES = [
  { label: 'Live Chart', icon: 'show-chart', value: 'live' },
  { label: 'Analysis', icon: 'camera-alt', value: 'screenshot' },
];

export default function ChartScreen() {
  const insets = useSafeAreaInsets();
  const { activePair, lastSignal } = useApp();
  const [selectedInterval, setSelectedInterval] = useState('1');
  const [showStudies, setShowStudies] = useState(true);
  const [chartMode, setChartMode] = useState<'live' | 'screenshot'>('live');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const signalOverlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // Animate signal overlay when a new signal arrives
  useEffect(() => {
    if (lastSignal) {
      signalOverlayAnim.setValue(0);
      Animated.sequence([
        Animated.spring(signalOverlayAnim, { toValue: 1, tension: 80, friction: 9, useNativeDriver: true }),
        Animated.delay(4000),
        Animated.timing(signalOverlayAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [lastSignal?.id]);

  const chartHeight = Math.min(width * 1.05, 500);
  const signalColor = lastSignal?.type === 'BUY' ? Colors.buy : lastSignal?.type === 'SELL' ? Colors.sell : Colors.wait;

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>
      {/* Header */}
      <LinearGradient colors={['#0a0d16', Colors.bg]} style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="show-chart" size={20} color={Colors.gold} />
          <Text style={styles.headerTitle}>Live Chart</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.studiesBtn, showStudies && styles.studiesBtnOn]}
            onPress={() => setShowStudies(s => !s)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="analytics" size={14} color={showStudies ? Colors.bg : Colors.gold} />
            <Text style={[styles.studiesBtnText, showStudies && { color: Colors.bg }]}>
              {showStudies ? 'RSI/MACD ON' : 'RSI/MACD'}
            </Text>
          </TouchableOpacity>
          <View style={styles.pairBadge}>
            <Text style={styles.pairBadgeText}>{activePair}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Chart mode toggle */}
      <View style={styles.modeTabs}>
        {CHART_MODES.map(mode => (
          <TouchableOpacity
            key={mode.value}
            style={[styles.modeTab, chartMode === mode.value && styles.modeTabActive]}
            onPress={() => setChartMode(mode.value as any)}
            activeOpacity={0.8}
          >
            {chartMode === mode.value && (
              <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={StyleSheet.absoluteFill} borderRadius={Radius.md} />
            )}
            <MaterialIcons
              name={mode.icon as any}
              size={14}
              color={chartMode === mode.value ? Colors.bg : Colors.textMuted}
            />
            <Text style={[styles.modeTabText, chartMode === mode.value && styles.modeTabTextActive]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pair Selector */}
      <View style={styles.pairSelectorWrap}>
        <PairSelector />
      </View>

      {/* Interval tabs */}
      <View style={styles.intervalRow}>
        <MaterialIcons name="access-time" size={13} color={Colors.textMuted} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.intervalScroll}>
          {INTERVALS.map(iv => (
            <TouchableOpacity
              key={iv.value}
              style={[styles.intervalBtn, selectedInterval === iv.value && styles.intervalBtnActive]}
              onPress={() => setSelectedInterval(iv.value)}
              activeOpacity={0.8}
            >
              {selectedInterval === iv.value && (
                <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={StyleSheet.absoluteFill} borderRadius={Radius.sm} />
              )}
              <Text style={[styles.intervalText, selectedInterval === iv.value && styles.intervalTextActive]}>
                {iv.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chart */}
      <View style={styles.chartWrap}>
        {chartMode === 'live' ? (
          <TradingChart symbol={activePair} height={chartHeight} showStudies={showStudies} interval={selectedInterval} />
        ) : (
          <ScreenshotChart symbol={activePair} height={chartHeight} interval={selectedInterval} />
        )}

        {/* Signal overlay on chart */}
        {lastSignal && lastSignal.pair === activePair && (
          <Animated.View style={[
            styles.signalOverlay,
            { opacity: signalOverlayAnim, transform: [{ scale: signalOverlayAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }
          ]}>
            <LinearGradient
              colors={[`${signalColor}22`, `${signalColor}06`]}
              style={[styles.signalOverlayCard, { borderColor: `${signalColor}60` }]}
            >
              <MaterialIcons
                name={lastSignal.type === 'BUY' ? 'trending-up' : 'trending-down'}
                size={18} color={signalColor}
              />
              <Text style={[styles.signalOverlayType, { color: signalColor }]}>
                {lastSignal.type}
              </Text>
              <Text style={styles.signalOverlayConf}>{lastSignal.confidence}%</Text>
              <View style={[styles.signalOverlayDot, { backgroundColor: signalColor }]} />
            </LinearGradient>
          </Animated.View>
        )}
      </View>

      {/* Screenshot Mode Info Banner */}
      {chartMode === 'screenshot' && (
        <LinearGradient colors={[`${Colors.blue}12`, 'transparent']} style={styles.screenshotBanner}>
          <MaterialIcons name="camera-alt" size={14} color={Colors.blue} />
          <Text style={styles.screenshotBannerText}>
            Analysis Mode: Full chart with RSI + MACD + BB · Works with any binary broker · 1 Min signals
          </Text>
        </LinearGradient>
      )}

      {/* Info bar */}
      <LinearGradient colors={['#111827', '#0d1117']} style={styles.infoBar}>
        <View style={styles.infoItem}>
          <View style={[styles.infoDot, { backgroundColor: Colors.buy }]} />
          <Text style={styles.infoText}>Bull candle</Text>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoDot, { backgroundColor: Colors.sell }]} />
          <Text style={styles.infoText}>Bear candle</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="language" size={10} color={Colors.textMuted} />
          <Text style={styles.infoText}>TZ: Asia/Dhaka</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="speed" size={10} color={Colors.blue} />
          <Text style={styles.infoText}>1 Min Binary</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: { fontSize: Fonts.sizes.lg, color: Colors.textPrimary, fontWeight: Fonts.weights.bold },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  studiesBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.gold,
  },
  studiesBtnOn: { backgroundColor: Colors.gold },
  studiesBtnText: { fontSize: 10, color: Colors.gold, fontWeight: Fonts.weights.semibold },
  pairBadge: {
    backgroundColor: Colors.goldGlow, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  pairBadgeText: { fontSize: Fonts.sizes.sm, color: Colors.gold, fontWeight: Fonts.weights.bold },
  modeTabs: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.sm,
  },
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: Spacing.xs, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
    overflow: 'hidden',
  },
  modeTabActive: { borderColor: Colors.gold },
  modeTabText: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, fontWeight: Fonts.weights.semibold },
  modeTabTextActive: { color: Colors.bg, fontWeight: Fonts.weights.bold },
  pairSelectorWrap: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  intervalRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingLeft: Spacing.base, paddingRight: 4, paddingVertical: Spacing.sm,
  },
  intervalScroll: { flexDirection: 'row', gap: Spacing.sm, paddingRight: Spacing.base },
  intervalBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard, overflow: 'hidden',
  },
  intervalBtnActive: { borderColor: Colors.gold },
  intervalText: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  intervalTextActive: { color: Colors.bg, fontWeight: Fonts.weights.bold },
  chartWrap: { flex: 1, paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm, position: 'relative' },
  signalOverlay: {
    position: 'absolute', top: 20, right: 20, zIndex: 10,
  },
  signalOverlayCard: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.lg, borderWidth: 1,
    backgroundColor: 'rgba(5,8,16,0.85)',
  },
  signalOverlayType: { fontSize: Fonts.sizes.base, fontWeight: Fonts.weights.black, letterSpacing: 1 },
  signalOverlayConf: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, fontWeight: Fonts.weights.semibold },
  signalOverlayDot: { width: 6, height: 6, borderRadius: 3 },
  screenshotBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: `${Colors.blue}20`,
  },
  screenshotBannerText: { fontSize: Fonts.sizes.xs, color: Colors.blue, flex: 1, lineHeight: 16 },
  infoBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoDot: { width: 7, height: 7, borderRadius: 3.5 },
  infoText: { fontSize: 10, color: Colors.textMuted },
});
