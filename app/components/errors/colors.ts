/**
 * Colours for the error components on the website. The site is light only today (no dark theme exists), so this is the
 * light palette of the dashboard's theme, under the same names. The components read `useTheme().colors`, exactly as they
 * do in the dashboard, so the day the site gets a dark theme only this file changes.
 */
export const colors = {
  bgCard: '#FFFFFF',
  bgModal: '#FFFFFF',
  bgOverlay: 'rgba(17, 24, 39, 0.45)',
  textPrimary: '#0F1217',
  textSecondary: '#3A3D44',
  textTertiary: '#6A6D76',
  textInverse: '#FFFFFF',
  textLink: '#083A85',
  borderPrimary: '#D4D6DC',
  brandPrimary: '#083A85',
  statusSuccess: '#10B981',
  statusSuccessBg: '#ECFDF5',
  statusWarning: '#F59E0B',
  statusWarningBg: '#FFFBEB',
  statusError: '#DC2626',
  statusErrorBg: '#FEF2F2',
  statusInfo: '#3B82F6',
  statusInfoBg: '#EFF6FF',
  shadowLg: '0 12px 32px rgba(0, 0, 0, 0.12)',
  shadowXl: '0 20px 60px rgba(0, 0, 0, 0.18)',
};

export function useTheme() {
  return { colors };
}
