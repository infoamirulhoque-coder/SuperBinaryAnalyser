import { useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { fetchOHLCV, hasApiKey } from '@/services/twelvedata';
import { analyzeCandles } from '@/services/signalEngine';

// Signal auto engine: runs every 60s, analyzes all selected pairs
export function useSignalEngine() {
  const { selectedPairs, isSignalRunning, addSignal, apiKey } = useApp();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(false);

  const runAnalysis = useCallback(async () => {
    if (!hasApiKey()) return;
    for (const pair of selectedPairs) {
      try {
        const candles = await fetchOHLCV(pair, 100);
        if (candles.length >= 30) {
          const signal = analyzeCandles(candles, pair);
          addSignal(signal);
        }
      } catch {
        // Silently handle errors per pair
      }
    }
  }, [selectedPairs, addSignal]);

  useEffect(() => {
    if (isSignalRunning && hasApiKey()) {
      // Immediate first run
      runAnalysis();
      // Then every 60s
      timerRef.current = setInterval(() => {
        runAnalysis();
      }, 60000);
      isRunningRef.current = true;
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      isRunningRef.current = false;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSignalRunning, runAnalysis, apiKey]);

  return { runAnalysis };
}
