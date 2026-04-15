import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Signal } from '@/services/signalEngine';
import { setApiKey, clearAllCaches } from '@/services/twelvedata';

// ── 40+ Real Market Pairs ──────────────────────────────────────────
export const FOREX_PAIRS = [
  // Major Pairs
  { symbol: 'EUR/USD', label: 'EUR/USD', group: 'Major' },
  { symbol: 'GBP/USD', label: 'GBP/USD', group: 'Major' },
  { symbol: 'USD/JPY', label: 'USD/JPY', group: 'Major' },
  { symbol: 'USD/CHF', label: 'USD/CHF', group: 'Major' },
  { symbol: 'AUD/USD', label: 'AUD/USD', group: 'Major' },
  { symbol: 'USD/CAD', label: 'USD/CAD', group: 'Major' },
  { symbol: 'NZD/USD', label: 'NZD/USD', group: 'Major' },
  { symbol: 'USD/CNY', label: 'USD/CNY', group: 'Major' },
  // Cross Pairs
  { symbol: 'EUR/GBP', label: 'EUR/GBP', group: 'Cross' },
  { symbol: 'EUR/JPY', label: 'EUR/JPY', group: 'Cross' },
  { symbol: 'GBP/JPY', label: 'GBP/JPY', group: 'Cross' },
  { symbol: 'EUR/CHF', label: 'EUR/CHF', group: 'Cross' },
  { symbol: 'EUR/AUD', label: 'EUR/AUD', group: 'Cross' },
  { symbol: 'GBP/AUD', label: 'GBP/AUD', group: 'Cross' },
  { symbol: 'AUD/JPY', label: 'AUD/JPY', group: 'Cross' },
  { symbol: 'CHF/JPY', label: 'CHF/JPY', group: 'Cross' },
  { symbol: 'EUR/CAD', label: 'EUR/CAD', group: 'Cross' },
  { symbol: 'GBP/CHF', label: 'GBP/CHF', group: 'Cross' },
  { symbol: 'CAD/JPY', label: 'CAD/JPY', group: 'Cross' },
  { symbol: 'NZD/JPY', label: 'NZD/JPY', group: 'Cross' },
  { symbol: 'AUD/NZD', label: 'AUD/NZD', group: 'Cross' },
  { symbol: 'GBP/NZD', label: 'GBP/NZD', group: 'Cross' },
  { symbol: 'EUR/NZD', label: 'EUR/NZD', group: 'Cross' },
  { symbol: 'AUD/CHF', label: 'AUD/CHF', group: 'Cross' },
  { symbol: 'GBP/CAD', label: 'GBP/CAD', group: 'Cross' },
  { symbol: 'NZD/CHF', label: 'NZD/CHF', group: 'Cross' },
  // Exotic Pairs
  { symbol: 'USD/SGD', label: 'USD/SGD', group: 'Exotic' },
  { symbol: 'USD/HKD', label: 'USD/HKD', group: 'Exotic' },
  { symbol: 'USD/MXN', label: 'USD/MXN', group: 'Exotic' },
  { symbol: 'USD/ZAR', label: 'USD/ZAR', group: 'Exotic' },
  { symbol: 'USD/NOK', label: 'USD/NOK', group: 'Exotic' },
  { symbol: 'USD/SEK', label: 'USD/SEK', group: 'Exotic' },
  { symbol: 'USD/TRY', label: 'USD/TRY', group: 'Exotic' },
  { symbol: 'USD/INR', label: 'USD/INR', group: 'Exotic' },
  { symbol: 'EUR/TRY', label: 'EUR/TRY', group: 'Exotic' },
  { symbol: 'EUR/ZAR', label: 'EUR/ZAR', group: 'Exotic' },
  // OTC/Crypto Popular
  { symbol: 'BTC/USD', label: 'BTC/USD', group: 'Crypto' },
  { symbol: 'ETH/USD', label: 'ETH/USD', group: 'Crypto' },
  { symbol: 'XRP/USD', label: 'XRP/USD', group: 'Crypto' },
  { symbol: 'BNB/USD', label: 'BNB/USD', group: 'Crypto' },
];

export interface AppState {
  isUnlocked: boolean;
  apiKey: string;
  selectedPairs: string[];
  activePair: string;
  signals: Signal[];
  isSignalRunning: boolean;
  lastSignal: Signal | null;
  isApiValid: boolean | null;
  isWeekendLocked: boolean;
  isLoading: boolean;
  screenshotMode: boolean;
  screenshotPair: string;
}

