import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors, Fonts } from '@/constants/theme';

interface TradingChartProps {
  symbol: string;
  height?: number;
}

// Convert internal symbol format to TradingView format
const toTVSymbol = (symbol: string): string => {
  const cleaned = symbol.replace('/', '');
  return `FX:${cleaned}`;
};

const getChartHTML = (symbol: string): string => {
  const tvSymbol = toTVSymbol(symbol);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #050810; overflow: hidden; }
    #chart { width: 100vw; height: 100vh; }
    .tv-embed-widget-wrapper { width: 100% !important; height: 100% !important; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
  <script>
    new TradingView.widget({
      "autosize": true,
      "symbol": "${tvSymbol}",
      "interval": "1",
      "timezone": "Asia/Dhaka",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#050810",
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "container_id": "chart",
      "backgroundColor": "#050810",
      "gridColor": "rgba(240,180,41,0.05)",
      "studies": [
        "RSI@tv-basicstudies",
        "MACD@tv-basicstudies"
      ],
      "overrides": {
        "paneProperties.background": "#050810",
        "paneProperties.backgroundType": "solid",
        "scalesProperties.textColor": "#A0AEC0",
        "mainSeriesProperties.candleStyle.upColor": "#00E676",
        "mainSeriesProperties.candleStyle.downColor": "#FF3D57",
        "mainSeriesProperties.candleStyle.borderUpColor": "#00E676",
        "mainSeriesProperties.candleStyle.borderDownColor": "#FF3D57",
        "mainSeriesProperties.candleStyle.wickUpColor": "#00E676",
        "mainSeriesProperties.candleStyle.wickDownColor": "#FF3D57"
      }
    });
  </script>
</body>
</html>
`;
};

export function TradingChart({ symbol, height = 380 }: TradingChartProps) {
  const webviewRef = useRef<WebView>(null);

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
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Colors.gold} />
            <Text style={styles.loadingText}>Loading Chart...</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  webview: { flex: 1, backgroundColor: Colors.bg },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    gap: 12,
  },
  loadingText: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary },
});
