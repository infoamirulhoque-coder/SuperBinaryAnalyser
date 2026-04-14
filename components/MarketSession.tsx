import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { useMarketTime } from '@/hooks/useMarketTime';
import { isWeekend } from '@/services/twelvedata';

export function MarketSession() {
  const { bdTime, utcTime, bdDate, sessions, activeSessions } = useMarketTime();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const weekendAnim = useRef(new Animated.Value(0)).current;
  const weekend = isWeekend();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    if (weekend) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(weekendAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(weekendAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      ).start();
    }
  }, [weekend]);

  const weekendGlow = weekendAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,61,87,0.05)', 'rgba(255,61,87,0.18)'],
  });

  return (
    <View style={styles.container}>
      {/* BD Time card */}
      <LinearGradient colors={['#111827', '#0d1117']} style={styles.timeCard}>
        <View style={styles.timeRow}>
          <Text style={styles.flagEmoji}>🇧🇩</Text>
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Bangladesh Time (UTC+6)</Text>
            <Text style={styles.timeValue}>{bdTime}</Text>
            <Text style={styles.dateText}>{bdDate}</Text>
          </View>
          <View style={styles.utcBlock}>
            <Text style={styles.utcLabel}>UTC</Text>
            <Text style={styles.utcTime}>{utcTime}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Weekend closed banner */}
      {weekend && (
        <Animated.View style={[styles.weekendBanner, { backgroundColor: weekendGlow }]}>
          <Text style={styles.weekendIcon}>🔒</Text>
          <View style={styles.weekendText}>
            <Text style={styles.weekendTitle}>MARKET CLOSED — WEEKEND</Text>
            <Text style={styles.weekendSub}>Forex opens Sunday 21:00 UTC · Signal engine locked</Text>
          </View>
        </Animated.View>
      )}

      {/* Sessions row */}
      <View style={styles.sessionsRow}>
        {sessions.map((s) => (
          <View key={s.name} style={[styles.sessionBadge, s.isActive && { borderColor: s.color, backgroundColor: `${s.color}10` }]}>
            <View style={styles.sessionTop}>
              <Animated.View
                style={[
                  styles.sessionDot,
                  { backgroundColor: s.isActive ? s.color : Colors.textMuted },
                  s.isActive && { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Text style={[styles.sessionName, s.isActive && { color: s.color }]}>{s.name}</Text>
            </View>
            <Text style={styles.sessionHours}>{s.opens}–{s.closes}</Text>
            <Text style={[styles.sessionStatus, { color: s.isActive ? s.color : Colors.textMuted }]}>
              {s.isActive ? '● OPEN' : '○ CLOSED'}
            </Text>
          </View>
        ))}
      </View>

      {/* High volatility overlap banner */}
      {activeSessions.length > 1 && !weekend && (
        <LinearGradient colors={['rgba(240,180,41,0.12)', 'rgba(240,180,41,0.05)']} style={styles.overlapBanner}>
          <Text style={styles.overlapText}>
            🔥 {activeSessions.join(' + ')} Overlap — HIGH VOLATILITY · Best signals now
          </Text>
        </LinearGradient>
      )}

      {activeSessions.length === 1 && !weekend && (
        <View style={styles.singleSessionBanner}>
          <Text style={styles.singleSessionText}>
            ✅ {activeSessions[0]} session active · Good signal quality
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  timeCard: {
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flagEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
  timeInfo: { flex: 1 },
  timeLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, letterSpacing: 0.5 },
  timeValue: {
    fontSize: Fonts.sizes.xxl, color: Colors.gold,
    fontWeight: Fonts.weights.bold,
  },
  dateText: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary },
  utcBlock: { alignItems: 'flex-end' },
  utcLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted },
  utcTime: { fontSize: Fonts.sizes.md, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  weekendBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: `${Colors.sell}40`,
  },
  weekendIcon: { fontSize: 24 },
  weekendText: { flex: 1 },
  weekendTitle: { fontSize: Fonts.sizes.sm, color: Colors.sell, fontWeight: Fonts.weights.black, letterSpacing: 1 },
  weekendSub: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  sessionsRow: { flexDirection: 'row', gap: Spacing.xs },
  sessionBadge: {
    flex: 1, backgroundColor: Colors.bgCard,
    borderRadius: Radius.md, padding: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', gap: 2,
  },
  sessionTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionDot: { width: 6, height: 6, borderRadius: 3 },
  sessionName: { fontSize: 9, color: Colors.textSecondary, fontWeight: Fonts.weights.bold },
  sessionHours: { fontSize: 8, color: Colors.textMuted },
  sessionStatus: { fontSize: 8, fontWeight: Fonts.weights.bold },
  overlapBanner: {
    borderRadius: Radius.sm, padding: Spacing.sm,
    borderWidth: 1, borderColor: `${Colors.gold}40`,
    alignItems: 'center',
  },
  overlapText: { fontSize: Fonts.sizes.xs, color: Colors.gold, fontWeight: Fonts.weights.semibold, textAlign: 'center' },
  singleSessionBanner: {
    backgroundColor: `${Colors.buy}0A`, borderRadius: Radius.sm,
    padding: Spacing.sm, borderWidth: 1, borderColor: `${Colors.buy}25`,
    alignItems: 'center',
  },
  singleSessionText: { fontSize: Fonts.sizes.xs, color: Colors.buy },
});