interface AppContextType extends AppState {
  unlock: (pin: string) => boolean;
  setAppApiKey: (key: string) => Promise<void>;
  togglePair: (symbol: string) => void;
  setActivePair: (symbol: string) => void;
  addSignal: (signal: Signal) => void;
  startSignalEngine: () => void;
  stopSignalEngine: () => void;
  clearSignals: () => void;
  setApiValid: (v: boolean | null) => void;
  setWeekendLocked: (v: boolean) => void;
  setScreenshotMode: (v: boolean, pair?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CORRECT_PIN = '707078';
const STORAGE_KEYS = {
  apiKey: 'sba_apikey_v3',
  selectedPairs: 'sba_pairs_v3',
  signals: 'sba_signals_v3',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [apiKey, setApiKeyState] = useState('');
  const [selectedPairs, setSelectedPairs] = useState<string[]>(['EUR/USD', 'GBP/USD', 'USD/JPY']);
  const [activePair, setActivePairState] = useState('EUR/USD');
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isSignalRunning, setIsSignalRunning] = useState(false);
  const [lastSignal, setLastSignal] = useState<Signal | null>(null);
  const [isApiValid, setApiValidState] = useState<boolean | null>(null);
  const [isWeekendLocked, setIsWeekendLockedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [screenshotMode, setScreenshotModeState] = useState(false);
  const [screenshotPair, setScreenshotPairState] = useState('EUR/USD');

  useEffect(() => {
    const load = async () => {
      try {
        const [savedKey, savedPairs, savedSignals] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.apiKey),
          AsyncStorage.getItem(STORAGE_KEYS.selectedPairs),
          AsyncStorage.getItem(STORAGE_KEYS.signals),
        ]);
        if (savedKey?.trim()) {
          setApiKeyState(savedKey.trim());
          setApiKey(savedKey.trim());
        }
        if (savedPairs) {
          try { setSelectedPairs(JSON.parse(savedPairs)); } catch {}
        }
        if (savedSignals) {
          try {
            const parsed: Signal[] = JSON.parse(savedSignals);
            if (Array.isArray(parsed)) setSignals(parsed.slice(0, 60));
          } catch {}
        }
      } catch {}
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const unlock = useCallback((pin: string): boolean => {
    if (pin === CORRECT_PIN) { setIsUnlocked(true); return true; }
    return false;
  }, []);

  const setAppApiKey = useCallback(async (key: string) => {
    const trimmed = key.trim();
    setApiKeyState(trimmed);
    setApiKey(trimmed);
    try { await AsyncStorage.setItem(STORAGE_KEYS.apiKey, trimmed); } catch {}
  }, []);

  const togglePair = useCallback((symbol: string) => {
    setSelectedPairs((prev) => {
      const next = prev.includes(symbol) ? prev.filter(p => p !== symbol) : [...prev, symbol];
      if (next.length === 0) return prev;
      AsyncStorage.setItem(STORAGE_KEYS.selectedPairs, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setActivePair = useCallback((symbol: string) => { setActivePairState(symbol); }, []);

  const addSignal = useCallback((signal: Signal) => {
    setSignals((prev) => {
      const next = [signal, ...prev].slice(0, 60);
      AsyncStorage.setItem(STORAGE_KEYS.signals, JSON.stringify(next)).catch(() => {});
      return next;
    });
    setLastSignal(signal);
  }, []);

  const startSignalEngine = useCallback(() => setIsSignalRunning(true), []);
  const stopSignalEngine = useCallback(() => setIsSignalRunning(false), []);

  const clearSignals = useCallback(async () => {
    setSignals([]); setLastSignal(null); clearAllCaches();
    try { await AsyncStorage.removeItem(STORAGE_KEYS.signals); } catch {}
  }, []);

  const setApiValid = useCallback((v: boolean | null) => setApiValidState(v), []);
  const setWeekendLocked = useCallback((v: boolean) => setIsWeekendLockedState(v), []);
  const setScreenshotMode = useCallback((v: boolean, pair?: string) => {
    setScreenshotModeState(v);
    if (pair) setScreenshotPairState(pair);
  }, []);

  return (
    <AppContext.Provider value={{
      isUnlocked, apiKey, selectedPairs, activePair,
      signals, isSignalRunning, lastSignal, isApiValid,
      isWeekendLocked, isLoading, screenshotMode, screenshotPair,
      unlock, setAppApiKey, togglePair, setActivePair,
      addSignal, startSignalEngine, stopSignalEngine,
      clearSignals, setApiValid, setWeekendLocked, setScreenshotMode,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
