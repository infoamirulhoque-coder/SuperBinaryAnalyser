import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius, Shadow } from '@/constants/theme';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { MarketSession } from '@/components/MarketSession';
import { PairSelector } from '@/components/PairSelector';
import { SignalCard } from '@/components/SignalCard';
import { useApp } from '@/contexts/AppContext';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { hasApiKey } from '@/services/twelvedata';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { signals, isSignalRunning, lastSignal, startSignalEngine, stopSignalEngine, selectedPairs, apiKey } = useApp();
  const { runAnalysis } = useSignalEngine();
  const engineBtnAnim = useRef(new Animated.Value(1)).current;
  const signalFlash = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (lastSignal) {
      signalFlash.setValue(0);
      Animated.sequence([
        Animated.timing(signalFlash, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(signalFlash, { toValue: 0, duration: 700, useNativeDriver: false }),
      ]).start();
    }
  }, [lastSignal]);

  useEffect(() => {
    if (isSignalRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(engineBtnAnim, { toValue: 0.95, duration: 800, useNativeDriver: true }),
          Animated.timing(engineBtnAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      engineBtnAnim.setValue(1);
    }
  }, [isSignalRunning]);

  const toggleEngine = () => {
    if (isSignalRunning) stopSignalEngine();
    else startSignalEngine();
  };

  const buyCount = signals.filter((s) => s.type === 'BUY').length;
  const sellCount = signals.filter((s) => s.type === 'SELL').length;
  const waitCount = signals.filter((s) => s.type === 'WAIT').length;

  const flashColor = signalFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', 'rgba(240,180,41,0.1)'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <AnimatedLogo size={52} showTitle={false} />
          <View style={styles.headerText}>
            <Text style={styles.appName}>SUPER-BINARY-ANALYSER</Text>
            <Text style={styles.appSub}>1-Min Signal Engine · 6 Indicators</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: isSignalRunning ? Colors.buy : Colors.textMuted }]} />
        </Animated.View>

        {/* Engine Control */}
        <Animated.View style={{ transform: [{ scale: engineBtnAnim }] }}>
          <TouchableOpacity onPress={toggleEngine} activeOpacity={0.85}>
            <LinearGradient
              colors={isSignalRunning ? [Colors.sell, '#b71c1c'] : [Colors.gold, Colors.goldDark]}
              style={styles.engineBtn}
            >
              <MaterialIcons name={isSignalRunning ? 'stop' : 'play-arrow'} size={28} color="#fff" />
              <Text style={styles.engineBtnText}>
                {isSignalRunning ? 'STOP ENGINE' : 'START ENGINE'}
              </Text>
              {isSignalRunning && (
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {!hasApiKey() && (
          <LinearGradient colors={['rgba(255,61,87,0.1)', 'transparent']} style={styles.warnBanner}>
            <MaterialIcons name="warning" size={16} color={Colors.sell} />
            <Text style={styles.warnText}>Add your API key in Settings to activate live signals</Text>
          </LinearGradient>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard label="BUY" value={buyCount} color={Colors.buy} icon="trending-up" />
          <StatCard label="SELL" value={sellCount} color={Colors.sell} icon="trending-down" />
          <StatCard label="WAIT" value={waitCount} color={Colors.wait} icon="trending-flat" />
          <StatCard label="PAIRS" value={selectedPairs.length} color={Colors.blue} icon="currency-exchange" />
        </View>

        {/* Pair selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Pairs</Text>
          <PairSelector />
        </View>

        {/* Market Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Sessions</Text>
          <MarketSession />
        </View>

        {/* Latest Signal */}
        {lastSignal && (
          <Animated.View style={[styles.section, { backgroundColor: flashColor }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Signal</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            </View>
            <SignalCard signal={lastSignal} isLatest />
          </Animated.View>
        )}

        {/* Engine status */}
        <LinearGradient colors={['#111827', '#0d1117']} style={styles.statusCard}>
          <MaterialIcons name="info-outline" size={16} color={Colors.blue} />
          <Text style={styles.statusText}>
            {isSignalRunning
              ? `Engine running · Auto-analyzing ${selectedPairs.length} pair(s) every 60s`
              : 'Engine stopped · Press START ENGINE to begin live signals'}
          </Text>
        </LinearGradient>

        {/* Owner info */}
        <View style={styles.ownerSection}>
          <Text style={styles.ownerName}>👤 Amirul_Adnan</Text>
          <Text style={styles.ownerTg}>✈️ @amirul_adnan_trader</Text>
        </View>

      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale: scaleAnim }], borderColor: `${color}30` }]}>
      <LinearGradient colors={[Colors.bgElevated, Colors.bgCard]} style={styles.statGrad}>
        <MaterialIcons name={icon as any} size={18} color={color} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.base, gap: Spacing.base, paddingBottom: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  headerText: { flex: 1 },
  appName: { fontSize: 13, color: Colors.gold, fontWeight: Fonts.weights.black, letterSpacing: 1 },
  appSub: { fontSize: Fonts.sizes.xs, color: Colors.textMuted },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  engineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
  },
  engineBtnText: { fontSize: Fonts.sizes.lg, color: '#fff', fontWeight: Fonts.weights.black, letterSpacing: 1 },
  liveBadge: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  liveBadgeText: { fontSize: 9, color: '#fff', fontWeight: Fonts.weights.black },
  warnBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: `${Colors.sell}30`,
  },
  warnText: { fontSize: Fonts.sizes.sm, color: Colors.sell, flex: 1 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1, borderRadius: Radius.lg, overflow: 'hidden',
    borderWidth: 1,
  },
  statGrad: { padding: Spacing.sm, alignItems: 'center', gap: 2 },
  statValue: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.black },
  statLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: Fonts.weights.bold, letterSpacing: 0.5 },
  section: { gap: Spacing.sm, borderRadius: Radius.md, padding: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { fontSize: Fonts.sizes.md, color: Colors.textSecondary, fontWeight: Fonts.weights.semibold, letterSpacing: 0.5 },
  newBadge: { backgroundColor: Colors.gold, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  newBadgeText: { fontSize: 9, color: Colors.bg, fontWeight: Fonts.weights.black },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.borderGlow,
  },
  statusText: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary, flex: 1 },
  ownerSection: { alignItems: 'center', gap: 4, paddingVertical: Spacing.sm },
  ownerName: { fontSize: Fonts.sizes.sm, color: Colors.gold, fontWeight: Fonts.weights.semibold },
  ownerTg: { fontSize: Fonts.sizes.sm, color: Colors.blue },
});
