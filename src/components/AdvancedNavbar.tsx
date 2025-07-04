'use client';

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Box,
  Button,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Fade,
  Paper,
  List,
  ListItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Help as HelpIcon,
  Security as SecurityIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Language as LanguageIcon
} from '@mui/icons-material';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'System Update',
    message: 'New features available in the integrations hub',
    type: 'info',
    timestamp: '5 minutes ago',
    read: false
  },
  {
    id: '2',
    title: 'Payment Processed',
    message: 'Monthly subscription renewed successfully',
    type: 'success',
    timestamp: '1 hour ago',
    read: false
  },
  {
    id: '3',
    title: 'API Rate Limit',
    message: 'HubSpot integration approaching rate limit',
    type: 'warning',
    timestamp: '2 hours ago',
    read: true
  }
];

export default function AdvancedNavbar() {
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorElNotifications(null);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#2e7d32';
      case 'warning': return '#ed6c02';
      case 'error': return '#d32f2f';
      default: return '#1976d2';
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
        boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1, sm: 3 } }}>
        {/* Logo and Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(45deg, #ffffff20, #ffffff40)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
              L
            </Typography>
          </Box>
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: 'white',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Locall Platform
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                display: { xs: 'none', md: 'block' }
              }}
            >
              Advanced Communication Hub
            </Typography>
          </Box>
        </Box>

        {/* Center Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.9)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Analytics
          </Button>
          <Button
            color="inherit"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.9)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Settings
          </Button>
        </Box>

        {/* Right Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Search */}
          <Tooltip title="Search">
            <IconButton
              color="inherit"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={handleOpenNotifications}
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Tooltip title="Account">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 1 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(45deg, #ffffff20, #ffffff40)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    border: '2px solid rgba(255, 255, 255, 0.6)'
                  }
                }}
              >
                <AccountIcon sx={{ color: 'white' }} />
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Notifications Menu */}
        <Menu
          anchorEl={anchorElNotifications}
          open={Boolean(anchorElNotifications)}
          onClose={handleCloseNotifications}
          TransitionComponent={Fade}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 360,
              maxWidth: 400,
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={`${unreadCount} new`}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
                <Button size="small" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              </Box>
            </Box>
          </Box>
          <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                  background: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.05)',
                  '&:hover': {
                    background: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {notification.timestamp}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {notification.message}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
          <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
            <Button variant="outlined" size="small" fullWidth>
              View All Notifications
            </Button>
          </Box>
        </Menu>

        {/* User Menu */}
        <Menu
          anchorEl={anchorElUser}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
          TransitionComponent={Fade}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 280,
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          {/* User Info */}
          <Box sx={{ p: 3, background: 'linear-gradient(135deg, #1976d2, #9c27b0)', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <AccountIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  John Doe
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  john.doe@company.com
                </Typography>
              </Box>
            </Box>
          </Box>

          <List sx={{ p: 1 }}>
            <MenuItem onClick={handleCloseUserMenu}>
              <ListItemIcon>
                <AccountIcon />
              </ListItemIcon>
              <ListItemText primary="Profile Settings" />
            </MenuItem>
            <MenuItem onClick={handleCloseUserMenu}>
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText primary="Security" />
            </MenuItem>
            <MenuItem onClick={handleCloseUserMenu}>
              <ListItemIcon>
                <LanguageIcon />
              </ListItemIcon>
              <ListItemText primary="Language" />
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem>
              <ListItemIcon>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </ListItemIcon>
              <FormControlLabel
                control={
                  <Switch
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    size="small"
                  />
                }
                label="Dark Mode"
                sx={{ ml: 0, mr: 0 }}
              />
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={handleCloseUserMenu}>
              <ListItemIcon>
                <HelpIcon />
              </ListItemIcon>
              <ListItemText primary="Help & Support" />
            </MenuItem>
            <MenuItem onClick={handleCloseUserMenu}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Sign Out" />
            </MenuItem>
          </List>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
