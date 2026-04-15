import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PinLock } from '@/components/PinLock';
import { useApp } from '@/contexts/AppContext';
import { Colors } from '@/constants/theme';

export default function IndexScreen() {
  const { isUnlocked, isLoading } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading && isUnlocked) {
      router.replace('/(tabs)');
    }
  }, [isUnlocked, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [isLoading]);

  if (isLoading) {
    return <View style={styles.loading} />;
  }

  if (isUnlocked) {
    return <View style={styles.loading} />;
  }

  const handleUnlocked = () => {
    setTimeout(() => router.replace('/(tabs)'), 100);
  };

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, opacity: fadeAnim }]}>
      <PinLock onUnlocked={handleUnlocked} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, backgroundColor: Colors.bg },
});
