import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { useMarketTime } from '@/hooks/useMarketTime';

export function MarketSession() {
  const { bdTime, utcTime, bdDate, sessions, activeSessions } = useMarketTime();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* BD Time */}
      <LinearGradient colors={['#111827', '#0d1117']} style={styles.timeCard}>
        <View style={styles.timeRow}>
          <View style={styles.flagBD}>
            <Text style={styles.flagEmoji}>🇧🇩</Text>
          </View>
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

      {/* Sessions */}
      <View style={styles.sessionsRow}>
        {sessions.map((s) => (
          <View key={s.name} style={[styles.sessionBadge, s.isActive && { borderColor: s.color }]}>
            <View style={styles.sessionTop}>
              <Animated.View
                style={[
                  styles.sessionDot,
                  { backgroundColor: s.color },
                  s.isActive && { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Text style={[styles.sessionName, s.isActive && { color: s.color }]}>{s.name}</Text>
            </View>
            <Text style={styles.sessionHours}>{s.opens}-{s.closes}</Text>
            <Text style={[styles.sessionStatus, { color: s.isActive ? s.color : Colors.textMuted }]}>
              {s.isActive ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>
        ))}
      </View>

      {activeSessions.length > 0 && (
        <View style={styles.overlapBanner}>
          <Text style={styles.overlapText}>
            🔥 Active: {activeSessions.join(' + ')} {activeSessions.length > 1 ? '— HIGH VOLATILITY' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  timeCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flagBD: { width: 36, alignItems: 'center' },
  flagEmoji: { fontSize: 28 },
  timeInfo: { flex: 1 },
  timeLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, letterSpacing: 0.5 },
  timeValue: { fontSize: Fonts.sizes.xxl, color: Colors.gold, fontWeight: Fonts.weights.bold, fontVariant: ['tabular-nums'] },
  dateText: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary },
  utcBlock: { alignItems: 'flex-end' },
  utcLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted },
  utcTime: { fontSize: Fonts.sizes.md, color: Colors.textSecondary, fontVariant: ['tabular-nums'] },
  sessionsRow: { flexDirection: 'row', gap: Spacing.xs },
  sessionBadge: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 2,
  },
  sessionTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionDot: { width: 6, height: 6, borderRadius: 3 },
  sessionName: { fontSize: 9, color: Colors.textSecondary, fontWeight: Fonts.weights.bold },
  sessionHours: { fontSize: 8, color: Colors.textMuted },
  sessionStatus: { fontSize: 8, fontWeight: Fonts.weights.bold },
  overlapBanner: {
    backgroundColor: 'rgba(240,180,41,0.1)',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  overlapText: { fontSize: Fonts.sizes.xs, color: Colors.gold, fontWeight: Fonts.weights.semibold },
});
