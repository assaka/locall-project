'use client';

import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Collapse,
  Badge,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ExpandLess,
  ExpandMore,
  Hub as IntegrationIcon,
  Web as WebIcon,
  Payment as PaymentIcon,
  CardGiftcard as LoyaltyIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  href?: string;
  badge?: number | string;
  children?: NavigationItem[];
  color?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
    href: '/dashboard',
    color: '#1976d2'
  },
  {
    id: 'communications',
    title: 'Communications',
    icon: <PhoneIcon />,
    color: '#2e7d32',
    children: [
      {
        id: 'calls',
        title: 'Call Center',
        icon: <PhoneIcon />,
        href: '/call',
        badge: 'Live'
      },
      {
        id: 'sms',
        title: 'SMS Campaign',
        icon: <EmailIcon />,
        href: '/sms'
      },
      {
        id: 'scheduling',
        title: 'Scheduling',
        icon: <CalendarIcon />,
        href: '/booking'
      }
    ]
  },
  {
    id: 'management',
    title: 'Management',
    icon: <SettingsIcon />,
    color: '#ed6c02',
    children: [
      {
        id: 'integrations',
        title: 'Integrations',
        icon: <IntegrationIcon />,
        href: '/dashboard/integrations',
        badge: 3
      },
      {
        id: 'webforms',
        title: 'Webforms',
        icon: <WebIcon />,
        href: '/dashboard/webforms',
        badge: 5
      },
      {
        id: 'white-label',
        title: 'White-Label',
        icon: <BusinessIcon />,
        href: '/dashboard/white-label'
      },
      {
        id: 'users',
        title: 'User Management',
        icon: <PeopleIcon />,
        href: '/users'
      }
    ]
  },
  {
    id: 'business',
    title: 'Business',
    icon: <TrendingUpIcon />,
    color: '#9c27b0',
    children: [
      {
        id: 'billing',
        title: 'Billing Center',
        icon: <PaymentIcon />,
        href: '/dashboard/billing'
      },
      {
        id: 'loyalty',
        title: 'Loyalty Programs',
        icon: <LoyaltyIcon />,
        href: '/dashboard/loyalty',
        badge: 12
      },
      {
        id: 'analytics',
        title: 'Analytics',
        icon: <AnalyticsIcon />,
        href: '/analytics'
      }
    ]
  },
  {
    id: 'system',
    title: 'System',
    icon: <SecurityIcon />,
    color: '#d32f2f',
    children: [
      {
        id: 'admin',
        title: 'Admin Panel',
        icon: <SecurityIcon />,
        href: '/dashboard/admin'
      },
      {
        id: 'performance',
        title: 'Performance',
        icon: <SpeedIcon />,
        href: '/performance'
      },
      {
        id: 'logs',
        title: 'System Logs',
        icon: <TimelineIcon />,
        href: '/logs'
      }
    ]
  }
];

interface AdvancedSidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
}

export default function AdvancedSidebar({ 
  open, 
  onClose, 
  variant = 'persistent' 
}: AdvancedSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['management']);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const handleExpandClick = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const drawerWidth = collapsed ? 70 : 280;

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.href);

    if (hasChildren) {
      return (
        <React.Fragment key={item.id}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleExpandClick(item.id)}
              sx={{
                pl: depth * 2 + 2,
                pr: 2,
                py: 1.5,
                minHeight: 48,
                borderRadius: collapsed ? 0 : 2,
                mx: collapsed ? 0 : 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: `${item.color || '#1976d2'}15`,
                  transform: collapsed ? 'none' : 'translateX(4px)'
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 'unset' : 40,
                  color: item.color || '#1976d2',
                  mr: collapsed ? 0 : 1
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <>
                  <ListItemText
                    primary={item.title}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: 'text.primary'
                      }
                    }}
                  />
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </ListItem>
          {!collapsed && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List disablePadding>
                {item.children?.map(child => renderNavigationItem(child, depth + 1))}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      );
    }

    return (
      <ListItem key={item.id} disablePadding>
        <ListItemButton
          component={Link}
          href={item.href || '#'}
          sx={{
            pl: depth * 2 + 2,
            pr: 2,
            py: 1.5,
            minHeight: 48,
            borderRadius: collapsed ? 0 : 2,
            mx: collapsed ? 0 : 1,
            transition: 'all 0.3s ease',
            background: active ? `${item.color || '#1976d2'}20` : 'transparent',
            borderLeft: active && !collapsed ? `4px solid ${item.color || '#1976d2'}` : 'none',
            '&:hover': {
              background: `${item.color || '#1976d2'}15`,
              transform: collapsed ? 'none' : 'translateX(4px)'
            }
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: collapsed ? 'unset' : 40,
              color: active ? item.color || '#1976d2' : 'text.secondary',
              mr: collapsed ? 0 : 1
            }}
          >
            {item.icon}
          </ListItemIcon>
          {!collapsed && (
            <>
              <ListItemText
                primary={item.title}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.9rem',
                    color: active ? item.color || '#1976d2' : 'text.primary'
                  }
                }}
              />
              {item.badge && (
                <Badge
                  badgeContent={item.badge}
                  color={typeof item.badge === 'string' ? 'success' : 'error'}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }
                  }}
                />
              )}
            </>
          )}
        </ListItemButton>
      </ListItem>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)',
        borderRight: '1px solid rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: collapsed ? 1 : 3,
          background: 'linear-gradient(135deg, #1976d2, #9c27b0)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 70
        }}
      >
        {!collapsed && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Locall
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Advanced Platform
            </Typography>
          </Box>
        )}
        <Tooltip title={collapsed ? 'Expand' : 'Collapse'}>
          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            sx={{
              color: 'white',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Status Card */}
      {!collapsed && (
        <Paper
          sx={{
            m: 2,
            p: 2,
            background: 'linear-gradient(135deg, #2e7d32, #4caf50)',
            color: 'white',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
              <SpeedIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                System Status
              </Typography>
              <Typography variant="caption">
                All systems operational
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Navigation */}
      <List sx={{ px: 1, py: 2 }}>
        {navigationItems.map(item => renderNavigationItem(item))}
      </List>

      {/* Footer */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: collapsed ? 1 : 2,
          background: 'rgba(0, 0, 0, 0.05)',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)'
        }}
      >
        {!collapsed ? (
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Need help?
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip
                size="small"
                label="Support"
                clickable
                sx={{ fontSize: '0.7rem' }}
              />
              <Chip
                size="small"
                label="Docs"
                clickable
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Tooltip title="Help">
              <IconButton size="small">
                <HelpIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: 'width 0.3s ease',
          overflowX: 'hidden'
        }
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
