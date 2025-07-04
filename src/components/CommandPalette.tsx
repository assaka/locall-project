'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
  InputAdornment,
  alpha,
} from '@mui/material';
import {
  Search,
  Dashboard,
  Phone,
  Assessment,
  Settings,
  Receipt,
  Star,
  Hub,
  Web,
  AdminPanelSettings,
  Person,
  Notifications,
  Help,
  Logout,
  Add,
  Download,
  Upload,
  Refresh,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useSettings } from '../contexts/SettingsContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRealTime } from '../contexts/RealTimeContext';

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'actions' | 'settings' | 'data';
  keywords: string[];
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { settings, updateSetting } = useSettings();
  const { showSuccess, showInfo } = useNotification();
  const { refreshData } = useRealTime();

  const commands: Command[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      description: 'Navigate to the main dashboard',
      icon: <Dashboard />,
      action: () => router.push('/dashboard'),
      category: 'navigation',
      keywords: ['dashboard', 'home', 'main'],
      shortcut: 'Ctrl+D'
    },
    {
      id: 'nav-calls',
      title: 'Go to Calls',
      description: 'View call analytics and history',
      icon: <Phone />,
      action: () => router.push('/dashboard/calls'),
      category: 'navigation',
      keywords: ['calls', 'phone', 'analytics'],
      shortcut: 'Ctrl+C'
    },
    {
      id: 'nav-billing',
      title: 'Go to Billing',
      description: 'View billing information and payments',
      icon: <Receipt />,
      action: () => router.push('/dashboard/billing'),
      category: 'navigation',
      keywords: ['billing', 'payment', 'invoice', 'money'],
    },
    {
      id: 'nav-loyalty',
      title: 'Go to Loyalty',
      description: 'Manage loyalty program and rewards',
      icon: <Star />,
      action: () => router.push('/dashboard/loyalty'),
      category: 'navigation',
      keywords: ['loyalty', 'rewards', 'points'],
    },
    {
      id: 'nav-integrations',
      title: 'Go to Integrations',
      description: 'Manage third-party integrations',
      icon: <Hub />,
      action: () => router.push('/dashboard/integrations'),
      category: 'navigation',
      keywords: ['integrations', 'api', 'connections'],
    },
    {
      id: 'nav-webforms',
      title: 'Go to Web Forms',
      description: 'Create and manage web forms',
      icon: <Web />,
      action: () => router.push('/dashboard/webforms'),
      category: 'navigation',
      keywords: ['forms', 'web', 'leads'],
    },
    {
      id: 'nav-admin',
      title: 'Go to Admin',
      description: 'Access admin panel and settings',
      icon: <AdminPanelSettings />,
      action: () => router.push('/dashboard/admin'),
      category: 'navigation',
      keywords: ['admin', 'management', 'users'],
    },

    // Actions
    {
      id: 'action-refresh',
      title: 'Refresh Data',
      description: 'Refresh all dashboard data',
      icon: <Refresh />,
      action: () => {
        refreshData();
        onClose();
      },
      category: 'actions',
      keywords: ['refresh', 'reload', 'update'],
      shortcut: 'F5'
    },
    {
      id: 'action-add',
      title: 'Create New',
      description: 'Create a new item',
      icon: <Add />,
      action: () => {
        showInfo('Feature coming soon - Create new item');
        onClose();
      },
      category: 'actions',
      keywords: ['create', 'new', 'add'],
      shortcut: 'Ctrl+N'
    },
    {
      id: 'action-export',
      title: 'Export Data',
      description: 'Export current data',
      icon: <Download />,
      action: () => {
        showSuccess('Export started - you will receive an email when ready');
        onClose();
      },
      category: 'actions',
      keywords: ['export', 'download', 'backup'],
    },
    {
      id: 'action-import',
      title: 'Import Data',
      description: 'Import data from file',
      icon: <Upload />,
      action: () => {
        showInfo('Feature coming soon - Import data');
        onClose();
      },
      category: 'actions',
      keywords: ['import', 'upload', 'restore'],
    },

    // Settings
    {
      id: 'setting-theme',
      title: `Switch to ${settings.darkMode ? 'Light' : 'Dark'} Mode`,
      description: 'Toggle between light and dark theme',
      icon: settings.darkMode ? <LightMode /> : <DarkMode />,
      action: () => {
        updateSetting('darkMode', !settings.darkMode);
        showSuccess(`Switched to ${!settings.darkMode ? 'dark' : 'light'} mode`);
        onClose();
      },
      category: 'settings',
      keywords: ['theme', 'dark', 'light', 'mode'],
      shortcut: 'Ctrl+Shift+T'
    },
    {
      id: 'setting-animations',
      title: `${settings.animations ? 'Disable' : 'Enable'} Animations`,
      description: 'Toggle interface animations',
      icon: <Settings />,
      action: () => {
        updateSetting('animations', !settings.animations);
        showSuccess(`Animations ${!settings.animations ? 'enabled' : 'disabled'}`);
        onClose();
      },
      category: 'settings',
      keywords: ['animations', 'motion', 'effects'],
    },
    {
      id: 'setting-notifications',
      title: `${settings.pushNotifications ? 'Disable' : 'Enable'} Notifications`,
      description: 'Toggle push notifications',
      icon: <Notifications />,
      action: () => {
        updateSetting('pushNotifications', !settings.pushNotifications);
        showSuccess(`Push notifications ${!settings.pushNotifications ? 'enabled' : 'disabled'}`);
        onClose();
      },
      category: 'settings',
      keywords: ['notifications', 'alerts', 'push'],
    },

    // Data
    {
      id: 'data-profile',
      title: 'View Profile',
      description: 'View and edit your profile',
      icon: <Person />,
      action: () => {
        showInfo('Feature coming soon - Profile page');
        onClose();
      },
      category: 'data',
      keywords: ['profile', 'account', 'user'],
    },
    {
      id: 'data-help',
      title: 'Help & Support',
      description: 'Get help and support',
      icon: <Help />,
      action: () => {
        showInfo('Feature coming soon - Help center');
        onClose();
      },
      category: 'data',
      keywords: ['help', 'support', 'documentation'],
      shortcut: 'F1'
    },
    {
      id: 'data-logout',
      title: 'Sign Out',
      description: 'Sign out of your account',
      icon: <Logout />,
      action: () => {
        showInfo('Feature coming soon - Sign out');
        onClose();
      },
      category: 'data',
      keywords: ['logout', 'signout', 'exit'],
    },
  ], [router, settings, updateSetting, showSuccess, showInfo, refreshData, onClose]);

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    
    const searchTerm = search.toLowerCase();
    return commands.filter(command => 
      command.title.toLowerCase().includes(searchTerm) ||
      command.description.toLowerCase().includes(searchTerm) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
    );
  }, [commands, search]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, typeof filteredCommands> = {};
    filteredCommands.forEach(command => {
      if (!groups[command.category]) {
        groups[command.category] = [];
      }
      groups[command.category].push(command);
    });
    return groups;
  }, [filteredCommands]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  const categoryLabels = {
    navigation: 'Navigation',
    actions: 'Actions', 
    settings: 'Settings',
    data: 'Data'
  };

  const categoryColors = {
    navigation: 'primary',
    actions: 'success',
    settings: 'warning', 
    data: 'info'
  } as const;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: theme => alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          border: theme => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  border: 'none',
                },
              },
            }}
          />
        </Box>

        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {Object.entries(groupedCommands).map(([category, commands], categoryIndex) => (
            <Box key={category}>
              <Box sx={{ px: 2, py: 1, background: theme => alpha(theme.palette.background.default, 0.5) }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </Typography>
                  <Chip 
                    label={commands.length} 
                    size="small" 
                    color={categoryColors[category as keyof typeof categoryColors]}
                    sx={{ height: 16, fontSize: '0.625rem' }}
                  />
                </Box>
              </Box>
              
              <List dense>
                {commands.map((command, index) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  return (
                    <ListItem key={command.id} disablePadding>
                      <ListItemButton
                        selected={globalIndex === selectedIndex}
                        onClick={command.action}
                        sx={{
                          py: 1.5,
                          '&.Mui-selected': {
                            background: theme => alpha(theme.palette.primary.main, 0.1),
                            borderRight: theme => `3px solid ${theme.palette.primary.main}`,
                          }
                        }}
                      >
                        <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
                          {command.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={command.title}
                          secondary={command.description}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                        {command.shortcut && (
                          <Typography variant="caption" color="text.secondary" sx={{ 
                            px: 1, 
                            py: 0.5, 
                            background: theme => alpha(theme.palette.background.default, 0.8),
                            borderRadius: 1,
                            fontFamily: 'monospace'
                          }}>
                            {command.shortcut}
                          </Typography>
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
              
              {categoryIndex < Object.keys(groupedCommands).length - 1 && <Divider />}
            </Box>
          ))}

          {filteredCommands.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No commands found for "{search}"
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', background: theme => alpha(theme.palette.background.default, 0.3) }}>
          <Typography variant="caption" color="text.secondary" display="flex" gap={2}>
            <span>↑↓ Navigate</span>
            <span>⏎ Select</span>
            <span>Esc Close</span>
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
