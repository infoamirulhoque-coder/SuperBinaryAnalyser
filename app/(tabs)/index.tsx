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
import { hasApiKey, isWeekend, getWeekendMessage } from '@/services/twelvedata';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const {
    signals, isSignalRunning, lastSignal, startSignalEngine, stopSignalEngine,
    selectedPairs, apiKey, isWeekendLocked,
  } = useApp();
  const { runAnalysis } = useSignalEngine();

  const engineBtnAnim = useRef(new Animated.Value(1)).current;
  const signalFlash = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const weekend = isWeekend();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(statsAnim, { toValue: 1, duration: 900, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (lastSignal) {
      signalFlash.setValue(0);
      Animated.sequence([
        Animated.timing(signalFlash, { toValue: 1, duration: 250, useNativeDriver: false }),
        Animated.timing(signalFlash, { toValue: 0, duration: 900, useNativeDriver: false }),
      ]).start();
    }
  }, [lastSignal]);

  useEffect(() => {
    if (isSignalRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(engineBtnAnim, { toValue: 0.96, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(engineBtnAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      engineBtnAnim.stopAnimation();
      engineBtnAnim.setValue(1);
    }
  }, [isSignalRunning]);

  const toggleEngine = () => {
    if (weekend || isWeekendLocked) return;
    if (isSignalRunning) stopSignalEngine();
    else startSignalEngine();
  };

  const buyCount = signals.filter((s) => s.type === 'BUY').length;
  const sellCount = signals.filter((s) => s.type === 'SELL').length;
  const safeCount = signals.filter((s) => s.safeSignal).length;

  const flashColor = signalFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', 'rgba(240,180,41,0.08)'],
  });

  const isLocked = weekend || isWeekendLocked;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }]}>
          <AnimatedLogo size={50} showTitle={false} />
          <View style={styles.headerText}>
            <Text style={styles.appName}>SUPER-BINARY-ANALYSER</Text>
            <Text style={styles.appSub}>8 Indicators · Session-Aware · Manipulation Guard</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: isSignalRunning ? Colors.buy : isLocked ? Colors.sell : Colors.textMuted }]} />
        </Animated.View>

        {/* Weekend Lock Banner */}
        {isLocked && (
          <LinearGradient colors={['rgba(255,61,87,0.12)', 'rgba(255,61,87,0.05)']} style={styles.lockBanner}>
            <MaterialIcons name="lock" size={22} color={Colors.sell} />
            <View style={{ flex: 1 }}>
              <Text style={styles.lockTitle}>SIGNAL ENGINE LOCKED</Text>
              <Text style={styles.lockSub}>{getWeekendMessage()}</Text>
            </View>
          </LinearGradient>
        )}

        {/* Engine Control Button */}
        <Animated.View style={{ transform: [{ scale: engineBtnAnim }] }}>
          <TouchableOpacity onPress={toggleEngine} activeOpacity={isLocked ? 1 : 0.85} disabled={isLocked}>
            <LinearGradient
              colors={
                isLocked ? ['#2a1a1a', '#1a0a0a']
                : isSignalRunning ? [Colors.sell, '#b71c1c']
                : [Colors.gold, Colors.goldDark]
              }
              style={[styles.engineBtn, isLocked && styles.engineBtnLocked]}
            >
              <MaterialIcons
                name={isLocked ? 'lock' : isSignalRunning ? 'stop' : 'play-arrow'}
                size={28} color={isLocked ? Colors.sell : '#fff'}
              />
              <Text style={[styles.engineBtnText, isLocked && { color: Colors.sell }]}>
                {isLocked ? 'ENGINE LOCKED — WEEKEND' : isSignalRunning ? 'STOP ENGINE' : 'START ENGINE'}
              </Text>
              {isSignalRunning && !isLocked && (
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>● LIVE</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* API Key warning */}
        {!hasApiKey() && !isLocked && (
          <LinearGradient colors={['rgba(255,61,87,0.1)', 'transparent']} style={styles.warnBanner}>
            <MaterialIcons name="warning" size={16} color={Colors.sell} />
            <Text style={styles.warnText}>Add your API key in Settings → Market Data API</Text>
          </LinearGradient>
        )}

        {/* Stats row */}
        <Animated.View style={[styles.statsRow, { opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }]}>
          <StatCard label="BUY" value={buyCount} color={Colors.buy} icon="trending-up" />
          <StatCard label="SELL" value={sellCount} color={Colors.sell} icon="trending-down" />
          <StatCard label="SAFE" value={safeCount} color={Colors.blue} icon="verified" />
          <StatCard label="PAIRS" value={selectedPairs.length} color={Colors.gold} icon="currency-exchange" />
        </Animated.View>

        {/* Pair selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>▸ Active Pairs</Text>
          <PairSelector />
        </View>

        {/* Market Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>▸ Market Sessions & Clock</Text>
          <MarketSession />
        </View>

        {/* Latest Signal */}
        {lastSignal && (
          <Animated.View style={[styles.section, { backgroundColor: flashColor }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>▸ Latest Signal</Text>
              <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </LinearGradient>
            </View>
            <SignalCard signal={lastSignal} isLatest />
          </Animated.View>
        )}

        {/* Engine status */}
        <LinearGradient colors={['#111827', '#0d1117']} style={styles.statusCard}>
          <MaterialIcons name="info-outline" size={16} color={Colors.blue} />
          <Text style={styles.statusText}>
            {isLocked
              ? 'Forex markets closed on weekends. Engine auto-unlocks Sunday 21:00 UTC.'
              : isSignalRunning
              ? `Live engine · ${selectedPairs.length} pair(s) · Every 62s · Cache-optimized · 8 indicators`
              : 'Engine stopped — Press START ENGINE to begin live 1-min signals'}
          </Text>
        </LinearGradient>

        {/* Owner */}
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
  const numAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 9, useNativeDriver: true }),
      Animated.timing(numAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale: scaleAnim }], borderColor: `${color}25` }]}>
      <LinearGradient colors={[Colors.bgElevated, Colors.bgCard]} style={styles.statGrad}>
        <MaterialIcons name={icon as any} size={20} color={color} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.base, gap: Spacing.base, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  headerText: { flex: 1 },
  appName: { fontSize: 12, color: Colors.gold, fontWeight: Fonts.weights.black, letterSpacing: 1.2 },
  appSub: { fontSize: Fonts.sizes.xs, color: Colors.textMuted },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  lockBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: `${Colors.sell}35`,
  },
  lockTitle: { fontSize: Fonts.sizes.sm, color: Colors.sell, fontWeight: Fonts.weights.black, letterSpacing: 0.5 },
  lockSub: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  engineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.lg, borderRadius: Radius.xl,
  },
  engineBtnLocked: {
    borderWidth: 1, borderColor: `${Colors.sell}40`,
  },
  engineBtnText: { fontSize: Fonts.sizes.base, color: '#fff', fontWeight: Fonts.weights.black, letterSpacing: 0.8 },
  liveBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  liveBadgeText: { fontSize: 10, color: '#fff', fontWeight: Fonts.weights.black },
  warnBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: `${Colors.sell}25`,
  },
  warnText: { fontSize: Fonts.sizes.sm, color: Colors.sell, flex: 1 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1 },
  statGrad: { padding: Spacing.sm, alignItems: 'center', gap: 3 },
  statValue: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.black },
  statLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: Fonts.weights.bold, letterSpacing: 0.5 },
  section: { gap: Spacing.sm, borderRadius: Radius.md, padding: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: Fonts.weights.semibold, letterSpacing: 0.8, textTransform: 'uppercase', flex: 1 },
  newBadge: { borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },
  newBadgeText: { fontSize: 9, color: Colors.bg, fontWeight: Fonts.weights.black },
  statusCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.borderGlow,
  },
  statusText: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  ownerSection: { alignItems: 'center', gap: 4, paddingVertical: Spacing.sm },
  ownerName: { fontSize: Fonts.sizes.sm, color: Colors.gold, fontWeight: Fonts.weights.semibold },
  ownerTg: { fontSize: Fonts.sizes.sm, color: Colors.blue },
});
