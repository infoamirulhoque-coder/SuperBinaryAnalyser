import { useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { fetchOHLCV, hasApiKey, isWeekend } from '@/services/twelvedata';
import { analyzeCandles } from '@/services/signalEngine';

// Signal auto-engine: runs every 60s, staggered pair analysis to save API credits
export function useSignalEngine() {
  const { selectedPairs, isSignalRunning, addSignal, apiKey, stopSignalEngine, setWeekendLocked } = useApp();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAnalyzing = useRef(false);

  const runAnalysis = useCallback(async () => {
    if (!hasApiKey()) return;
    if (isWeekend()) {
      // Lock engine during weekend
      stopSignalEngine();
      setWeekendLocked(true);
      return;
    }
    setWeekendLocked(false);

    if (isAnalyzing.current) return; // prevent overlapping runs
    isAnalyzing.current = true;

    // Stagger pair analysis by 700ms each to respect rate limits
    for (let i = 0; i < selectedPairs.length; i++) {
      const pair = selectedPairs[i];
      try {
        // Use cache-first: only fetches if >55s old
        const candles = await fetchOHLCV(pair, 80);
        if (candles.length >= 40) {
          const signal = analyzeCandles(candles, pair);
          addSignal(signal);
        }
      } catch (err: any) {
        // Skip this pair silently — do not crash the engine
      }
      // Stagger delay between pairs (700ms) to avoid rate limiting
      if (i < selectedPairs.length - 1) {
        await new Promise((r) => setTimeout(r, 700));
      }
    }

    isAnalyzing.current = false;
  }, [selectedPairs, addSignal, stopSignalEngine, setWeekendLocked]);

  useEffect(() => {
    if (isSignalRunning && hasApiKey()) {
      // Check weekend immediately
      if (isWeekend()) {
        stopSignalEngine();
        setWeekendLocked(true);
        return;
      }

      setWeekendLocked(false);
      // First run immediately
      runAnalysis();

      // Then every 62s (slight offset avoids exactly hitting 60s API rate window)
      timerRef.current = setInterval(() => {
        runAnalysis();
      }, 62_000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      isAnalyzing.current = false;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isSignalRunning, runAnalysis, apiKey]);

  return { runAnalysis };
}
