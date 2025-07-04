// theme/advanced-theme.ts
'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';
import { alpha, darken, lighten } from '@mui/material/styles';

// Advanced Color Palette
const primaryColor = '#6366f1'; // Indigo
const secondaryColor = '#ec4899'; // Pink
const successColor = '#10b981'; // Emerald
const warningColor = '#f59e0b'; // Amber
const errorColor = '#ef4444'; // Red
const infoColor = '#3b82f6'; // Blue

// Custom gradient definitions
const gradients = {
  primary: `linear-gradient(135deg, ${primaryColor} 0%, ${alpha(primaryColor, 0.8)} 100%)`,
  secondary: `linear-gradient(135deg, ${secondaryColor} 0%, ${alpha(secondaryColor, 0.8)} 100%)`,
  success: `linear-gradient(135deg, ${successColor} 0%, ${alpha(successColor, 0.8)} 100%)`,
  info: `linear-gradient(135deg, ${infoColor} 0%, ${alpha(infoColor, 0.8)} 100%)`,
  warning: `linear-gradient(135deg, ${warningColor} 0%, ${alpha(warningColor, 0.8)} 100%)`,
  error: `linear-gradient(135deg, ${errorColor} 0%, ${alpha(errorColor, 0.8)} 100%)`,
  glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
  dark: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  rainbow: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
};

// Advanced shadow system
const shadows = {
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  glow: '0 0 20px rgba(99, 102, 241, 0.3)',
  soft: '0 2px 8px rgba(0, 0, 0, 0.1)',
  medium: '0 4px 16px rgba(0, 0, 0, 0.15)',
  strong: '0 8px 32px rgba(0, 0, 0, 0.2)',
  colored: {
    primary: `0 4px 20px ${alpha(primaryColor, 0.3)}`,
    secondary: `0 4px 20px ${alpha(secondaryColor, 0.3)}`,
    success: `0 4px 20px ${alpha(successColor, 0.3)}`,
    error: `0 4px 20px ${alpha(errorColor, 0.3)}`,
  }
};

const baseTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: primaryColor,
      light: lighten(primaryColor, 0.2),
      dark: darken(primaryColor, 0.2),
      contrastText: '#ffffff',
    },
    secondary: {
      main: secondaryColor,
      light: lighten(secondaryColor, 0.2),
      dark: darken(secondaryColor, 0.2),
      contrastText: '#ffffff',
    },
    success: {
      main: successColor,
      light: lighten(successColor, 0.2),
      dark: darken(successColor, 0.2),
      contrastText: '#ffffff',
    },
    warning: {
      main: warningColor,
      light: lighten(warningColor, 0.2),
      dark: darken(warningColor, 0.2),
      contrastText: '#ffffff',
    },
    error: {
      main: errorColor,
      light: lighten(errorColor, 0.2),
      dark: darken(errorColor, 0.2),
      contrastText: '#ffffff',
    },
    info: {
      main: infoColor,
      light: lighten(infoColor, 0.2),
      dark: darken(infoColor, 0.2),
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: '2.25rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          height: '100%',
          width: '100%',
        },
        body: {
          height: '100%',
          width: '100%',
          margin: 0,
          padding: 0,
        },
        '#root': {
          height: '100%',
          width: '100%',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          fontSize: '0.95rem',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: shadows.medium,
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          background: gradients.primary,
          '&:hover': {
            background: gradients.primary,
            boxShadow: shadows.colored.primary,
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            transform: 'translateY(-2px)',
            boxShadow: shadows.soft,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: shadows.soft,
          border: `1px solid ${alpha('#000', 0.08)}`,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: shadows.medium,
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: shadows.soft,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 'auto',
          padding: '6px 12px',
        },
        colorSuccess: {
          background: gradients.success,
          color: '#ffffff',
        },
        colorError: {
          background: gradients.error,
          color: '#ffffff',
        },
        colorWarning: {
          background: gradients.warning,
          color: '#ffffff',
        },
        colorInfo: {
          background: gradients.info,
          color: '#ffffff',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: shadows.soft,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: shadows.soft,
            },
            '&.Mui-focused': {
              boxShadow: shadows.colored.primary,
            },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 8,
        },
        bar: {
          borderRadius: 8,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            minHeight: 48,
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: alpha(primaryColor, 0.05),
            fontWeight: 700,
            fontSize: '0.875rem',
            color: primaryColor,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: alpha(primaryColor, 0.02),
            transform: 'scale(1.005)',
            transition: 'all 0.2s ease-in-out',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: shadows.soft,
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: shadows.medium,
          '&:hover': {
            boxShadow: shadows.strong,
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiSpeedDial: {
      styleOverrides: {
        fab: {
          background: gradients.primary,
          '&:hover': {
            background: gradients.primary,
            boxShadow: shadows.colored.primary,
          },
        },
      },
    },
  },
};

// Advanced theme with custom properties
export const advancedTheme = createTheme({
  ...baseTheme,
  customGradients: gradients,
  customShadows: shadows,
} as any);

// Dark theme variant
export const advancedDarkTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'dark',
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
    },
  },
  components: {
    ...baseTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: alpha('#ffffff', 0.05),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha('#ffffff', 0.1)}`,
          boxShadow: shadows.glass,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            background: alpha('#ffffff', 0.08),
            transform: 'translateY(-4px)',
            boxShadow: shadows.glow,
          },
        },
      },
    },
  },
  customGradients: gradients,
  customShadows: shadows,
} as any);

export default advancedTheme;
