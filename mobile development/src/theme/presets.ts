/**
 * Vidyouth — palette presets. Stored as RGB triplets so the runtime can
 * recompose alpha from the user-controlled glass / border opacity sliders.
 */

export type PaletteName =
  | 'warm-amber'
  | 'cyber-navy'
  | 'warm-beige'
  | 'calm-green'
  | 'purple'
  | 'apple-light'
  | 'apple-dark'
  | 'swiss-white'
  | 'rose-blush'
  | 'ocean-deep'
  | 'sunset-orange'
  | 'monokai-pro'
  | 'graphite'
  | 'high-contrast';

export interface BasePalette {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgGradientStart: string;
  bgGradientEnd: string;

  /** RGB triplet ("80, 50, 25") used to build glassBg + glassBgStrong with alpha from effects. */
  glassRgb: string;
  /** RGB triplet for the 1px translucent border. */
  glassBorderRgb: string;

  accentPrimary: string;
  accentSecondary: string;
  accentGradient: [string, string];

  success: string;
  warning: string;
  danger: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  shimmerPrimary: string;
  shimmerSecondary: string;

  glowPrimary: string;
  shadowColor: string;

  auraA: string;
  auraB: string;
  auraC: string;
}

export const presetMeta: Record<PaletteName, { label: string; description: string }> = {
  'warm-amber':    { label: 'Warm Amber',    description: 'Espresso-dark with caramel highlights.' },
  'cyber-navy':    { label: 'Cyber Navy',    description: 'Deep blue with electric AI accents.' },
  'warm-beige':    { label: 'Warm Beige',    description: 'Soft taupe — quiet editorial mood.' },
  'calm-green':    { label: 'Calm Green',    description: 'Forest tones for focused study.' },
  'purple':        { label: 'Purple',        description: 'Royal violet for creative work.' },
  'apple-light':   { label: 'Apple Light',   description: 'Bright iOS-style minimal canvas.' },
  'apple-dark':    { label: 'Apple Dark',    description: 'macOS pro — black with Apple blue.' },
  'swiss-white':   { label: 'Swiss White',   description: 'Pure white — Helvetica-grade restraint.' },
  'rose-blush':    { label: 'Rose Blush',    description: 'Pink burgundy — warm focus mode.' },
  'ocean-deep':    { label: 'Ocean Deep',    description: 'Cyan over deep navy — calm + technical.' },
  'sunset-orange': { label: 'Sunset',        description: 'Amber + ember — golden-hour ambience.' },
  'monokai-pro':   { label: 'Monokai',       description: 'Classic IDE green on charcoal.' },
  'graphite':      { label: 'Graphite',      description: 'Neutral grey — minimal distraction.' },
  'high-contrast': { label: 'High Contrast', description: 'Black + amber — maximum legibility.' },
};

