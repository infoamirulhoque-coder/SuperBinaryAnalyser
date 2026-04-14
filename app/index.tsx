import React, { useState, useEffect } from 'react';
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
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (!isLoading && isUnlocked) {
      router.replace('/(tabs)');
    }
  }, [isUnlocked, isLoading]);

  // Show loading state while AsyncStorage loads
  if (isLoading) {
    return <View style={styles.loading} />;
  }

  const handleUnlocked = () => {
    setTimeout(() => router.replace('/(tabs)'), 80);
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
