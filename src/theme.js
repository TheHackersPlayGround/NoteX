// Shared design tokens — Teal/Cyan palette
export const light = {
  accent:        '#0ABFBC',
  accentDark:    '#089A98',
  accentLight:   '#E0F7F7',
  accentGradient:['#0ABFBC', '#00D4AA'],
  danger:        '#FF4D6D',
  dangerLight:   '#FFF0F3',
  success:       '#22C55E',
  bg:            '#F4FAFA',
  card:          '#FFFFFF',
  border:        '#E8F0F0',
  textPrimary:   '#0D2B2A',
  textSecond:    '#4A7070',
  textMuted:     '#B0C4C4',
  inputBg:       '#F0F8F8',
  inputBorder:   '#D0E8E8',
  overlay:       'rgba(10,60,60,0.35)',
};

export const dark = {
  accent:        '#0ABFBC',
  accentDark:    '#089A98',
  accentLight:   '#0A2A2A',
  accentGradient:['#0ABFBC', '#00D4AA'],
  danger:        '#FF4D6D',
  dangerLight:   '#2D1520',
  success:       '#22C55E',
  bg:            '#0A1616',
  card:          '#122020',
  border:        '#1E3333',
  textPrimary:   '#E8F5F5',
  textSecond:    '#7AACAC',
  textMuted:     '#3A5A5A',
  inputBg:       '#162828',
  inputBorder:   '#1E3A3A',
  overlay:       'rgba(0,0,0,0.65)',
};

export const radius = { sm: 12, md: 16, lg: 24, full: 999 };

export const getShadow = (isDark) => ({
  sm: isDark
    ? { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8,  shadowOffset: { width: 0, height: 2 }, elevation: 4 }
    : { shadowColor: '#0ABFBC', shadowOpacity: 0.08, shadowRadius: 8,  shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: isDark
    ? { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 6 }
    : { shadowColor: '#0ABFBC', shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
});
