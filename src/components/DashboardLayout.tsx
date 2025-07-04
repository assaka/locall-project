'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  CssBaseline,
  Fab,
  Zoom,
  useMediaQuery,
  useTheme,
  Backdrop,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Feedback as FeedbackIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Chat as ChatIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import AdvancedNavbar from './AdvancedNavbar';
import AdvancedSidebar from './AdvancedSidebar';
import CommandPalette from './CommandPalette';
import { useNotification } from '../contexts/NotificationContext';
import HelpSystem from './HelpSystem';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showSuccess, showInfo } = useNotification();

  const speedDialActions = [
    { 
      icon: <SearchIcon />, 
      name: 'Command Palette', 
      action: () => setCommandPaletteOpen(true) 
    },
    { 
      icon: <SettingsIcon />, 
      name: 'Settings', 
      action: () => showInfo('Settings panel coming soon') 
    },
    { 
      icon: <HelpIcon />, 
      name: 'Help & Support', 
      action: () => showInfo('Help center coming soon') 
    },
    { 
      icon: <FeedbackIcon />, 
      name: 'Send Feedback', 
      action: () => showSuccess('Feedback form coming soon') 
    },
    { 
      icon: <ChatIcon />, 
      name: 'Live Chat', 
      action: () => showInfo('Live chat coming soon') 
    }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command palette shortcut (Ctrl+K or Cmd+K)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
      
      // Sidebar toggle (Ctrl+B or Cmd+B)
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      
      // Escape to close command palette
      if (event.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSpeedDialAction = (action: () => void) => {
    action();
    setSpeedDialOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Navigation Bar */}
      <AdvancedNavbar />
      
      {/* Sidebar */}
      <AdvancedSidebar
        open={sidebarOpen}
        onClose={handleSidebarToggle}
        variant={isMobile ? 'temporary' : 'persistent'}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: isMobile ? 0 : sidebarOpen ? 0 : '-280px',
          marginTop: '64px', // AppBar height
          minHeight: 'calc(100vh - 64px)',
          background: 'linear-gradient(180deg, #fafafa 0%, #f0f2f5 100%)',
          position: 'relative'
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 50%, rgba(25, 118, 210, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(156, 39, 176, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(46, 125, 50, 0.1) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        {/* Content */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {children}
        </Box>

        {/* Command Palette */}
        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />

        {/* Floating Action Buttons */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1200
          }}
        >
          {/* Speed Dial */}
          <SpeedDial
            ariaLabel="Quick Actions"
            sx={{ mb: 2 }}
            icon={<SpeedDialIcon />}
            open={speedDialOpen}
            onOpen={() => setSpeedDialOpen(true)}
            onClose={() => setSpeedDialOpen(false)}
            FabProps={{
              sx: {
                background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0, #7b1fa2)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.3s ease'
              }
            }}
          >
            {speedDialActions.map((action) => (
              <SpeedDialAction
                key={action.name}
                icon={action.icon}
                tooltipTitle={action.name}
                onClick={() => handleSpeedDialAction(action.action)}
                FabProps={{
                  sx: {
                    '&:hover': {
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.3s ease'
                  }
                }}
              />
            ))}
          </SpeedDial>

          {/* Scroll to Top */}
          <Zoom in={showScrollTop}>
            <Fab
              color="primary"
              size="medium"
              onClick={scrollToTop}
              sx={{
                background: 'rgba(25, 118, 210, 0.9)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  background: 'rgba(25, 118, 210, 1)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <KeyboardArrowUpIcon />
            </Fab>
          </Zoom>
        </Box>

        {/* Mobile Backdrop */}
        {isMobile && (
          <Backdrop
            sx={{ 
              zIndex: theme.zIndex.drawer - 1,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)'
            }}
            open={sidebarOpen}
            onClick={handleSidebarToggle}
          />
        )}

        {/* Help System */}
        <HelpSystem />
      </Box>
    </Box>
  );
}
