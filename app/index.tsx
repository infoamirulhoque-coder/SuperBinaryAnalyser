import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PinLock } from '@/components/PinLock';
import { useApp } from '@/contexts/AppContext';
import { Colors } from '@/constants/theme';

export default function IndexScreen() {
  const { isUnlocked } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showLock, setShowLock] = useState(true);

  const handleUnlocked = () => {
    setShowLock(false);
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 100);
  };

  useEffect(() => {
    if (isUnlocked) {
      router.replace('/(tabs)');
    }
  }, [isUnlocked]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {showLock && <PinLock onUnlocked={handleUnlocked} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
