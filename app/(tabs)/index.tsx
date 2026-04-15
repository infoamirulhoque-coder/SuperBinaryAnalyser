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
import { hasApiKey, isWeekend, getWeekendMessage } from '@/services/twelvedata';
import { useSignalEngine } from '@/hooks/useSignalEngine';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const {
    signals, isSignalRunning, lastSignal, startSignalEngine, stopSignalEngine,
    selectedPairs, apiKey, isWeekendLocked,
  } = useApp();
  useSignalEngine();

  const engineBtnAnim = useRef(new Animated.Value(1)).current;
  const signalFlash = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const weekend = isWeekend();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(statsAnim, { toValue: 1, duration: 800, delay: 150, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (lastSignal) {
      signalFlash.setValue(1);
      Animated.timing(signalFlash, { toValue: 0, duration: 1500, useNativeDriver: false }).start();
    }
  }, [lastSignal?.id]);

  useEffect(() => {
    if (isSignalRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(engineBtnAnim, { toValue: 0.97, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(engineBtnAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
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

  const buyCount = signals.filter(s => s.type === 'BUY').length;
  const sellCount = signals.filter(s => s.type === 'SELL').length;
  const safeCount = signals.filter(s => s.safeSignal).length;
  const perfectCount = signals.filter(s => (s as any).entryQuality === 'PERFECT').length;

  const flashBg = signalFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', 'rgba(240,180,41,0.07)'],
  });
  const engineGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isSignalRunning
      ? ['rgba(255,61,87,0.2)', 'rgba(255,61,87,0.5)']
      : ['rgba(240,180,41,0.2)', 'rgba(240,180,41,0.5)'],
  });

  const isLocked = weekend || isWeekendLocked;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }]
        }]}>
          <AnimatedLogo size={48} showTitle={false} />
          <View style={styles.headerText}>
            <Text style={styles.appName}>SUPER-BINARY-ANALYSER</Text>
            <Text style={styles.appSub}>v3.0 · Pivot·Fib·S/R·Liquidity·5s Confirm</Text>
          </View>
          <Animated.View style={[styles.statusDot, {
            backgroundColor: isSignalRunning ? Colors.buy : isLocked ? Colors.sell : Colors.textMuted,
            shadowColor: isSignalRunning ? Colors.buy : Colors.textMuted,
            shadowOpacity: isSignalRunning ? 0.8 : 0,
            shadowRadius: 6,
            elevation: isSignalRunning ? 4 : 0,
          }]} />
        </Animated.View>

        {/* Weekend Lock Banner */}
        {isLocked && (
          <LinearGradient colors={['rgba(255,61,87,0.14)', 'rgba(255,61,87,0.04)']} style={styles.lockBanner}>
            <MaterialIcons name="lock" size={22} color={Colors.sell} />
            <View style={{ flex: 1 }}>
              <Text style={styles.lockTitle}>SIGNAL ENGINE LOCKED — WEEKEND</Text>
              <Text style={styles.lockSub}>{getWeekendMessage()}</Text>
            </View>
          </LinearGradient>
        )}

        {/* Engine Button */}
        <Animated.View style={[{ transform: [{ scale: engineBtnAnim }] }]}>
          <TouchableOpacity onPress={toggleEngine} activeOpacity={isLocked ? 1 : 0.85} disabled={isLocked}>
            <Animated.View style={[styles.engineGlowRing, { borderColor: engineGlow }]} />
            <LinearGradient
              colors={
                isLocked
                  ? ['#1a0a0a', '#2a1a1a']
                  : isSignalRunning
                  ? ['#b71c1c', Colors.sell]
                  : [Colors.goldDark, Colors.gold]
              }
              style={[styles.engineBtn, isLocked && styles.engineBtnLocked]}
            >
              <MaterialIcons
                name={isLocked ? 'lock' : isSignalRunning ? 'stop-circle' : 'play-circle-filled'}
                size={32} color={isLocked ? Colors.sell : '#fff'}
              />
              <View>
                <Text style={[styles.engineBtnText, isLocked && { color: Colors.sell }]}>
                  {isLocked ? 'ENGINE LOCKED' : isSignalRunning ? 'STOP ENGINE' : 'START ENGINE'}
                </Text>
                <Text style={[styles.engineBtnSub, isLocked && { color: `${Colors.sell}80` }]}>
                  {isLocked ? 'Weekend · Opens Sun 21:00 UTC'
                    : isSignalRunning ? `${selectedPairs.length} pairs · Every 62s · Live`
                    : '15+ Indicators · Session-aware · Manipulation Guard'}
                </Text>
              </View>
              {isSignalRunning && !isLocked && (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* API Key warning */}
        {!hasApiKey() && !isLocked && (
          <LinearGradient colors={['rgba(255,61,87,0.1)', 'transparent']} style={styles.warnBanner}>
            <MaterialIcons name="warning-amber" size={16} color={Colors.sell} />
            <Text style={styles.warnText}>No API key — Go to Settings → Market Data API to add your key</Text>
          </LinearGradient>
        )}

        {/* Stats row */}
        <Animated.View style={[styles.statsRow, {
          opacity: statsAnim,
          transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }]
        }]}>
          <StatCard label="BUY" value={buyCount} color={Colors.buy} icon="trending-up" />
          <StatCard label="SELL" value={sellCount} color={Colors.sell} icon="trending-down" />
          <StatCard label="SAFE" value={safeCount} color={Colors.blue} icon="verified" />
          <StatCard label="⭐TOP" value={perfectCount} color={Colors.gold} icon="stars" />
        </Animated.View>

        {/* Pair selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>▸ Signal Pairs ({selectedPairs.length} active)</Text>
          <PairSelector />
        </View>

        {/* Market Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>▸ Market Sessions & Bangladesh Time</Text>
          <MarketSession />
        </View>

        {/* Latest Signal */}
        {lastSignal && (
          <Animated.View style={[styles.section, { backgroundColor: flashBg }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>▸ Latest Signal</Text>
              <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.newBadge}>
                <MaterialIcons name="bolt" size={10} color={Colors.bg} />
                <Text style={styles.newBadgeText}>NEW</Text>
              </LinearGradient>
            </View>
            <SignalCard signal={lastSignal} isLatest />
          </Animated.View>
        )}

        {/* Status */}
        <LinearGradient colors={['#111827', '#0d1117']} style={styles.statusCard}>
          <MaterialIcons name="info-outline" size={15} color={Colors.blue} />
          <Text style={styles.statusText}>
            {isLocked
              ? 'Markets closed weekends. Auto-unlock Sunday 21:00 UTC (Sydney open).'
              : isSignalRunning
              ? `Engine live · ${selectedPairs.length} pair(s) · 15+ indicators · Pivot·Fib·S/R·Liquidity`
              : 'Press START ENGINE for live 1-min signals with 15+ indicator confluence'}
          </Text>
        </LinearGradient>

        {/* Owner section */}
        <View style={styles.ownerSection}>
          <LinearGradient colors={['rgba(240,180,41,0.08)', 'transparent']} style={styles.ownerCard}>
            <AnimatedLogo size={36} showTitle={false} />
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>👤 Amirul_Adnan</Text>
              <Text style={styles.ownerTg}>📱 @amirul_adnan_trader</Text>
            </View>
          </LinearGradient>
        </View>

      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 9, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale: scaleAnim }], borderColor: `${color}25` }]}>
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
  scroll: { padding: Spacing.base, gap: Spacing.md, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerText: { flex: 1 },
  appName: { fontSize: 11, color: Colors.gold, fontWeight: Fonts.weights.black, letterSpacing: 1 },
  appSub: { fontSize: 9, color: Colors.textMuted },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  lockBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: `${Colors.sell}35`,
  },
  lockTitle: { fontSize: Fonts.sizes.sm, color: Colors.sell, fontWeight: Fonts.weights.black, letterSpacing: 0.5 },
  lockSub: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  engineGlowRing: {
    position: 'absolute', inset: -3, borderRadius: Radius.xxl + 3,
    borderWidth: 2, zIndex: 0,
  },
  engineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.md, paddingVertical: Spacing.lg + 2, borderRadius: Radius.xl,
    zIndex: 1,
  },
  engineBtnLocked: { borderWidth: 1, borderColor: `${Colors.sell}40` },
  engineBtnText: { fontSize: Fonts.sizes.base, color: '#fff', fontWeight: Fonts.weights.black, letterSpacing: 0.8 },
  engineBtnSub: { fontSize: Fonts.sizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText: { fontSize: 10, color: '#fff', fontWeight: Fonts.weights.black },
  warnBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: `${Colors.sell}25`,
  },
  warnText: { fontSize: Fonts.sizes.sm, color: Colors.sell, flex: 1 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1 },
  statGrad: { padding: Spacing.sm, alignItems: 'center', gap: 2 },
  statValue: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.black },
  statLabel: { fontSize: 8, color: Colors.textMuted, fontWeight: Fonts.weights.bold, letterSpacing: 0.5 },
  section: { gap: Spacing.sm, borderRadius: Radius.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, fontWeight: Fonts.weights.semibold, letterSpacing: 0.8, textTransform: 'uppercase', flex: 1 },
  newBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },
  newBadgeText: { fontSize: 9, color: Colors.bg, fontWeight: Fonts.weights.black },
  statusCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.borderGlow,
  },
  statusText: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary, flex: 1, lineHeight: 17 },
  ownerSection: { alignItems: 'center' },
  ownerCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: `${Colors.gold}20`,
  },
  ownerInfo: { gap: 3 },
  ownerName: { fontSize: Fonts.sizes.sm, color: Colors.gold, fontWeight: Fonts.weights.semibold },
  ownerTg: { fontSize: Fonts.sizes.sm, color: Colors.blue },
});