export const presets: Record<PaletteName, BasePalette> = {
  'warm-amber': {
    bgPrimary: '#150A04',
    bgSecondary: '#2A170A',
    bgTertiary: '#3A1F0E',
    bgGradientStart: '#1A0E06',
    bgGradientEnd: '#0E0703',
    glassRgb: '80, 50, 25',
    glassBorderRgb: '232, 194, 140',
    accentPrimary: '#E8C28C',
    accentSecondary: '#C99A5C',
    accentGradient: ['#F5C679', '#C99A5C'],
    success: '#B8E0A0',
    warning: '#F5C679',
    danger: '#E89A8C',
    textPrimary: '#FAF0E0',
    textSecondary: '#D9C4A6',
    textMuted: '#A88A6E',
    shimmerPrimary: 'rgba(255, 220, 170, 0.65)',
    shimmerSecondary: 'rgba(255, 240, 210, 0.35)',
    glowPrimary: '#E8C28C',
    shadowColor: '#000000',
    auraA: 'rgba(232, 168, 92, 0.28)',
    auraB: 'rgba(201, 154, 92, 0.22)',
    auraC: 'rgba(120, 70, 30, 0.30)',
  },

  'cyber-navy': {
    bgPrimary: '#040A18',
    bgSecondary: '#0A1A33',
    bgTertiary: '#0F2547',
    bgGradientStart: '#08172E',
    bgGradientEnd: '#020815',
    glassRgb: '40, 80, 160',
    glassBorderRgb: '140, 200, 255',
    accentPrimary: '#7CC4FF',
    accentSecondary: '#4F8FE8',
    accentGradient: ['#7CC4FF', '#4F8FE8'],
    success: '#7BE0B8',
    warning: '#FFD27C',
    danger: '#FF8C8C',
    textPrimary: '#F0F6FF',
    textSecondary: '#B8CDEC',
    textMuted: '#7A92B5',
    shimmerPrimary: 'rgba(160, 220, 255, 0.65)',
    shimmerSecondary: 'rgba(220, 240, 255, 0.35)',
    glowPrimary: '#7CC4FF',
    shadowColor: '#000000',
    auraA: 'rgba(80, 160, 255, 0.28)',
    auraB: 'rgba(120, 200, 255, 0.22)',
    auraC: 'rgba(30, 60, 140, 0.32)',
  },

  'warm-beige': {
    bgPrimary: '#1F160E',
    bgSecondary: '#2E2218',
    bgTertiary: '#3D2E20',
    bgGradientStart: '#251A10',
    bgGradientEnd: '#160F08',
    glassRgb: '150, 120, 90',
    glassBorderRgb: '230, 210, 180',
    accentPrimary: '#E6C9A0',
    accentSecondary: '#B89870',
    accentGradient: ['#E6C9A0', '#B89870'],
    success: '#B8D8A0',
    warning: '#E8C684',
    danger: '#D89888',
    textPrimary: '#F5ECDD',
    textSecondary: '#D8C6A8',
    textMuted: '#A89878',
    shimmerPrimary: 'rgba(245, 225, 190, 0.55)',
    shimmerSecondary: 'rgba(255, 240, 220, 0.30)',
    glowPrimary: '#E6C9A0',
    shadowColor: '#000000',
    auraA: 'rgba(230, 200, 160, 0.22)',
    auraB: 'rgba(180, 150, 110, 0.20)',
    auraC: 'rgba(120, 90, 60, 0.30)',
  },

  'calm-green': {
    bgPrimary: '#08140C',
    bgSecondary: '#0F2418',
    bgTertiary: '#163524',
    bgGradientStart: '#0D2014',
    bgGradientEnd: '#050C08',
    glassRgb: '50, 110, 80',
    glassBorderRgb: '160, 220, 180',
    accentPrimary: '#9EDDB5',
    accentSecondary: '#5AAE7E',
    accentGradient: ['#9EDDB5', '#5AAE7E'],
    success: '#9EDDB5',
    warning: '#F5C679',
    danger: '#E89A8C',
    textPrimary: '#EEF7F0',
    textSecondary: '#B8D6C2',
    textMuted: '#7AA08A',
    shimmerPrimary: 'rgba(180, 240, 200, 0.55)',
    shimmerSecondary: 'rgba(220, 250, 230, 0.30)',
    glowPrimary: '#9EDDB5',
    shadowColor: '#000000',
    auraA: 'rgba(120, 220, 160, 0.22)',
    auraB: 'rgba(80, 180, 120, 0.20)',
    auraC: 'rgba(20, 60, 40, 0.32)',
  },

  purple: {
    bgPrimary: '#0F0820',
    bgSecondary: '#1C1136',
    bgTertiary: '#2A1B50',
    bgGradientStart: '#180D2E',
    bgGradientEnd: '#0A0518',
    glassRgb: '120, 80, 200',
    glassBorderRgb: '200, 170, 255',
    accentPrimary: '#C4A8FF',
    accentSecondary: '#8B5CF6',
    accentGradient: ['#C4A8FF', '#8B5CF6'],
    success: '#9EDDB5',
    warning: '#F5C679',
    danger: '#E89A8C',
    textPrimary: '#F4EEFF',
    textSecondary: '#C8BBE5',
    textMuted: '#8E80B5',
    shimmerPrimary: 'rgba(220, 200, 255, 0.60)',
    shimmerSecondary: 'rgba(240, 230, 255, 0.32)',
    glowPrimary: '#C4A8FF',
    shadowColor: '#000000',
    auraA: 'rgba(160, 100, 255, 0.28)',
    auraB: 'rgba(120, 80, 220, 0.22)',
    auraC: 'rgba(60, 30, 120, 0.32)',
  },

  'apple-light': {
    bgPrimary: '#F5F5F7',
    bgSecondary: '#FFFFFF',
    bgTertiary: '#FAFAFB',
    bgGradientStart: '#FFFFFF',
    bgGradientEnd: '#EAEAEE',
    glassRgb: '255, 255, 255',
    glassBorderRgb: '0, 0, 0',
    accentPrimary: '#0071E3',
    accentSecondary: '#0058B3',
    accentGradient: ['#0A84FF', '#0058B3'],
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    textPrimary: '#1D1D1F',
    textSecondary: '#3A3A3C',
    textMuted: '#86868B',
    shimmerPrimary: 'rgba(0, 113, 227, 0.30)',
    shimmerSecondary: 'rgba(80, 160, 255, 0.20)',
    glowPrimary: '#0071E3',
    shadowColor: '#000000',
    auraA: 'rgba(0, 113, 227, 0.10)',
    auraB: 'rgba(120, 200, 255, 0.10)',
    auraC: 'rgba(220, 220, 230, 0.40)',
  },

  'apple-dark': {
    bgPrimary: '#000000',
    bgSecondary: '#101013',
    bgTertiary: '#1C1C1E',
    bgGradientStart: '#0A0A0C',
    bgGradientEnd: '#000000',
    glassRgb: '255, 255, 255',
    glassBorderRgb: '255, 255, 255',
    accentPrimary: '#0A84FF',
    accentSecondary: '#0066CC',
    accentGradient: ['#0A84FF', '#0066CC'],
    success: '#30D158',
    warning: '#FF9F0A',
    danger: '#FF453A',
    textPrimary: '#FFFFFF',
    textSecondary: '#E0E0E5',
    textMuted: '#8E8E93',
    shimmerPrimary: 'rgba(255, 255, 255, 0.45)',
    shimmerSecondary: 'rgba(180, 200, 255, 0.25)',
    glowPrimary: '#0A84FF',
    shadowColor: '#000000',
    auraA: 'rgba(10, 132, 255, 0.18)',
    auraB: 'rgba(80, 160, 255, 0.10)',
    auraC: 'rgba(40, 40, 50, 0.40)',
  },

  'swiss-white': {
    bgPrimary: '#FFFFFF',
    bgSecondary: '#FAFAFA',
    bgTertiary: '#F2F2F2',
    bgGradientStart: '#FFFFFF',
    bgGradientEnd: '#F0F0F0',
    glassRgb: '20, 20, 20',
    glassBorderRgb: '20, 20, 20',
    accentPrimary: '#111111',
    accentSecondary: '#444444',
    accentGradient: ['#222222', '#000000'],
    success: '#1B8E3F',
    warning: '#C97E12',
    danger: '#C72A2A',
    textPrimary: '#0A0A0A',
    textSecondary: '#3A3A3A',
    textMuted: '#7A7A7A',
    shimmerPrimary: 'rgba(0, 0, 0, 0.18)',
    shimmerSecondary: 'rgba(0, 0, 0, 0.08)',
    glowPrimary: '#111111',
    shadowColor: '#000000',
    auraA: 'rgba(220, 220, 230, 0.50)',
    auraB: 'rgba(200, 200, 210, 0.40)',
    auraC: 'rgba(240, 240, 245, 0.60)',
  },

  'rose-blush': {
    bgPrimary: '#1F0710',
    bgSecondary: '#3A1224',
    bgTertiary: '#4D1A30',
    bgGradientStart: '#290A18',
    bgGradientEnd: '#150508',
    glassRgb: '180, 60, 90',
    glassBorderRgb: '251, 113, 133',
    accentPrimary: '#FB7185',
    accentSecondary: '#F43F5E',
    accentGradient: ['#FB7185', '#F43F5E'],
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#EF4444',
    textPrimary: '#FFF1F4',
    textSecondary: '#F5C8D2',
    textMuted: '#C99AA7',
    shimmerPrimary: 'rgba(255, 180, 200, 0.60)',
    shimmerSecondary: 'rgba(255, 220, 230, 0.30)',
    glowPrimary: '#FB7185',
    shadowColor: '#000000',
    auraA: 'rgba(251, 113, 133, 0.26)',
    auraB: 'rgba(244, 63, 94, 0.20)',
    auraC: 'rgba(120, 20, 40, 0.30)',
  },

  'ocean-deep': {
    bgPrimary: '#04141F',
    bgSecondary: '#082F49',
    bgTertiary: '#0E4159',
    bgGradientStart: '#072438',
    bgGradientEnd: '#020B12',
    glassRgb: '40, 120, 160',
    glassBorderRgb: '34, 211, 238',
    accentPrimary: '#22D3EE',
    accentSecondary: '#0EA5E9',
    accentGradient: ['#22D3EE', '#0EA5E9'],
    success: '#34D399',
    warning: '#FACC15',
    danger: '#F87171',
    textPrimary: '#ECFEFF',
    textSecondary: '#C7EFF7',
    textMuted: '#8EBDC8',
    shimmerPrimary: 'rgba(160, 230, 250, 0.60)',
    shimmerSecondary: 'rgba(220, 245, 255, 0.30)',
    glowPrimary: '#22D3EE',
    shadowColor: '#000000',
    auraA: 'rgba(34, 211, 238, 0.26)',
    auraB: 'rgba(14, 165, 233, 0.20)',
    auraC: 'rgba(10, 50, 80, 0.32)',
  },

  'sunset-orange': {
    bgPrimary: '#1A0A04',
    bgSecondary: '#3A1505',
    bgTertiary: '#4F1F08',
    bgGradientStart: '#280F06',
    bgGradientEnd: '#140703',
    glassRgb: '180, 90, 40',
    glassBorderRgb: '251, 146, 60',
    accentPrimary: '#FB923C',
    accentSecondary: '#F97316',
    accentGradient: ['#FB923C', '#F97316'],
    success: '#A3E635',
    warning: '#FACC15',
    danger: '#EF4444',
    textPrimary: '#FFF5EC',
    textSecondary: '#F5D5B8',
    textMuted: '#C49B7A',
    shimmerPrimary: 'rgba(255, 200, 150, 0.58)',
    shimmerSecondary: 'rgba(255, 230, 200, 0.30)',
    glowPrimary: '#FB923C',
    shadowColor: '#000000',
    auraA: 'rgba(251, 146, 60, 0.26)',
    auraB: 'rgba(249, 115, 22, 0.20)',
    auraC: 'rgba(120, 50, 15, 0.30)',
  },

  'monokai-pro': {
    bgPrimary: '#1E1F1C',
    bgSecondary: '#272822',
    bgTertiary: '#33352E',
    bgGradientStart: '#272822',
    bgGradientEnd: '#15161A',
    glassRgb: '120, 130, 100',
    glassBorderRgb: '166, 226, 46',
    accentPrimary: '#A6E22E',
    accentSecondary: '#F92672',
    accentGradient: ['#A6E22E', '#F92672'],
    success: '#A6E22E',
    warning: '#FD971F',
    danger: '#F92672',
    textPrimary: '#F8F8F2',
    textSecondary: '#CFD0C2',
    textMuted: '#909289',
    shimmerPrimary: 'rgba(220, 240, 180, 0.55)',
    shimmerSecondary: 'rgba(250, 110, 160, 0.28)',
    glowPrimary: '#A6E22E',
    shadowColor: '#000000',
    auraA: 'rgba(166, 226, 46, 0.20)',
    auraB: 'rgba(249, 38, 114, 0.18)',
    auraC: 'rgba(40, 40, 40, 0.40)',
  },

  'graphite': {
    bgPrimary: '#0B0D10',
    bgSecondary: '#15181D',
    bgTertiary: '#1F2329',
    bgGradientStart: '#101317',
    bgGradientEnd: '#06080B',
    glassRgb: '200, 200, 200',
    glassBorderRgb: '255, 255, 255',
    accentPrimary: '#9CA3AF',
    accentSecondary: '#6B7280',
    accentGradient: ['#9CA3AF', '#6B7280'],
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    shimmerPrimary: 'rgba(220, 220, 230, 0.45)',
    shimmerSecondary: 'rgba(180, 190, 210, 0.25)',
    glowPrimary: '#9CA3AF',
    shadowColor: '#000000',
    auraA: 'rgba(156, 163, 175, 0.18)',
    auraB: 'rgba(107, 114, 128, 0.18)',
    auraC: 'rgba(30, 35, 40, 0.40)',
  },

  'high-contrast': {
    bgPrimary: '#000000',
    bgSecondary: '#0A0A0A',
    bgTertiary: '#181818',
    bgGradientStart: '#000000',
    bgGradientEnd: '#000000',
    glassRgb: '255, 255, 255',
    glassBorderRgb: '255, 255, 255',
    accentPrimary: '#FACC15',
    accentSecondary: '#22D3EE',
    accentGradient: ['#FACC15', '#FB923C'],
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    textPrimary: '#FFFFFF',
    textSecondary: '#E5E7EB',
    textMuted: '#9CA3AF',
    shimmerPrimary: 'rgba(250, 204, 21, 0.55)',
    shimmerSecondary: 'rgba(255, 255, 255, 0.35)',
    glowPrimary: '#FACC15',
    shadowColor: '#000000',
    auraA: 'rgba(250, 204, 21, 0.20)',
    auraB: 'rgba(34, 211, 238, 0.18)',
    auraC: 'rgba(0, 0, 0, 0.50)',
  },
};
