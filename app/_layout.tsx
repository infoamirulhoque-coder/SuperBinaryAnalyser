import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { AppProvider } from '@/contexts/AppContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="light" backgroundColor="#050810" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#050810' } }} />
        </AppProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
