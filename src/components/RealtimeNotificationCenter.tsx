/**
 * Enhanced Real-time Notification Component
 * Displays real-time notifications with WebSocket support
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Avatar,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Paper,
  styled,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  Phone as PhoneIcon,
  Description as FormIcon,
  Warning as AlertIcon,
  Payment as BillingIcon,
  Extension as IntegrationIcon,
  Person as UserIcon,
  MarkEmailRead as MarkReadIcon,
  DoneAll as MarkAllReadIcon,
} from '@mui/icons-material';
import { 
  useRealtimeNotifications, 
  RealtimeNotification,
  realtimeNotificationService 
} from '../lib/realtime-notifications';
import { useNotification } from '../contexts/NotificationContext';

// Helper function to format relative time
function formatTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now.getTime() - past.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return past.toLocaleDateString();
}

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    width: 400,
    maxHeight: 600,
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    border: `1px solid ${theme.palette.divider}`,
  },
}));

const NotificationItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: 8,
  margin: theme.spacing(0.5, 1),
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.unread': {
    backgroundColor: theme.palette.action.selected,
    borderLeft: `4px solid ${theme.palette.primary.main}`,
  },
}));

interface RealtimeNotificationCenterProps {
  workspaceId: string;
  userId?: string;
  maxNotifications?: number;
}

export function RealtimeNotificationCenter({
  workspaceId,
  userId,
  maxNotifications = 20,
}: RealtimeNotificationCenterProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const { showInfo, showSuccess } = useNotification();
  
  const {
    notifications,
    isConnected,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useRealtimeNotifications(workspaceId, {
    userId,
    onNotification: (notification) => {
      // Show browser notification for high priority alerts
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
          });
        }
      }
      
      // Show in-app notification
      showInfo(`${notification.title}: ${notification.message}`);
    },
  });

  useEffect(() => {
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setFilter(null);
  };

  const handleNotificationClick = async (notification: RealtimeNotification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Handle notification actions
    if (notification.actions && notification.actions.length > 0) {
      const primaryAction = notification.actions[0];
      if (primaryAction.type === 'link') {
        window.location.href = primaryAction.action;
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    showSuccess('All notifications marked as read');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'call_status':
        return <PhoneIcon color="primary" />;
      case 'form_submission':
        return <FormIcon color="secondary" />;
      case 'system_alert':
        return <AlertIcon color="error" />;
      case 'billing':
        return <BillingIcon color="warning" />;
      case 'integration':
        return <IntegrationIcon color="info" />;
      case 'user_activity':
        return <UserIcon color="action" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
        return 'primary';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const filteredNotifications = filter
    ? notifications.filter(n => n.type === filter)
    : notifications.slice(0, maxNotifications);

  const notificationTypes = [
    { type: 'call_status', label: 'Calls', icon: <PhoneIcon /> },
    { type: 'form_submission', label: 'Forms', icon: <FormIcon /> },
    { type: 'system_alert', label: 'Alerts', icon: <AlertIcon /> },
    { type: 'billing', label: 'Billing', icon: <BillingIcon /> },
  ];

  return (
    <>
      <Tooltip title={isConnected ? 'Notifications (Live)' : 'Notifications (Offline)'}>
        <IconButton
          onClick={handleClick}
          color="inherit"
          sx={{
            position: 'relative',
            '&::after': isConnected ? {
              content: '""',
              position: 'absolute',
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'success.main',
              border: '2px solid white',
            } : {},
          }}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <StyledMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" component="div">
              Notifications
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={isConnected ? 'Live' : 'Offline'}
                size="small"
                color={isConnected ? 'success' : 'default'}
                variant="outlined"
              />
              {unreadCount > 0 && (
                <Button
                  size="small"
                  startIcon={<MarkAllReadIcon />}
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </Button>
              )}
            </Box>
          </Box>

          {/* Filter buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="All"
              size="small"
              variant={filter === null ? 'filled' : 'outlined'}
              onClick={() => setFilter(null)}
            />
            {notificationTypes.map(({ type, label, icon }) => {
              const count = notifications.filter(n => n.type === type).length;
              if (count === 0) return null;
              
              return (
                <Chip
                  key={type}
                  label={`${label} (${count})`}
                  size="small"
                  variant={filter === type ? 'filled' : 'outlined'}
                  onClick={() => setFilter(filter === type ? null : type)}
                />
              );
            })}
          </Box>
        </Box>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {filter ? `No ${filter.replace('_', ' ')} notifications` : 'No notifications'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <NotificationItem
                  className={!notification.read ? 'unread' : ''}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'transparent' }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" component="span">
                          {notification.title}
                        </Typography>
                        <Chip
                          label={notification.priority}
                          size="small"
                          color={getPriorityColor(notification.priority) as any}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimeAgo(notification.created_at)}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      {!notification.read && (
                        <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                      )}
                      {notification.actions && notification.actions.length > 0 && (
                        <Typography variant="caption" color="primary">
                          View
                        </Typography>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </NotificationItem>
                
                {index < filteredNotifications.length - 1 && <Divider variant="inset" />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Footer */}
        {notifications.length > maxNotifications && !filter && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
            <Button size="small" onClick={() => window.location.href = '/dashboard/notifications'}>
              View All Notifications
            </Button>
          </Box>
        )}
      </StyledMenu>
    </>
  );
}

export default RealtimeNotificationCenter;
