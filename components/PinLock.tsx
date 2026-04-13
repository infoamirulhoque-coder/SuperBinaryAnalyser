import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { AnimatedLogo } from './AnimatedLogo';
import { useApp } from '@/contexts/AppContext';

const { width } = Dimensions.get('window');
const PIN_LENGTH = 6;

interface PinLockProps {
  onUnlocked: () => void;
}

export function PinLock({ onUnlocked }: PinLockProps) {
  const { unlock } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(Array.from({ length: PIN_LENGTH }, () => new Animated.Value(0))).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const shake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const animateDot = (index: number) => {
    Animated.sequence([
      Animated.timing(dotsAnim[index], {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    setError('');
    const newPin = pin + digit;
    animateDot(newPin.length - 1);
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      setTimeout(() => {
        const success = unlock(newPin);
        if (success) {
          onUnlocked();
        } else {
          setError(`Incorrect PIN. ${3 - attempts - 1 > 0 ? `${3 - attempts - 1} attempts left` : 'Try again'}`);
          setAttempts((a) => a + 1);
          shake();
          // Reset dots
          dotsAnim.forEach((a) => a.setValue(0));
          setPin('');
        }
      }, 200);
    }
  };

  const handleBackspace = () => {
    if (pin.length === 0) return;
    dotsAnim[pin.length - 1].setValue(0);
    setPin((p) => p.slice(0, -1));
    setError('');
  };

  const keypadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050810', '#0d1117', '#050810']} style={styles.bg} />

      {/* Animated stars */}
      <View style={styles.starsContainer}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: `${(i * 37 + 13) % 100}%`,
                top: `${(i * 29 + 7) % 100}%`,
                width: i % 3 === 0 ? 3 : 2,
                height: i % 3 === 0 ? 3 : 2,
                opacity: 0.3 + (i % 5) * 0.1,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.content}>
        {/* Logo */}
        <AnimatedLogo size={90} showTitle showOwner />

        {/* PIN area */}
        <Animated.View
          style={[
            styles.pinArea,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          <LinearGradient
            colors={['rgba(240,180,41,0.08)', 'rgba(13,17,23,0.95)']}
            style={styles.pinCard}
          >
            <Text style={styles.pinLabel}>Enter PIN to Access</Text>

            {/* Dots */}
            <View style={styles.dotsRow}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    i < pin.length ? styles.dotFilled : styles.dotEmpty,
                    {
                      transform: [
                        {
                          scale: dotsAnim[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.3],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>

            {error !== '' && (
              <View style={styles.errorRow}>
                <MaterialIcons name="error-outline" size={14} color={Colors.sell} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {keypadButtons.map((row, ri) => (
            <View key={ri} style={styles.keyRow}>
              {row.map((btn, ci) => {
                if (btn === '') return <View key={ci} style={styles.keyEmpty} />;
                if (btn === 'del') {
                  return (
                    <TouchableOpacity
                      key={ci}
                      style={styles.keyBtn}
                      onPress={handleBackspace}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="backspace" size={22} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={ci}
                    style={styles.keyBtn}
                    onPress={() => handlePress(btn)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#1a2035', '#111827']}
                      style={styles.keyGrad}
                    >
                      <Text style={styles.keyText}>{btn}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    backgroundColor: Colors.gold,
    borderRadius: 999,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  pinArea: {
    width: '100%',
    maxWidth: 360,
  },
  pinCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.base,
  },
  pinLabel: {
    fontSize: Fonts.sizes.base,
    color: Colors.textSecondary,
    fontWeight: Fonts.weights.medium,
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  dotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  dotFilled: {
    backgroundColor: Colors.gold,
    borderWidth: 2,
    borderColor: Colors.goldLight,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.sell,
  },
  keypad: {
    gap: Spacing.sm,
    width: '100%',
    maxWidth: 320,
  },
  keyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  keyBtn: {
    width: 80,
    height: 64,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    width: 80,
    height: 64,
  },
  keyText: {
    fontSize: Fonts.sizes.xxl,
    color: Colors.textPrimary,
    fontWeight: Fonts.weights.semibold,
  },
});
