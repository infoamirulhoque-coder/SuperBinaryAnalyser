import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors, Fonts } from '@/constants/theme';
import { Animated, Easing } from 'react-native';

interface TradingChartProps {
  symbol: string;
  height?: number;
}

const toTVSymbol = (symbol: string): string => `FX:${symbol.replace('/', '')}`;

const getChartHTML = (symbol: string): string => {
  const tvSymbol = toTVSymbol(symbol);
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #050810; overflow: hidden; }
    #chart { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
  <script>
    try {
      new TradingView.widget({
        autosize: true,
        symbol: "${tvSymbol}",
        interval: "1",
        timezone: "Asia/Dhaka",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#050810",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        hide_side_toolbar: false,
        save_image: false,
        container_id: "chart",
        backgroundColor: "#050810",
        gridColor: "rgba(240,180,41,0.04)",
        studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
        overrides: {
          "paneProperties.background": "#050810",
          "paneProperties.backgroundType": "solid",
          "scalesProperties.textColor": "#718096",
          "mainSeriesProperties.candleStyle.upColor": "#00E676",
          "mainSeriesProperties.candleStyle.downColor": "#FF3D57",
          "mainSeriesProperties.candleStyle.borderUpColor": "#00E676",
          "mainSeriesProperties.candleStyle.borderDownColor": "#FF3D57",
          "mainSeriesProperties.candleStyle.wickUpColor": "#00C853",
          "mainSeriesProperties.candleStyle.wickDownColor": "#D32F2F"
        }
      });
    } catch(e) {}
  </script>
</body>
</html>`;
};

export function TradingChart({ symbol, height = 380 }: TradingChartProps) {
  const webviewRef = useRef<WebView>(null);
  const loadAnim = React.useRef(new Animated.Value(0)).current;

  const onLoad = () => {
    Animated.timing(loadAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webviewRef}
        source={{ html: getChartHTML(symbol) }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        allowsInlineMediaPlayback
        startInLoadingState
        onLoad={onLoad}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Colors.gold} />
            <Text style={styles.loadingText}>Loading TradingView Chart...</Text>
            <Text style={styles.loadingSubText}>Connecting to live feed · {symbol}</Text>
          </View>
        )}
        onError={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
  },
  webview: { flex: 1, backgroundColor: Colors.bg },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.bg, gap: 12,
  },
  loadingText: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary },
  loadingSubText: { fontSize: Fonts.sizes.xs, color: Colors.textMuted },
});
