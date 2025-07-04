'use client';

import "./globals.css";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { advancedTheme } from '../theme/advanced-theme';
import { NotificationProvider } from '../contexts/NotificationContext';
import { RealTimeProvider } from '../contexts/RealTimeContext';
import { SettingsProvider } from '../contexts/SettingsContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SettingsProvider>
          <ThemeProvider theme={advancedTheme}>
            <CssBaseline />
            <NotificationProvider>
              <RealTimeProvider>
                {children}
              </RealTimeProvider>
            </NotificationProvider>
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
