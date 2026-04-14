import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { SignalCard } from '@/components/SignalCard';
import { useApp } from '@/contexts/AppContext';
import { Signal } from '@/services/signalEngine';
import { useAlert } from '@/template';

const FILTERS = ['ALL', 'BUY', 'SELL', 'WAIT'];

export default function SignalsScreen() {
  const insets = useSafeAreaInsets();
  const { signals, clearSignals, isSignalRunning, isWeekendLocked } = useApp();
  const { showAlert } = useAlert();
  const [filter, setFilter] = useState('ALL');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const statsScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.spring(statsScale, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const filtered = filter === 'ALL' ? signals : signals.filter((s) => s.type === filter);

  const handleClear = () => {
    showAlert('Clear All Signals', 'Remove all signal history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearSignals },
    ]);
  };

  const buyCount = signals.filter((s) => s.type === 'BUY').length;
  const sellCount = signals.filter((s) => s.type === 'SELL').length;
  const safeCount = signals.filter((s) => s.safeSignal).length;
  const strongCount = signals.filter((s) => s.strength === 'STRONG').length;

  const renderSignal = ({ item, index }: { item: Signal; index: number }) => (
    <SignalCard signal={item} isLatest={index === 0 && filter === 'ALL'} />
  );

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>
      {/* Header */}
      <Animated.View style={{ transform: [{ translateY: headerSlide }] }}>
        <LinearGradient colors={['#0a0d16', Colors.bg]} style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="bolt" size={22} color={Colors.gold} />
            <Text style={styles.headerTitle}>Signal History</Text>
          </View>
          <View style={styles.headerRight}>
            {isWeekendLocked && (
              <View style={styles.weekendBadge}>
                <MaterialIcons name="lock" size={12} color={Colors.sell} />
                <Text style={styles.weekendBadgeText}>WEEKEND</Text>
              </View>
            )}
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.8}>
              <MaterialIcons name="delete-outline" size={18} color={Colors.sell} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Stats banner */}
      <Animated.View style={{ transform: [{ scale: statsScale }] }}>
        <LinearGradient colors={['#111827', '#0d1117']} style={styles.statsBanner}>
          <StatBlock value={signals.length} label="Total" color={Colors.textPrimary} />
          <View style={styles.statDivider} />
          <StatBlock value={buyCount} label="BUY" color={Colors.buy} />
          <View style={styles.statDivider} />
          <StatBlock value={sellCount} label="SELL" color={Colors.sell} />
          <View style={styles.statDivider} />
          <StatBlock value={safeCount} label="SAFE" color={Colors.blue} />
          <View style={styles.statDivider} />
          <StatBlock value={strongCount} label="STRONG" color={Colors.gold} />
          <View style={styles.statDivider} />
          <View style={styles.engineBlock}>
            <View style={[styles.engineDot, { backgroundColor: isSignalRunning ? Colors.buy : Colors.textMuted }]} />
            <Text style={[styles.engineLabel, { color: isSignalRunning ? Colors.buy : Colors.textMuted }]}>
              {isSignalRunning ? 'LIVE' : 'OFF'}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f, i) => {
          const color = f === 'BUY' ? Colors.buy : f === 'SELL' ? Colors.sell : f === 'WAIT' ? Colors.wait : Colors.gold;
          const isActive = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, isActive && { borderColor: color, backgroundColor: `${color}12` }]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, isActive && { color }]}>{f}</Text>
              {isActive && (
                <View style={[styles.filterDot, { backgroundColor: color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Signal list or empty state */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="bolt" size={72} color={`${Colors.textMuted}50`} />
          <Text style={styles.emptyTitle}>No Signals Yet</Text>
          <Text style={styles.emptyText}>
            {isWeekendLocked
              ? '🔒 Market closed on weekends. Engine unlocks Sunday 21:00 UTC.'
              : isSignalRunning
              ? 'Engine is live — first signal arrives within 62 seconds...'
              : 'Start the Signal Engine on Dashboard to receive 1-min signals'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderSignal}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          removeClippedSubviews
        />
      )}
    </Animated.View>
  );
}

function StatBlock({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statNum, { color }]}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  weekendBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: `${Colors.sell}15`, borderRadius: 5,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: `${Colors.sell}30`,
  },
  weekendBadgeText: { fontSize: 9, color: Colors.sell, fontWeight: Fonts.weights.black },
  clearBtn: { padding: 4 },
  statsBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.sm,
  },
  statItem: { alignItems: 'center', gap: 1 },
  statNum: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.black },
  statLbl: { fontSize: 9, color: Colors.textMuted, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.border },
  engineBlock: { alignItems: 'center', gap: 2 },
  engineDot: { width: 8, height: 8, borderRadius: 4 },
  engineLabel: { fontSize: 9, fontWeight: Fonts.weights.black },
  filterRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
  },
  filterTab: {
    flex: 1, paddingVertical: Spacing.sm, alignItems: 'center',
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard, gap: 3,
  },
  filterText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: Fonts.weights.semibold },
  filterDot: { width: 4, height: 4, borderRadius: 2 },
  list: { padding: Spacing.base, paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyTitle: { fontSize: Fonts.sizes.xl, color: Colors.textSecondary, fontWeight: Fonts.weights.bold },
  emptyText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
