import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { useApp, FOREX_PAIRS } from '@/contexts/AppContext';
import { validateApiKey, clearAllCaches } from '@/services/twelvedata';
import { useAlert } from '@/template';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { apiKey, setAppApiKey, isApiValid, setApiValid, selectedPairs, togglePair, clearSignals } = useApp();
  const { showAlert } = useAlert();
  const [keyInput, setKeyInput] = useState(apiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(cardSlide, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
    setKeyInput(apiKey);
  }, [apiKey]);

  const handleSaveKey = async () => {
    Keyboard.dismiss();
    const trimmed = keyInput.trim();
    if (!trimmed) { showAlert('Error', 'Please enter a valid API key'); return; }
    setIsValidating(true);
    try {
      const valid = await validateApiKey(trimmed);
      setApiValid(valid);
      await setAppApiKey(trimmed);
      clearAllCaches();
      showAlert(valid ? 'Success ✓' : 'Saved', valid
        ? 'API key validated. Live signals are now active.'
        : 'Key saved. Validation inconclusive — check key if signals fail.');
    } catch {
      await setAppApiKey(trimmed);
      setApiValid(null);
      showAlert('Saved', 'Key saved. Network prevented validation.');
    } finally { setIsValidating(false); }
  };

  const handleClearAll = () => {
    showAlert('Reset App Data', 'Clear all signals and caches?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => {
        await clearSignals(); clearAllCaches();
        showAlert('Done', 'All data cleared.');
      }},
    ]);
  };

  const maskedKey = keyInput.length > 8
    ? keyInput.slice(0, 4) + '••••••••' + keyInput.slice(-4)
    : '••••••••';

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <LinearGradient colors={['#0a0d16', Colors.bg]} style={styles.header}>
          <MaterialIcons name="settings" size={20} color={Colors.gold} />
          <Text style={styles.headerTitle}>Settings</Text>
          {isApiValid === true && (
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTxt}>API LIVE</Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.logoSection}>
          <AnimatedLogo size={72} showTitle showOwner />
        </View>

        {/* API Key */}
        <Animated.View style={{ transform: [{ translateY: cardSlide }] }}>
          <LinearGradient colors={['#111827', '#0d1117']} style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="vpn-key" size={18} color={Colors.gold} />
              <Text style={styles.cardTitle}>Market Data API Key</Text>
              {isApiValid === true && <ValidBadge ok />}
              {isApiValid === false && <ValidBadge ok={false} />}
            </View>
            <Text style={styles.cardDesc}>
              Required for live 1-min signals. Data cached 55s to save credits. Provider info is hidden for security.
            </Text>
            <View style={styles.keyInputRow}>
              <TextInput
                style={styles.keyInput}
                value={showKey ? keyInput : (keyInput.length > 0 ? maskedKey : '')}
                onChangeText={t => { setShowKey(true); setKeyInput(t); }}
                onFocus={() => setShowKey(true)}
                onBlur={() => setShowKey(false)}
                placeholder="Paste API key here..."
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none" autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowKey(s => !s)} style={styles.eyeBtn}>
                <MaterialIcons name={showKey ? 'visibility-off' : 'visibility'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.saveBtn, isValidating && { opacity: 0.6 }]}
              onPress={handleSaveKey} disabled={isValidating} activeOpacity={0.85}>
              <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.saveBtnGrad}>
                <MaterialIcons name={isValidating ? 'hourglass-empty' : 'save'} size={16} color={Colors.bg} />
                <Text style={styles.saveBtnText}>{isValidating ? 'Validating...' : 'Save & Validate'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.creditNote}>
              <MaterialIcons name="savings" size={12} color={Colors.blue} />
              <Text style={styles.creditTxt}>Credit-optimized: 55s cache · 80 candles · Staggered calls · No waste</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Engine Info v3 */}
        <LinearGradient colors={['#111827', '#0d1117']} style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="psychology" size={18} color={Colors.blue} />
            <Text style={styles.cardTitle}>Signal Engine v3.0</Text>
            <View style={styles.v3Badge}><Text style={styles.v3Txt}>v3.0</Text></View>
          </View>
          {[
            ['Interval', '62s (rate-limit safe)'],
            ['Indicators', 'RSI·MACD·EMA(5/20/50/200)·BB·Stoch·ADX·ATR·Candles'],
            ['New v3', 'Pivot·Fibonacci·S/R·Liquidity·CandlePower·5s Confirm'],
            ['Candle Patterns', '18 patterns (Marubozu·Engulf·Star·Hammer·Tweezer...)'],
            ['Manip. Guard', 'Spike·Pinbar·Absorption·Pump/Dump·Gap detection'],
            ['Entry Quality', 'PERFECT / GOOD / FAIR / POOR scoring'],
            ['Session Bonus', 'London+NY overlap = highest score (+30)'],
            ['Weekend Lock', 'Auto-locks Sat 00:00 – Sun 21:00 UTC'],
            ['Pairs', '40+ pairs (Major · Cross · Exotic · Crypto)'],
          ].map(([label, val]) => (
            <View key={label} style={styles.configRow}>
              <Text style={styles.configLabel}>{label}</Text>
              <Text style={styles.configVal}>{val}</Text>
            </View>
          ))}
        </LinearGradient>

        {/* Active Pairs */}
        <LinearGradient colors={['#111827', '#0d1117']} style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="currency-exchange" size={18} color={Colors.purple} />
            <Text style={styles.cardTitle}>Selected Pairs ({selectedPairs.length})</Text>
          </View>
          {['Major', 'Cross', 'Exotic', 'Crypto'].map(group => (
            <View key={group} style={styles.pairGroup}>
              <Text style={styles.pairGroupTitle}>{group}</Text>
              <View style={styles.pairsList}>
                {FOREX_PAIRS.filter(p => p.group === group).map(pair => {
                  const isSelected = selectedPairs.includes(pair.symbol);
                  return (
                    <TouchableOpacity
                      key={pair.symbol}
                      style={[styles.pairItem, isSelected && styles.pairItemOn]}
                      onPress={() => togglePair(pair.symbol)} activeOpacity={0.8}
                    >
                      {isSelected && <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={StyleSheet.absoluteFill} borderRadius={Radius.full} />}
                      <Text style={[styles.pairItemTxt, isSelected && styles.pairItemTxtOn]}>{pair.label}</Text>
                      {isSelected && <MaterialIcons name="check" size={9} color={Colors.bg} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </LinearGradient>

        {/* About */}
        <LinearGradient colors={['#111827', '#0d1117']} style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="info" size={18} color={Colors.gold} />
            <Text style={styles.cardTitle}>About</Text>
          </View>
          {[
            ['App', 'Super-Binary-Analyser v3.0'],
            ['Engine', '15+ Indicator Confluence'],
            ['Owner', 'Amirul_Adnan'],
            ['Telegram', '@amirul_adnan_trader'],
            ['Signal Type', '1-Minute Binary Options'],
            ['Timezone', 'Bangladesh (UTC+6)'],
            ['Protection', 'PIN 6-digit Lock'],
            ['Chart', 'TradingView Live + Analysis Mode'],
          ].map(([lbl, val]) => (
            <View key={lbl} style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>{lbl}</Text>
              <Text style={[styles.aboutVal, lbl === 'Telegram' && { color: Colors.blue }]}>{val}</Text>
            </View>
          ))}
        </LinearGradient>

        {/* Danger Zone */}
        <LinearGradient colors={[`${Colors.sell}08`, '#0d1117']} style={[styles.card, { borderColor: `${Colors.sell}22` }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="warning" size={18} color={Colors.sell} />
            <Text style={[styles.cardTitle, { color: Colors.sell }]}>Danger Zone</Text>
          </View>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleClearAll} activeOpacity={0.8}>
            <MaterialIcons name="delete-forever" size={16} color={Colors.sell} />
            <Text style={styles.dangerBtnTxt}>Clear All Data & Reset Caches</Text>
          </TouchableOpacity>
        </LinearGradient>

      </ScrollView>
    </Animated.View>
  );
}

function ValidBadge({ ok }: { ok: boolean }) {
  return (
    <View style={[styles.validBadge, { backgroundColor: ok ? `${Colors.buy}15` : `${Colors.sell}15`, borderColor: ok ? `${Colors.buy}30` : `${Colors.sell}30` }]}>
      <MaterialIcons name={ok ? 'check-circle' : 'error'} size={11} color={ok ? Colors.buy : Colors.sell} />
      <Text style={[styles.validTxt, { color: ok ? Colors.buy : Colors.sell }]}>{ok ? 'Active' : 'Invalid'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { gap: Spacing.md, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Fonts.sizes.lg, color: Colors.textPrimary, fontWeight: Fonts.weights.bold, flex: 1 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${Colors.buy}15`, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${Colors.buy}30`,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.buy },
  liveTxt: { fontSize: 10, color: Colors.buy, fontWeight: Fonts.weights.black },
  logoSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  card: {
    marginHorizontal: Spacing.base, borderRadius: Radius.xl,
    padding: Spacing.base, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardTitle: { fontSize: Fonts.sizes.base, color: Colors.textPrimary, fontWeight: Fonts.weights.semibold, flex: 1 },
  cardDesc: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, lineHeight: 20 },
  validBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1,
  },
  validTxt: { fontSize: 10, fontWeight: Fonts.weights.bold },
  v3Badge: {
    backgroundColor: `${Colors.blue}20`, borderRadius: Radius.full,
    paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: `${Colors.blue}40`,
  },
  v3Txt: { fontSize: 9, color: Colors.blue, fontWeight: Fonts.weights.black },
  keyInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgInput, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  keyInput: {
    flex: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Fonts.sizes.sm, color: Colors.textPrimary, fontFamily: 'monospace',
  },
  eyeBtn: { padding: Spacing.sm },
  saveBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  saveBtnText: { fontSize: Fonts.sizes.base, color: Colors.bg, fontWeight: Fonts.weights.bold },
  creditNote: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  creditTxt: { fontSize: 11, color: Colors.textMuted, flex: 1, lineHeight: 16 },
  configRow: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.xs, gap: 2 },
  configLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, fontWeight: Fonts.weights.semibold },
  configVal: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary, lineHeight: 16 },
  pairGroup: { gap: Spacing.xs },
  pairGroupTitle: { fontSize: Fonts.sizes.xs, color: Colors.gold, fontWeight: Fonts.weights.bold, letterSpacing: 0.8 },
  pairsList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  pairItem: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard, overflow: 'hidden',
  },
  pairItemOn: { borderColor: Colors.gold },
  pairItemTxt: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  pairItemTxtOn: { color: Colors.bg, fontWeight: Fonts.weights.bold },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  aboutLabel: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  aboutVal: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, borderRadius: Radius.md,
    backgroundColor: `${Colors.sell}10`, borderWidth: 1, borderColor: `${Colors.sell}35`,
  },
  dangerBtnTxt: { fontSize: Fonts.sizes.base, color: Colors.sell, fontWeight: Fonts.weights.semibold },
});
