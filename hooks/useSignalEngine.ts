import { useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { fetchOHLCV, hasApiKey, isWeekend } from '@/services/twelvedata';
import { analyzeCandles } from '@/services/signalEngine';

export function useSignalEngine() {
  const { selectedPairs, isSignalRunning, addSignal, apiKey, stopSignalEngine, setWeekendLocked } = useApp();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAnalyzing = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!hasApiKey()) return;

    if (isWeekend()) {
      stopSignalEngine();
      setWeekendLocked(true);
      return;
    }
    setWeekendLocked(false);

    if (isAnalyzing.current) return;
    isAnalyzing.current = true;

    const pairs = [...selectedPairs];

    for (let i = 0; i < pairs.length; i++) {
      if (!isMounted.current || !isAnalyzing.current) break;
      const pair = pairs[i];
      try {
        const candles = await fetchOHLCV(pair, 80);
        if (candles.length >= 40 && isMounted.current) {
          const signal = analyzeCandles(candles, pair);
          addSignal(signal);
        }
      } catch {
        // Skip this pair silently
      }
      if (i < pairs.length - 1) {
        await new Promise(r => setTimeout(r, 750));
      }
    }

    isAnalyzing.current = false;
  }, [selectedPairs, addSignal, stopSignalEngine, setWeekendLocked]);

  useEffect(() => {
    if (isSignalRunning && hasApiKey()) {
      if (isWeekend()) {
        stopSignalEngine();
        setWeekendLocked(true);
        return;
      }
      setWeekendLocked(false);

      // First run immediately
      runAnalysis();

      // Then every 62s
      timerRef.current = setInterval(runAnalysis, 62_000);
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
