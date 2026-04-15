import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

interface TradingChartProps {
  symbol: string;
  height?: number;
  showStudies?: boolean;
  interval?: string;
}

const toTVSymbol = (symbol: string): string => {
  // Crypto pairs
  if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('XRP') || symbol.includes('BNB')) {
    return `BINANCE:${symbol.replace('/', '')}`;
  }
  return `FX:${symbol.replace('/', '')}`;
};

const getChartHTML = (symbol: string, interval: string = '1', showStudies: boolean = true): string => {
  const tvSymbol = toTVSymbol(symbol);
  const studies = showStudies
    ? `["RSI@tv-basicstudies", "MACD@tv-basicstudies", "BB@tv-basicstudies", "Stochastic@tv-basicstudies"]`
    : `["RSI@tv-basicstudies"]`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body { width:100%; height:100%; background:#050810; overflow:hidden; }
    #chart_container { width:100%; height:100%; }
    .tv-header { display:none !important; }
  </style>
</head>
<body>
<div id="chart_container"></div>
<script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
<script>
(function(){
  try {
    var w = new TradingView.widget({
      autosize: true,
      symbol: "${tvSymbol}",
      interval: "${interval}",
      timezone: "Asia/Dhaka",
      theme: "dark",
      style: "1",
      locale: "en",
      toolbar_bg: "#0a0d16",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: false,
      save_image: false,
      container_id: "chart_container",
      backgroundColor: "#050810",
      gridColor: "rgba(240,180,41,0.03)",
      studies: ${studies},
      drawings_access: { type: 'black', tools: [] },
      overrides: {
        "paneProperties.background": "#050810",
        "paneProperties.backgroundType": "solid",
        "paneProperties.vertGridProperties.color": "rgba(240,180,41,0.04)",
        "paneProperties.horzGridProperties.color": "rgba(240,180,41,0.04)",
        "scalesProperties.textColor": "#718096",
        "scalesProperties.fontSize": 11,
        "mainSeriesProperties.candleStyle.upColor": "#00E676",
        "mainSeriesProperties.candleStyle.downColor": "#FF3D57",
        "mainSeriesProperties.candleStyle.borderUpColor": "#00E676",
        "mainSeriesProperties.candleStyle.borderDownColor": "#FF3D57",
        "mainSeriesProperties.candleStyle.wickUpColor": "#00C853",
        "mainSeriesProperties.candleStyle.wickDownColor": "#D32F2F",
        "mainSeriesProperties.priceLineColor": "#F0B429",
        "linetoolbullishengulfing.backgroundColor": "rgba(0,230,118,0.15)",
        "linetoolbearishengulfing.backgroundColor": "rgba(255,61,87,0.15)"
      },
      studies_overrides: {
        "RSI.RSI.color": "#00D4FF",
        "RSI.RSI.linewidth": 2,
        "RSI.Overbought.value": 70,
        "RSI.Oversold.value": 30,
        "MACD.MACD.color": "#00E676",
        "MACD.Signal.color": "#FF3D57",
        "Bollinger Bands.Upper.color": "rgba(240,180,41,0.6)",
        "Bollinger Bands.Lower.color": "rgba(240,180,41,0.6)"
      },
      loading_screen: { backgroundColor: "#050810", foregroundColor: "#F0B429" }
    });
  } catch(e) {
    document.body.innerHTML = '<div style="color:#F0B429;display:flex;align-items:center;justify-content:center;height:100%;font-family:monospace;font-size:14px;flex-direction:column;gap:12px"><div style=\\"font-size:32px\\">📊</div><div>Chart loading...</div><div style=\\"color:#4A5568;font-size:12px\\">Check internet connection</div></div>';
  }
})();
</script>
</body>
</html>`;
};

// Screenshot Analysis HTML — renders chart with overlaid signal info for analysis
const getScreenshotHTML = (symbol: string, interval: string = '1'): string => {
  const tvSymbol = toTVSymbol(symbol);
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body { width:100%; height:100%; background:#050810; overflow:hidden; }
    #chart_container { width:100%; height:calc(100% - 0px); }
    #overlay {
      position:fixed; bottom:0; left:0; right:0; z-index:9999;
      background:linear-gradient(transparent, rgba(5,8,16,0.95));
      padding:8px 12px;
      display:flex; align-items:center; justify-content:space-between;
      font-family: -apple-system, monospace;
    }
    .label { color:#F0B429; font-size:11px; font-weight:700; letter-spacing:0.5px; }
    .val { color:#fff; font-size:10px; }
    .badge { background:rgba(240,180,41,0.15); border:1px solid rgba(240,180,41,0.4); border-radius:5px; padding:2px 7px; }
  </style>
</head>
<body>
<div id="chart_container"></div>
<div id="overlay">
  <div class="badge"><span class="label">📊 ${symbol}</span></div>
  <div class="badge"><span class="label">1M</span><span class="val"> Chart Analysis</span></div>
  <div class="badge"><span class="label">BD: </span><span class="val" id="bdtime">--:--:--</span></div>
</div>
<script src="https://s3.tradingview.com/tv.js"></script>
<script>
setInterval(function(){
  var now = new Date();
  var bd = new Date(now.getTime() + 6*3600*1000);
  var h = bd.getUTCHours().toString().padStart(2,'0');
  var m = bd.getUTCMinutes().toString().padStart(2,'0');
  var s = bd.getUTCSeconds().toString().padStart(2,'0');
  var el = document.getElementById('bdtime');
  if(el) el.textContent = h+':'+m+':'+s;
}, 1000);
try {
  new TradingView.widget({
    autosize: true, symbol: "${tvSymbol}", interval: "${interval}",
    timezone: "Asia/Dhaka", theme: "dark", style: "1", locale: "en",
    toolbar_bg: "#0a0d16", enable_publishing: false, hide_side_toolbar: true,
    container_id: "chart_container", backgroundColor: "#050810",
    studies: ["RSI@tv-basicstudies","MACD@tv-basicstudies","BB@tv-basicstudies"],
    overrides: {
      "paneProperties.background": "#050810",
      "mainSeriesProperties.candleStyle.upColor": "#00E676",
      "mainSeriesProperties.candleStyle.downColor": "#FF3D57",
      "mainSeriesProperties.candleStyle.borderUpColor": "#00E676",
      "mainSeriesProperties.candleStyle.borderDownColor": "#FF3D57"
    }
  });
} catch(e) {}
</script>
</body>
</html>`;
};

export function TradingChart({ symbol, height = 380, showStudies = true, interval = '1' }: TradingChartProps) {
  const webviewRef = useRef<WebView>(null);
  const loadAnim = React.useRef(new Animated.Value(0)).current;
  const [loaded, setLoaded] = React.useState(false);

  const onLoad = () => {
    setLoaded(true);
    Animated.timing(loadAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  };

  const reload = () => {
    setLoaded(false);
    loadAnim.setValue(0);
    webviewRef.current?.reload();
  };

  return (
    <View style={[styles.container, { height }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: loadAnim }]}>
        <WebView
          ref={webviewRef}
          source={{ html: getChartHTML(symbol, interval, showStudies) }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          allowsInlineMediaPlayback
          startInLoadingState={false}
          onLoad={onLoad}
          onError={onLoad}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          renderLoading={() => <View style={{ flex: 1, backgroundColor: Colors.bg }} />}
        />
      </Animated.View>

      {/* Loading overlay */}
      {!loaded && (
        <View style={styles.loading}>
          <LinearGradient colors={['#0a0d16', Colors.bg]} style={StyleSheet.absoluteFill} />
          <Animated.View style={{ alignItems: 'center', gap: 14 }}>
            <MaterialIcons name="show-chart" size={40} color={Colors.gold} />
            <ActivityIndicator size="large" color={Colors.gold} />
            <Text style={styles.loadingText}>Loading Live Chart</Text>
            <Text style={styles.loadingSubText}>{symbol} · 1 Min · TradingView</Text>
          </Animated.View>
        </View>
      )}

      {/* Reload button */}
      {loaded && (
        <TouchableOpacity style={styles.reloadBtn} onPress={reload} activeOpacity={0.8}>
          <MaterialIcons name="refresh" size={14} color={Colors.gold} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Screenshot Chart (for broker chart analysis) ──────────────────
export function ScreenshotChart({ symbol, height = 500, interval = '1' }: TradingChartProps) {
  const webviewRef = useRef<WebView>(null);
  const loadAnim = React.useRef(new Animated.Value(0)).current;
  const [loaded, setLoaded] = React.useState(false);

  const onLoad = () => {
    setLoaded(true);
    Animated.timing(loadAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  };

  return (
    <View style={[styles.container, { height }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: loadAnim }]}>
        <WebView
          ref={webviewRef}
          source={{ html: getScreenshotHTML(symbol, interval) }}
          style={styles.webview}
          javaScriptEnabled domStorageEnabled
          originWhitelist={['*']} mixedContentMode="always"
          allowsInlineMediaPlayback startInLoadingState={false}
          onLoad={onLoad} onError={onLoad}
          scrollEnabled={false} bounces={false}
          renderLoading={() => <View style={{ flex: 1, backgroundColor: Colors.bg }} />}
        />
      </Animated.View>
      {!loaded && (
        <View style={styles.loading}>
          <LinearGradient colors={['#0a0d16', Colors.bg]} style={StyleSheet.absoluteFill} />
          <View style={{ alignItems: 'center', gap: 14 }}>
            <MaterialIcons name="camera-alt" size={40} color={Colors.gold} />
            <ActivityIndicator size="large" color={Colors.gold} />
            <Text style={styles.loadingText}>Loading Analysis Chart</Text>
            <Text style={styles.loadingSubText}>{symbol} · Screenshot Mode</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg, overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
  },
  webview: { flex: 1, backgroundColor: Colors.bg },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  loadingText: { fontSize: Fonts.sizes.sm, color: Colors.textSecondary },
  loadingSubText: { fontSize: Fonts.sizes.xs, color: Colors.textMuted },
  reloadBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(5,8,16,0.8)',
    borderRadius: 6, padding: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
});
