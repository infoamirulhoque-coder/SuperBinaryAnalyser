import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Signal } from '@/services/signalEngine';
import { setApiKey, getApiKey } from '@/services/twelvedata';

export const FOREX_PAIRS = [
  { symbol: 'EUR/USD', label: 'EUR/USD', group: 'Major' },
  { symbol: 'GBP/USD', label: 'GBP/USD', group: 'Major' },
  { symbol: 'USD/JPY', label: 'USD/JPY', group: 'Major' },
  { symbol: 'USD/CHF', label: 'USD/CHF', group: 'Major' },
  { symbol: 'AUD/USD', label: 'AUD/USD', group: 'Major' },
  { symbol: 'USD/CAD', label: 'USD/CAD', group: 'Major' },
  { symbol: 'NZD/USD', label: 'NZD/USD', group: 'Major' },
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
  { symbol: 'USD/SGD', label: 'USD/SGD', group: 'Exotic' },
  { symbol: 'USD/HKD', label: 'USD/HKD', group: 'Exotic' },
  { symbol: 'EUR/NZD', label: 'EUR/NZD', group: 'Exotic' },
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
}

interface AppContextType extends AppState {
  unlock: (pin: string) => boolean;
  setAppApiKey: (key: string) => void;
  togglePair: (symbol: string) => void;
  setActivePair: (symbol: string) => void;
  addSignal: (signal: Signal) => void;
  startSignalEngine: () => void;
  stopSignalEngine: () => void;
  clearSignals: () => void;
  setApiValid: (v: boolean | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CORRECT_PIN = '707078';
const STORAGE_KEYS = {
  apiKey: 'sba_apikey',
  selectedPairs: 'sba_pairs',
  signals: 'sba_signals',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [apiKey, setApiKeyState] = useState('');
  const [selectedPairs, setSelectedPairs] = useState<string[]>([
    'EUR/USD', 'GBP/USD', 'USD/JPY',
  ]);
  const [activePair, setActivePairState] = useState('EUR/USD');
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isSignalRunning, setIsSignalRunning] = useState(false);
  const [lastSignal, setLastSignal] = useState<Signal | null>(null);
  const [isApiValid, setApiValidState] = useState<boolean | null>(null);

  // Load persisted data
  useEffect(() => {
    const load = async () => {
      try {
        const [savedKey, savedPairs, savedSignals] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.apiKey),
          AsyncStorage.getItem(STORAGE_KEYS.selectedPairs),
          AsyncStorage.getItem(STORAGE_KEYS.signals),
        ]);
        if (savedKey) {
          setApiKeyState(savedKey);
          setApiKey(savedKey);
        }
        if (savedPairs) setSelectedPairs(JSON.parse(savedPairs));
        if (savedSignals) {
          const parsed: Signal[] = JSON.parse(savedSignals);
          setSignals(parsed.slice(-50));
        }
      } catch {}
    };
    load();
  }, []);

  const unlock = useCallback((pin: string): boolean => {
    if (pin === CORRECT_PIN) {
      setIsUnlocked(true);
      return true;
    }
    return false;
  }, []);

  const setAppApiKey = useCallback(async (key: string) => {
    setApiKeyState(key);
    setApiKey(key);
    try { await AsyncStorage.setItem(STORAGE_KEYS.apiKey, key); } catch {}
  }, []);

  const togglePair = useCallback(async (symbol: string) => {
    setSelectedPairs((prev) => {
      const next = prev.includes(symbol)
        ? prev.filter((p) => p !== symbol)
        : [...prev, symbol];
      AsyncStorage.setItem(STORAGE_KEYS.selectedPairs, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setActivePair = useCallback((symbol: string) => {
    setActivePairState(symbol);
  }, []);

  const addSignal = useCallback(async (signal: Signal) => {
    setSignals((prev) => {
      const next = [signal, ...prev].slice(0, 50);
      AsyncStorage.setItem(STORAGE_KEYS.signals, JSON.stringify(next)).catch(() => {});
      return next;
    });
    setLastSignal(signal);
  }, []);

  const startSignalEngine = useCallback(() => setIsSignalRunning(true), []);
  const stopSignalEngine = useCallback(() => setIsSignalRunning(false), []);

  const clearSignals = useCallback(async () => {
    setSignals([]);
    setLastSignal(null);
    try { await AsyncStorage.removeItem(STORAGE_KEYS.signals); } catch {}
  }, []);

  const setApiValid = useCallback((v: boolean | null) => setApiValidState(v), []);

  return (
    <AppContext.Provider
      value={{
        isUnlocked,
        apiKey,
        selectedPairs,
        activePair,
        signals,
        isSignalRunning,
        lastSignal,
        isApiValid,
        unlock,
        setAppApiKey,
        togglePair,
        setActivePair,
        addSignal,
        startSignalEngine,
        stopSignalEngine,
        clearSignals,
        setApiValid,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
