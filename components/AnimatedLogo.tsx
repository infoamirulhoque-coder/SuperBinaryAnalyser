import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing } from '@/constants/theme';

interface AnimatedLogoProps {
  size?: number;
  showTitle?: boolean;
  showOwner?: boolean;
}

export function AnimatedLogo({ size = 80, showTitle = true, showOwner = false }: AnimatedLogoProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const ownerAnim = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main spin (clockwise)
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Inner ring (counter-clockwise)
    Animated.loop(
      Animated.timing(ringRotate, { toValue: -1, duration: 3500, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.07, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Glow breathe
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1800, useNativeDriver: false }),
      ])
    ).start();

    // Fade-in title
    Animated.timing(titleAnim, { toValue: 1, duration: 900, delay: 300, useNativeDriver: true }).start();
    if (showOwner) {
      Animated.timing(ownerAnim, { toValue: 1, duration: 900, delay: 600, useNativeDriver: true }).start();
    }
  }, []);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spinReverse = ringRotate.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg', '0deg'] });
  const glowBorder = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(240,180,41,0.15)', 'rgba(240,180,41,0.55)'],
  });
  const glowShadow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });

  return (
    <View style={styles.container}>
      {/* Outer glow ring */}
      <Animated.View
        style={[styles.glowRing, {
          width: size + 48, height: size + 48,
          borderRadius: (size + 48) / 2,
          borderColor: glowBorder,
          shadowRadius: glowShadow as any,
          shadowColor: Colors.gold,
          shadowOpacity: 0.6,
        }]}
      />

      {/* Outer spinning dashed ring */}
      <Animated.View
        style={[styles.spinRingOuter, {
          width: size + 26, height: size + 26,
          borderRadius: (size + 26) / 2,
          transform: [{ rotate: spin }],
        }]}
      />

      {/* Inner spinning ring (reverse) */}
      <Animated.View
        style={[styles.spinRingInner, {
          width: size + 10, height: size + 10,
          borderRadius: (size + 10) / 2,
          transform: [{ rotate: spinReverse }],
        }]}
      />

      {/* Logo image */}
      <Animated.View
        style={[styles.logoWrapper, {
          width: size, height: size,
          borderRadius: size / 2,
          transform: [{ scale: pulseAnim }],
        }]}
      >
        <LinearGradient colors={['#1a1a2e', '#050810']} style={[styles.logoGrad, { borderRadius: size / 2 }]}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: size * 0.78, height: size * 0.78, borderRadius: (size * 0.78) / 2 }}
            contentFit="cover"
            transition={200}
          />
        </LinearGradient>
      </Animated.View>

      {/* Title */}
      {showTitle && (
        <Animated.View style={[styles.titleContainer, { opacity: titleAnim, transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
          <LinearGradient colors={[Colors.goldLight, Colors.gold, Colors.goldDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.titleBg}>
            <Text style={[styles.titleText, { fontSize: size < 60 ? 12 : 18 }]}>SUPER-BINARY-ANALYSER</Text>
          </LinearGradient>
          <Text style={styles.tagline}>High Accuracy 1-Min Signal Bot</Text>
        </Animated.View>
      )}

      {/* Owner */}
      {showOwner && (
        <Animated.View style={[styles.ownerContainer, { opacity: ownerAnim, transform: [{ translateY: ownerAnim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }]}>
          <Text style={styles.ownerName}>Amirul_Adnan</Text>
          <Text style={styles.ownerTelegram}>📱 @amirul_adnan_trader</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  glowRing: {
    position: 'absolute', borderWidth: 1.5,
    ...(Platform.OS === 'ios' ? { shadowOffset: { width: 0, height: 0 } } : {}),
  },
  spinRingOuter: {
    position: 'absolute', borderWidth: 2,
    borderColor: `${Colors.gold}80`,
    borderStyle: 'dashed',
  },
  spinRingInner: {
    position: 'absolute', borderWidth: 1,
    borderColor: `${Colors.blue}60`,
    borderTopColor: Colors.blue,
  },
  logoWrapper: { overflow: 'hidden', borderWidth: 2, borderColor: Colors.gold },
  logoGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titleContainer: { alignItems: 'center', marginTop: Spacing.lg, gap: 5 },
  titleBg: { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: 7 },
  titleText: { fontWeight: Fonts.weights.black, color: '#050810', letterSpacing: 1.2 },
  tagline: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary, letterSpacing: 0.4 },
  ownerContainer: { alignItems: 'center', marginTop: Spacing.sm, gap: 3 },
  ownerName: { fontSize: Fonts.sizes.md, color: Colors.gold, fontWeight: Fonts.weights.semibold, letterSpacing: 1 },
  ownerTelegram: { fontSize: Fonts.sizes.sm, color: Colors.blue, fontWeight: Fonts.weights.medium },
});
