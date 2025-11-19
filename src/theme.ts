import { Platform, TextStyle } from 'react-native';

export const colors = {
  primary: '#FFDB58',
  primaryHover: '#efcd4a',
  background: '#FCFCFC',
  surface: '#FFFFFF',
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  border: '#000000',
  borderLight: '#e2e8f0',
  error: '#ef4444',
  success: '#22c55e',
} as const;

export const fonts = {
  serif: Platform.select({ ios: 'PlayfairDisplay_900Black', android: 'PlayfairDisplay_900Black', default: 'serif' }),
  mono: Platform.select({ ios: 'JetBrainsMono_700Bold', android: 'JetBrainsMono_700Bold', default: 'monospace' }),
  monoMedium: Platform.select({ ios: 'JetBrainsMono_500Medium', android: 'JetBrainsMono_500Medium', default: 'monospace' }),
  body: Platform.select({ ios: 'Inter_400Regular', android: 'Inter_400Regular', default: 'System' }),
  bodyMedium: Platform.select({ ios: 'Inter_500Medium', android: 'Inter_500Medium', default: 'System' }),
  bodySemiBold: Platform.select({ ios: 'Inter_600SemiBold', android: 'Inter_600SemiBold', default: 'System' }),
  bodyBold: Platform.select({ ios: 'Inter_700Bold', android: 'Inter_700Bold', default: 'System' }),
} as const;

export const border = {
  width: 1.5,
  color: '#000000',
} as const;

// common text style presets
export const textStyles = {
  heroTitle: {
    fontFamily: fonts.serif,
    fontSize: 64,
    color: colors.text,
  } as TextStyle,
  screenTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 28,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  } as TextStyle,
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    color: colors.text,
  } as TextStyle,
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 2,
  } as TextStyle,
  monoLarge: {
    fontFamily: fonts.mono,
    fontSize: 48,
    color: colors.text,
  } as TextStyle,
  monoValue: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.text,
  } as TextStyle,
  monoSmall: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  } as TextStyle,
  bodyMedium: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  } as TextStyle,
  bodySemiBold: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.text,
  } as TextStyle,
};
