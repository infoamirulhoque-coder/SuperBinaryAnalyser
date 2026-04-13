// Super-Binary-Analyser Theme System
export const Colors = {
  // Core backgrounds
  bg: '#050810',
  bgCard: '#0d1117',
  bgElevated: '#111827',
  bgInput: '#161d2b',

  // Brand
  gold: '#F0B429',
  goldLight: '#FFD700',
  goldDark: '#c8960a',
  goldGlow: 'rgba(240, 180, 41, 0.15)',

  // Accents
  blue: '#00D4FF',
  blueGlow: 'rgba(0, 212, 255, 0.15)',
  purple: '#7C3AED',
  purpleGlow: 'rgba(124, 58, 237, 0.15)',

  // Signal colors
  buy: '#00E676',
  buyBg: 'rgba(0, 230, 118, 0.12)',
  buyGlow: 'rgba(0, 230, 118, 0.3)',
  sell: '#FF3D57',
  sellBg: 'rgba(255, 61, 87, 0.12)',
  sellGlow: 'rgba(255, 61, 87, 0.3)',
  wait: '#FFC107',
  waitBg: 'rgba(255, 193, 7, 0.12)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#4A5568',
  textGold: '#F0B429',

  // Borders
  border: 'rgba(240, 180, 41, 0.12)',
  borderBright: 'rgba(240, 180, 41, 0.3)',
  borderGlow: 'rgba(0, 212, 255, 0.2)',

  // Gradients (as arrays for LinearGradient)
  gradientGold: ['#F0B429', '#c8960a'],
  gradientDark: ['#050810', '#0d1117'],
  gradientCard: ['#111827', '#0d1117'],
  gradientBuy: ['#00E676', '#00C853'],
  gradientSell: ['#FF3D57', '#D32F2F'],
  gradientBlue: ['#00D4FF', '#0099cc'],
  gradientPurple: ['#7C3AED', '#5B21B6'],

  // Session colors
  london: '#3B82F6',
  newYork: '#EF4444',
  tokyo: '#F59E0B',
  sydney: '#10B981',

  // Overlay
  overlay: 'rgba(5, 8, 16, 0.9)',
  semiOverlay: 'rgba(5, 8, 16, 0.6)',
};

export const Fonts = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    hero: 40,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
    black: '900' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const Shadow = {
  gold: {
    shadowColor: '#F0B429',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  blue: {
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  buy: {
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  sell: {
    shadowColor: '#FF3D57',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
};
