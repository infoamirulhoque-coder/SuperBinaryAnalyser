import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, Switch, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import { useApp, FOREX_PAIRS } from '@/contexts/AppContext';
import { validateApiKey } from '@/services/twelvedata';
import { useAlert } from '@/template';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { apiKey, setAppApiKey, isApiValid, setApiValid, selectedPairs, togglePair, clearSignals } = useApp();
  const { showAlert } = useAlert();
  const [keyInput, setKeyInput] = useState(apiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const validAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    setKeyInput(apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (isApiValid !== null) {
      Animated.sequence([
        Animated.timing(validAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(validAnim, { toValue: 0, duration: 300, delay: 2000, useNativeDriver: true }),
      ]).start();
    }
  }, [isApiValid]);

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
      if (valid) {
        await setAppApiKey(trimmed);
        showAlert('Success', 'API key saved and validated successfully');
      } else {
        showAlert('Invalid Key', 'The API key could not be validated. Please check and try again.');
      }
    } catch {
      // Save anyway if validation fails due to network
      await setAppApiKey(trimmed);
      setApiValid(null);
      showAlert('Saved', 'API key saved. Validation could not be confirmed (network issue).');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearAll = () => {
    showAlert('Reset App Data', 'This will clear all signals and reset settings. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: () => {
          clearSignals();
          showAlert('Done', 'App data cleared successfully');
        }
      },
    ]);
  };

  const maskedKey = keyInput ? keyInput.slice(0, 4) + '****' + keyInput.slice(-4) : '';

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, opacity: fadeAnim }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <LinearGradient colors={['#0a0d16', Colors.bg]} style={styles.header}>
          <MaterialIcons name="settings" size={20} color={Colors.gold} />
          <Text style={styles.headerTitle}>Settings</Text>
        </LinearGradient>

        {/* Logo + Owner */}
        <View style={styles.logoSection}>
          <AnimatedLogo size={70} showTitle showOwner />
        </View>

        {/* API Key Section */}
        <LinearGradient colors={['#111827', '#0d1117']} style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="vpn-key" size={18} color={Colors.gold} />
            <Text style={styles.cardTitle}>Market Data API</Text>
            {isApiValid === true && (
              <View style={styles.validBadge}>
                <MaterialIcons name="check-circle" size={14} color={Colors.buy} />
                <Text style={styles.validText}>Active</Text>
              </View>
            )}
          </View>

          <Text style={styles.cardDesc}>
            Enter your API key to receive real-time market data for signal generation.
          </Text>

          <View style={styles.keyInputRow}>
            <TextInput
              style={styles.keyInput}
              value={showKey ? keyInput : (keyInput ? maskedKey : keyInput)}
              onChangeText={showKey ? setKeyInput : undefined}
              onFocus={() => setShowKey(true)}
              placeholder="Enter API key..."
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={false}
            />
            <TouchableOpacity onPress={() => setShowKey((s) => !s)} style={styles.eyeBtn}>
              <MaterialIcons name={showKey ? 'visibility-off' : 'visibility'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, isValidating && styles.saveBtnDisabled]}
            onPress={handleSaveKey}
            disabled={isValidating}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.saveBtnGrad}>
              <MaterialIcons name={isValidating ? 'hourglass-empty' : 'save'} size={18} color={Colors.bg} />
              <Text style={styles.saveBtnText}>{isValidating ? 'Validating...' : 'Save & Validate'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.apiNote}>
            <MaterialIcons name="info-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.apiNoteText}>
              Get your free API key from the market data provider. Supports up to 800 calls/day on free plan.
            </Text>
          </View>
        </LinearGradient>

        {/* Signal Engine Config */}
        <LinearGradient colors={['#111827', '#0d1117']} style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="tune" size={18} color={Colors.blue} />
            <Text style={styles.cardTitle}>Signal Engine</Text>
          </View>

          <View style={styles.configRow}>
            <View>
              <Text style={styles.configLabel}>Update Interval</Text>
              <Text style={styles.configValue}>Every 60 seconds</Text>
            </View>
            <View style={styles.fixedBadge}>
              <Text style={styles.fixedBadgeText}>1 MIN</Text>
            </View>
          </View>

          <View style={styles.configRow}>
            <View>
              <Text style={styles.configLabel}>Indicators Used</Text>
              <Text style={styles.configValue}>RSI · MACD · EMA · BB · Stoch · Candles</Text>
            </View>
          </View>

          <View style={styles.configRow}>
            <View>
              <Text style={styles.configLabel}>Analysis Depth</Text>
              <Text style={styles.configValue}>100 candles · 6-indicator confluence</Text>
            </View>
          </View>

          <View style={styles.configRow}>
            <View>
              <Text style={styles.configLabel}>Signal Expiry</Text>
              <Text style={styles.configValue}>60 seconds per signal</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Pairs Summary */}
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
                  style={[styles.pairToggleItem, isSelected && styles.pairToggleItemOn]}
                  onPress={() => togglePair(pair.symbol)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pairToggleText, isSelected && styles.pairToggleTextOn]}>
                    {pair.label}
                  </Text>
                  {isSelected && <MaterialIcons name="check" size={12} color={Colors.bg} />}
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
          <View style={styles.aboutRows}>
            <AboutRow label="App Name" value="Super-Binary-Analyser" />
            <AboutRow label="Version" value="v1.0.0" />
            <AboutRow label="Owner" value="Amirul_Adnan" />
            <AboutRow label="Telegram" value="@amirul_adnan_trader" highlight />
            <AboutRow label="Signal Type" value="1-Minute Binary" />
            <AboutRow label="Timezone" value="Bangladesh (UTC+6)" />
            <AboutRow label="PIN" value="Protected" />
          </View>
        </LinearGradient>

        {/* Danger Zone */}
        <LinearGradient colors={['rgba(255,61,87,0.08)', '#0d1117']} style={[styles.card, { borderColor: `${Colors.sell}30` }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="warning" size={18} color={Colors.sell} />
            <Text style={[styles.cardTitle, { color: Colors.sell }]}>Danger Zone</Text>
          </View>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleClearAll} activeOpacity={0.8}>
            <MaterialIcons name="delete-forever" size={18} color={Colors.sell} />
            <Text style={styles.dangerBtnText}>Clear All Data</Text>
          </TouchableOpacity>
        </LinearGradient>

      </ScrollView>
    </Animated.View>
  );
}

function AboutRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.aboutRow}>
      <Text style={styles.aboutLabel}>{label}</Text>
      <Text style={[styles.aboutValue, highlight && { color: Colors.blue }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { gap: Spacing.md, paddingBottom: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Fonts.sizes.lg, color: Colors.textPrimary, fontWeight: Fonts.weights.bold },
  logoSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  card: {
    marginHorizontal: Spacing.base, borderRadius: Radius.xl,
    padding: Spacing.base, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardTitle: { fontSize: Fonts.sizes.base, color: Colors.textPrimary, fontWeight: Fonts.weights.semibold, flex: 1 },
  cardDesc: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, lineHeight: 20 },
  validBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.buyBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
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
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  saveBtnText: { fontSize: Fonts.sizes.base, color: Colors.bg, fontWeight: Fonts.weights.bold },
  apiNote: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  apiNoteText: { fontSize: 11, color: Colors.textMuted, flex: 1, lineHeight: 16 },
  configRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  configLabel: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary },
  configValue: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  fixedBadge: { backgroundColor: Colors.blue + '20', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  fixedBadgeText: { fontSize: 11, color: Colors.blue, fontWeight: Fonts.weights.bold },
  pairsList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pairToggleItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  pairToggleItemOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pairToggleText: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  pairToggleTextOn: { color: Colors.bg, fontWeight: Fonts.weights.bold },
  aboutRows: { gap: Spacing.sm },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  aboutLabel: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  aboutValue: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, fontWeight: Fonts.weights.medium },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, borderRadius: Radius.md,
    backgroundColor: 'rgba(255,61,87,0.12)', borderWidth: 1, borderColor: `${Colors.sell}40`,
  },
  dangerBtnText: { fontSize: Fonts.sizes.base, color: Colors.sell, fontWeight: Fonts.weights.semibold },
});
