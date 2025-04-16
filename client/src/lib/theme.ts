/**
 * Theme constants for the application
 * These values should match those in theme.json and tailwind.config.ts
 */

export const colors = {
  primary: '#3f51b5',
  primaryLight: '#5c6bc0',
  secondary: '#ff9800',
  neutralLight: '#f5f7fa',
  neutralMedium: '#e0e0e0',
  neutralDark: '#424242',
  statusSuccess: '#4caf50',
  statusError: '#f44336',
  statusInfo: '#2196f3',
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

export const fontWeights = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
};

export const transitions = {
  standard: 'all 0.2s ease',
  slow: 'all 0.3s ease',
  fast: 'all 0.1s ease',
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  xxl: '3rem',
};

export const roundedCorners = {
  none: '0',
  sm: '0.125rem',
  md: '0.25rem',
  lg: '0.5rem',
  xl: '1rem',
  full: '9999px',
};
