import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
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

  useEffect(() => {
    // Spinning border
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Fade in title
    Animated.timing(titleAnim, {
      toValue: 1,
      duration: 800,
      delay: 400,
      useNativeDriver: true,
    }).start();

    if (showOwner) {
      Animated.timing(ownerAnim, {
        toValue: 1,
        duration: 800,
        delay: 700,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(240,180,41,0.2)', 'rgba(240,180,41,0.6)'],
  });

  return (
    <View style={styles.container}>
      {/* Glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size + 40,
            height: size + 40,
            borderRadius: (size + 40) / 2,
            borderColor: glowColor,
          },
        ]}
      />
      {/* Spinning gradient ring */}
      <Animated.View
        style={[
          styles.spinRing,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            transform: [{ rotate: spin }],
          },
        ]}
      />
      {/* Logo container */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#1a1a2e', '#0d0d1a']}
          style={[styles.logoGradient, { borderRadius: size / 2 }]}
        >
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: size * 0.75, height: size * 0.75, borderRadius: (size * 0.75) / 2 }}
            contentFit="cover"
            transition={200}
          />
        </LinearGradient>
      </Animated.View>

      {showTitle && (
        <Animated.View style={[styles.titleContainer, { opacity: titleAnim }]}>
          <LinearGradient
            colors={[Colors.goldLight, Colors.gold, Colors.goldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleGradientBg}
          >
            <Text style={[styles.titleText, { fontSize: size < 60 ? 14 : 20 }]}>
              SUPER-BINARY-ANALYSER
            </Text>
          </LinearGradient>
          <Text style={styles.tagline}>High Accuracy 1-Min Signal Bot</Text>
        </Animated.View>
      )}

      {showOwner && (
        <Animated.View style={[styles.ownerContainer, { opacity: ownerAnim }]}>
          <Text style={styles.ownerName}>Amirul_Adnan</Text>
          <Text style={styles.ownerTelegram}>📱 @amirul_adnan_trader</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  spinRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.gold,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  logoWrapper: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  logoGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: 4,
  },
  titleGradientBg: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 6,
  },
  titleText: {
    fontWeight: Fonts.weights.black,
    color: '#050810',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  ownerContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 2,
  },
  ownerName: {
    fontSize: Fonts.sizes.md,
    color: Colors.gold,
    fontWeight: Fonts.weights.semibold,
    letterSpacing: 1,
  },
  ownerTelegram: {
    fontSize: Fonts.sizes.sm,
    color: Colors.blue,
    fontWeight: Fonts.weights.medium,
  },
});
