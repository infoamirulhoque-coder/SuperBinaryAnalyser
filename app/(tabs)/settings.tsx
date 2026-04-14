import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, Easing, Keyboard,
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
  const cardSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(cardSlide, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
    setKeyInput(apiKey);
  }, [apiKey]);

  const handleSaveKey = async () => {
    Keyboard.dismiss();
    const trimmed = keyInput.trim();
    if (!trimmed) {
      showAlert('Error', 'Please enter a valid API key');
      return;
    }
    setIsValidating(true);
    try {
      const valid = await validateApiKey(trimmed);
      setApiValid(valid);
      await setAppApiKey(trimmed);
      clearAllCaches();
      if (valid) {
        showAlert('Success', 'API key saved and validated. Live signals are now active.');
      } else {
        showAlert('Saved', 'API key saved. Validation could not confirm — check the key if signals fail.');
      }
    } catch {
      await setAppApiKey(trimmed);
      setApiValid(null);
      showAlert('Saved', 'API key saved. Network issue prevented validation.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearAll = () => {
    showAlert('Reset App Data', 'Clear all signals and caches?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          await clearSignals();
          clearAllCaches();
          showAlert('Done', 'All data cleared successfully');
        }
      },
    ]);
  };

  const displayKey = showKey ? keyInput : (keyInput.length > 8 ? keyInput.slice(0, 4) + '••••' + keyInput.slice(-4) : '••••••••');

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <LinearGradient colors={['#0a0d16', Colors.bg]} style={styles.header}>
          <MaterialIcons name="settings" size={20} color={Colors.gold} />
          <Text style={styles.headerTitle}>Settings</Text>
          {isApiValid === true && (
            <View style={styles.apiActiveBadge}>
              <MaterialIcons name="wifi" size={12} color={Colors.buy} />
              <Text style={styles.apiActiveTxt}>LIVE</Text>
            </View>
          )}
        </LinearGradient>

        {/* Logo */}
        <View style={styles.logoSection}>
          <AnimatedLogo size={72} showTitle showOwner />
        </View>

        {/* API Key section */}
        <Animated.View style={{ transform: [{ translateY: cardSlide }] }}>
          <LinearGradient colors={['#111827', '#0d1117']} style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="vpn-key" size={18} color={Colors.gold} />
              <Text style={styles.cardTitle}>Market Data API</Text>
              {isApiValid === true && (
                <View style={styles.validBadge}>
                  <MaterialIcons name="check-circle" size={12} color={Colors.buy} />
                  <Text style={styles.validText}>Active</Text>
                </View>
              )}
              {isApiValid === false && (
                <View style={[styles.validBadge, { backgroundColor: `${Colors.sell}18` }]}>
                  <MaterialIcons name="error" size={12} color={Colors.sell} />
                  <Text style={[styles.validText, { color: Colors.sell }]}>Invalid</Text>
                </View>
              )}
            </View>

            <Text style={styles.cardDesc}>
              Enter your API key to fetch real-time 1-min candle data. The engine caches data for 55 seconds to minimize credit usage.
            </Text>

            <View style={styles.keyInputRow}>
              <TextInput
                style={styles.keyInput}
                value={showKey ? keyInput : displayKey}
                onChangeText={(t) => { setShowKey(true); setKeyInput(t); }}
                onFocus={() => setShowKey(true)}
                placeholder="Paste your API key here..."
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowKey((s) => !s)} style={styles.eyeBtn}>
                <MaterialIcons name={showKey ? 'visibility-off' : 'visibility'} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, isValidating && { opacity: 0.65 }]}
              onPress={handleSaveKey}
              disabled={isValidating}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.saveBtnGrad}>
                <MaterialIcons name={isValidating ? 'hourglass-empty' : 'save'} size={18} color={Colors.bg} />
                <Text style={styles.saveBtnText}>{isValidating ? 'Validating...' : 'Save & Validate'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.creditNote}>
              <MaterialIcons name="savings" size={13} color={Colors.blue} />
              <Text style={styles.creditNoteText}>
                Credit-optimized: 55s cache · 80 candles (not 100) · Staggered pair calls · No redundant validation
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Engine Info */}
        <LinearGradient colors={['#111827', '#0d1117']} style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="tune" size={18} color={Colors.blue} />
            <Text style={styles.cardTitle}>Signal Engine v2.0</Text>
          </View>
          {[
            ['Update Interval', '62 seconds (offset to avoid rate limits)'],
            ['Indicators', 'RSI · MACD · EMA(5/20/50) · BB · Stoch · ADX · ATR · Candles'],
            ['Candle Depth', '80 candles per pair (cache-optimized)'],
            ['Manipulation Guard', 'Spike · Pinbar · Absorption · Pump/Dump · Gap'],
            ['Session Boost', 'London+NY overlap → highest accuracy window'],
            ['Weekend Lock', 'Auto-locks Sat 00:00–Sun 21:00 UTC'],
            ['Safe Signal', 'No manipulation + normal ATR + no vol spike'],
          ].map(([label, value]) => (
            <View key={label} style={styles.configRow}>
              <Text style={styles.configLabel}>{label}</Text>
              <Text style={styles.configValue}>{value}</Text>
            </View>
          ))}
        </LinearGradient>

        {/* Active Pairs */}
        <LinearGradient colors={['#111827', '#0d1117']} style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="currency-exchange" size={18} color={Colors.purple} />
            <Text style={styles.cardTitle}>Selected Pairs ({selectedPairs.length})</Text>
          </View>
          <View style={styles.pairsList}>
            {FOREX_PAIRS.map((pair) => {
              const isSelected = selectedPairs.includes(pair.symbol);
              return (
                <TouchableOpacity
                  key={pair.symbol}
                  style={[styles.pairItem, isSelected && styles.pairItemOn]}
                  onPress={() => togglePair(pair.symbol)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pairItemText, isSelected && styles.pairItemTextOn]}>{pair.label}</Text>
                  {isSelected && <MaterialIcons name="check" size={11} color={Colors.bg} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>

        {/* About */}
        <LinearGradient colors={['#111827', '#0d1117']} style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="info" size={18} color={Colors.gold} />
            <Text style={styles.cardTitle}>About</Text>
          </View>
          {[
            ['App Name', 'Super-Binary-Analyser'],
            ['Version', 'v2.0.0'],
            ['Owner', 'Amirul_Adnan'],
            ['Telegram', '@amirul_adnan_trader'],
            ['Signal Type', '1-Minute Binary Options'],
            ['Engine', '8-Indicator Confluence'],
            ['Timezone', 'Bangladesh (UTC+6)'],
            ['PIN', '██████ Protected'],
          ].map(([label, value]) => (
            <View key={label} style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>{label}</Text>
              <Text style={[styles.aboutValue, label === 'Telegram' && { color: Colors.blue }]}>{value}</Text>
            </View>
          ))}
        </LinearGradient>

        {/* Danger Zone */}
        <LinearGradient colors={[`${Colors.sell}08`, '#0d1117']} style={[styles.card, { borderColor: `${Colors.sell}25` }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="warning" size={18} color={Colors.sell} />
            <Text style={[styles.cardTitle, { color: Colors.sell }]}>Danger Zone</Text>
          </View>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleClearAll} activeOpacity={0.8}>
            <MaterialIcons name="delete-forever" size={18} color={Colors.sell} />
            <Text style={styles.dangerBtnText}>Clear All Data & Caches</Text>
          </TouchableOpacity>
        </LinearGradient>

      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { gap: Spacing.md, paddingBottom: 36 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Fonts.sizes.lg, color: Colors.textPrimary, fontWeight: Fonts.weights.bold, flex: 1 },
  apiActiveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: `${Colors.buy}15`, borderRadius: 5,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: `${Colors.buy}30`,
  },
  apiActiveTxt: { fontSize: 10, color: Colors.buy, fontWeight: Fonts.weights.black },
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
    backgroundColor: `${Colors.buy}15`, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  validText: { fontSize: 11, color: Colors.buy, fontWeight: Fonts.weights.bold },
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
  creditNoteText: { fontSize: 11, color: Colors.textMuted, flex: 1, lineHeight: 16 },
  configRow: {
    borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.xs, gap: 3,
  },
  configLabel: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, fontWeight: Fonts.weights.semibold },
  configValue: { fontSize: Fonts.sizes.xs, color: Colors.textSecondary, lineHeight: 16 },
  pairsList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pairItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  pairItemOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pairItemText: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  pairItemTextOn: { color: Colors.bg, fontWeight: Fonts.weights.bold },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  aboutLabel: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  aboutValue: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, borderRadius: Radius.md,
    backgroundColor: `${Colors.sell}10`, borderWidth: 1, borderColor: `${Colors.sell}35`,
  },
  dangerBtnText: { fontSize: Fonts.sizes.base, color: Colors.sell, fontWeight: Fonts.weights.semibold },
});
