import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { TradingChart } from '@/components/TradingChart';
import { PairSelector } from '@/components/PairSelector';
import { useApp } from '@/contexts/AppContext';

const INTERVALS = [
  { label: '1M', value: '1' },
  { label: '5M', value: '5' },
  { label: '15M', value: '15' },
  { label: '1H', value: '60' },
];

export default function ChartScreen() {
  const insets = useSafeAreaInsets();
  const { activePair } = useApp();
  const [selectedInterval, setSelectedInterval] = useState('1');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#0a0d16', Colors.bg]} style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="show-chart" size={20} color={Colors.gold} />
          <Text style={styles.headerTitle}>Live Chart</Text>
        </View>
        <View style={styles.pairBadge}>
          <Text style={styles.pairBadgeText}>{activePair}</Text>
        </View>
      </LinearGradient>

      {/* Pair Selector */}
      <View style={styles.pairSelectorWrap}>
        <PairSelector />
      </View>

      {/* Interval tabs */}
      <View style={styles.intervalRow}>
        <Text style={styles.intervalLabel}>Timeframe:</Text>
        {INTERVALS.map((iv) => (
          <TouchableOpacity
            key={iv.value}
            style={[styles.intervalBtn, selectedInterval === iv.value && styles.intervalBtnActive]}
            onPress={() => setSelectedInterval(iv.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.intervalText, selectedInterval === iv.value && styles.intervalTextActive]}>
              {iv.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <View style={styles.chartWrap}>
        <TradingChart symbol={activePair} height={420} />
      </View>

      {/* Info bar */}
      <LinearGradient colors={['#111827', '#0d1117']} style={styles.infoBar}>
        <View style={styles.infoItem}>
          <MaterialIcons name="fiber-manual-record" size={10} color={Colors.buy} />
          <Text style={styles.infoText}>Green = Bullish candle</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="fiber-manual-record" size={10} color={Colors.sell} />
          <Text style={styles.infoText}>Red = Bearish candle</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoText}>TZ: Asia/Dhaka</Text>
        </View>
      </LinearGradient>
    </View>
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
  pairBadge: {
    backgroundColor: Colors.goldGlow, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  pairBadgeText: { fontSize: Fonts.sizes.sm, color: Colors.gold, fontWeight: Fonts.weights.bold },
  pairSelectorWrap: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  intervalRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
  },
  intervalLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, marginRight: 4 },
  intervalBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  intervalBtnActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  intervalText: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  intervalTextActive: { color: Colors.bg, fontWeight: Fonts.weights.bold },
  chartWrap: { flex: 1, paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm },
  infoBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 10, color: Colors.textMuted },
});
