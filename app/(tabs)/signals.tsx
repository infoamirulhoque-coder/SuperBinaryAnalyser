import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Animated,
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
  const { signals, clearSignals, isSignalRunning } = useApp();
  const { showAlert } = useAlert();
  const [filter, setFilter] = useState('ALL');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const filtered = filter === 'ALL' ? signals : signals.filter((s) => s.type === filter);

  const handleClear = () => {
    showAlert('Clear All Signals', 'This will remove all signal history. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearSignals },
    ]);
  };

  const buyCount = signals.filter((s) => s.type === 'BUY').length;
  const sellCount = signals.filter((s) => s.type === 'SELL').length;
  const accuracy = signals.length > 0
    ? Math.round(((buyCount + sellCount) / signals.length) * 100)
    : 0;

  const renderSignal = ({ item, index }: { item: Signal; index: number }) => (
    <SignalCard signal={item} isLatest={index === 0 && filter === 'ALL'} />
  );

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>
      {/* Header */}
      <LinearGradient colors={['#0a0d16', Colors.bg]} style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="bolt" size={20} color={Colors.gold} />
          <Text style={styles.headerTitle}>Signal History</Text>
        </View>
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.8}>
          <MaterialIcons name="delete-outline" size={18} color={Colors.sell} />
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats banner */}
      <LinearGradient colors={['#111827', '#0d1117']} style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{signals.length}</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.buy }]}>{buyCount}</Text>
          <Text style={styles.statLbl}>BUY</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.sell }]}>{sellCount}</Text>
          <Text style={styles.statLbl}>SELL</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.engineStatus, { backgroundColor: isSignalRunning ? Colors.buyBg : Colors.bgInput }]}>
            <Text style={[styles.engineStatusText, { color: isSignalRunning ? Colors.buy : Colors.textMuted }]}>
              {isSignalRunning ? '● LIVE' : '○ OFF'}
            </Text>
          </View>
          <Text style={styles.statLbl}>Engine</Text>
        </View>
      </LinearGradient>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const color = f === 'BUY' ? Colors.buy : f === 'SELL' ? Colors.sell : f === 'WAIT' ? Colors.wait : Colors.gold;
          const isActive = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, isActive && { borderColor: color, backgroundColor: `${color}15` }]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, isActive && { color }]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Signal list */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="bolt" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Signals Yet</Text>
          <Text style={styles.emptyText}>
            {isSignalRunning
              ? 'Waiting for next analysis cycle (every 60s)...'
              : 'Start the Signal Engine on Dashboard to receive signals'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderSignal}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearText: { fontSize: Fonts.sizes.sm, color: Colors.sell },
  statsBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statNum: { fontSize: Fonts.sizes.xl, color: Colors.textPrimary, fontWeight: Fonts.weights.black },
  statLbl: { fontSize: 10, color: Colors.textMuted, letterSpacing: 0.5 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  engineStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  engineStatusText: { fontSize: 11, fontWeight: Fonts.weights.bold },
  filterRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
  },
  filterTab: {
    flex: 1, paddingVertical: Spacing.sm, alignItems: 'center',
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  filterText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: Fonts.weights.semibold },
  list: { padding: Spacing.base, paddingBottom: 24 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  emptyTitle: { fontSize: Fonts.sizes.xl, color: Colors.textSecondary, fontWeight: Fonts.weights.bold },
  emptyText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
