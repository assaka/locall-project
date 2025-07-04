'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Grow,
  Fade,
  Slide,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
  Skeleton
} from '@mui/material';
import { Grid } from '../../components/FixedGrid';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Hub as IntegrationIcon,
  Web as WebIcon,
  Payment as PaymentIcon,
  CardGiftcard as LoyaltyIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  PhoneInTalk as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  Launch as LaunchIcon,
  Star as StarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import AnalyticsWidget from '../../components/AnalyticsWidget';
import { useRealTime } from '../../contexts/RealTimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useSettings } from '../../contexts/SettingsContext';

// Enhanced interfaces
interface DashboardMetrics {
  totalCalls: number;
  totalUsers: number;
  revenue: number;
  activeCampaigns: number;
  callsToday: number;
  revenueGrowth: number;
  userGrowth: number;
  systemHealth: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href: string;
  badge?: number;
}

interface RecentActivity {
  id: string;
  type: 'call' | 'user' | 'payment' | 'integration';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

// Mock data
const mockMetrics: DashboardMetrics = {
  totalCalls: 24569,
  totalUsers: 1847,
  revenue: 89750,
  activeCampaigns: 12,
  callsToday: 847,
  revenueGrowth: 23.5,
  userGrowth: 18.2,
  systemHealth: 98.7
};

const quickActions: QuickAction[] = [
  {
    id: 'integrations',
    title: 'Integrations Hub',
    description: 'Connect and manage your business tools',
    icon: <IntegrationIcon />,
    color: '#1976d2',
    href: '/dashboard/integrations',
    badge: 3
  },
  {
    id: 'webforms',
    title: 'Webforms Studio',
    description: 'Create and analyze web forms',
    icon: <WebIcon />,
    color: '#2e7d32',
    href: '/dashboard/webforms',
    badge: 5
  },
  {
    id: 'billing',
    title: 'Billing Center',
    description: 'Manage payments and subscriptions',
    icon: <PaymentIcon />,
    color: '#ed6c02',
    href: '/dashboard/billing'
  },
  {
    id: 'loyalty',
    title: 'Loyalty Programs',
    description: 'Reward and retain customers',
    icon: <LoyaltyIcon />,
    color: '#9c27b0',
    href: '/dashboard/loyalty',
    badge: 12
  },
  {
    id: 'admin',
    title: 'System Admin',
    description: 'Monitor and configure platform',
    icon: <SecurityIcon />,
    color: '#d32f2f',
    href: '/dashboard/admin'
  },
  {
    id: 'analytics',
    title: 'Advanced Analytics',
    description: 'Deep insights and reporting',
    icon: <AnalyticsIcon />,
    color: '#7b1fa2',
    href: '/analytics'
  }
];

const recentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'call',
    title: 'Call completed successfully',
    description: 'Customer inquiry handled by AI assistant',
    timestamp: '2 minutes ago',
    status: 'success'
  },
  {
    id: '2',
    type: 'user',
    title: 'New user registration',
    description: 'John Smith joined from organic search',
    timestamp: '8 minutes ago',
    status: 'success'
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment processed',
    description: '$299 subscription renewal completed',
    timestamp: '15 minutes ago',
    status: 'success'
  },
  {
    id: '4',
    type: 'integration',
    title: 'Integration sync warning',
    description: 'HubSpot API rate limit approaching',
    timestamp: '32 minutes ago',
    status: 'warning'
  }
];

const chartColors = ['#1976d2', '#dc004e', '#ed6c02', '#2e7d32', '#9c27b0', '#00695c'];

const weeklyData = [
  { day: 'Mon', calls: 320, revenue: 1200, users: 45 },
  { day: 'Tue', calls: 450, revenue: 1800, users: 67 },
  { day: 'Wed', calls: 280, revenue: 950, users: 38 },
  { day: 'Thu', calls: 580, revenue: 2200, users: 89 },
  { day: 'Fri', calls: 490, revenue: 1650, users: 76 },
  { day: 'Sat', calls: 220, revenue: 800, users: 28 },
  { day: 'Sun', calls: 180, revenue: 650, users: 22 }
];

const performanceData = [
  { name: 'Call Success', value: 94, color: '#2e7d32' },
  { name: 'User Satisfaction', value: 89, color: '#1976d2' },
  { name: 'System Uptime', value: 99, color: '#ed6c02' },
  { name: 'Response Time', value: 87, color: '#9c27b0' }
];

// Enhanced MetricCard component
const MetricCard = ({ title, value, subtitle, icon, color, trend, loading = false }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; direction: 'up' | 'down' };
  loading?: boolean;
}) => (
  <Grow in timeout={800}>
    <Card
      sx={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
        border: `2px solid ${color}30`,
        borderRadius: 3,
        overflow: 'visible',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 20px 40px ${color}20`,
          border: `2px solid ${color}60`,
        },
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${color}, ${color}80)`,
          borderRadius: '12px 12px 0 0',
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={80} height={40} />
            ) : (
              <Typography variant="h3" sx={{ fontWeight: 700, color: color, mb: 0.5 }}>
                {value}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon sx={{ color: trend.direction === 'up' ? '#2e7d32' : '#d32f2f', fontSize: 16 }} />
            <Typography variant="body2" sx={{ color: trend.direction === 'up' ? '#2e7d32' : '#d32f2f' }}>
              {trend.direction === 'up' ? '+' : ''}{trend.value}%
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              vs last week
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  </Grow>
);

// QuickActionCard component
const QuickActionCard = ({ action }: { action: QuickAction }) => (
  <Fade in timeout={600}>
    <Card
      component={Link}
      href={action.href}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '2px solid transparent',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        textDecoration: 'none',
        color: 'inherit',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 24px ${action.color}20`,
          border: `2px solid ${action.color}40`,
        },
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${action.color}, ${action.color}80)`,
        }
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${action.color}20`, color: action.color, width: 48, height: 48 }}>
            {action.icon}
          </Avatar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {action.badge && (
              <Badge badgeContent={action.badge} color="error">
                <NotificationsIcon color="action" />
              </Badge>
            )}
            <ArrowForwardIcon sx={{ color: 'text.secondary' }} />
          </Box>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {action.title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', flexGrow: 1 }}>
          {action.description}
        </Typography>
      </CardContent>
    </Card>
  </Fade>
);

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [welcomeDialog, setWelcomeDialog] = useState(false);
  
  // Use real-time context
  const { data: realTimeData, isConnected, lastUpdated, refreshData } = useRealTime();
  const { showSuccess, showInfo } = useNotification();
  const { settings } = useSettings();

  // Convert real-time data to metrics format
  const metrics: DashboardMetrics = {
    totalCalls: realTimeData.totalCalls,
    totalUsers: realTimeData.activeUsers,
    revenue: realTimeData.totalRevenue,
    activeCampaigns: 12, // Mock data
    callsToday: realTimeData.activeCalls,
    revenueGrowth: realTimeData.conversionRate,
    userGrowth: 18.2, // Mock data  
    systemHealth: realTimeData.uptime
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneIcon />;
      case 'user': return <PeopleIcon />;
      case 'payment': return <PaymentIcon />;
      case 'form': return <WebIcon />;
      case 'system': return <SettingsIcon />;
      default: return <DashboardIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#2e7d32';
      case 'warning': return '#ed6c02';
      case 'error': return '#d32f2f';
      default: return '#757575';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                mb: 1, 
                background: 'linear-gradient(45deg, #1976d2, #9c27b0)', 
                backgroundClip: 'text', 
                WebkitBackgroundClip: 'text', 
                color: 'transparent' 
              }}
            >
              🚀 Welcome to Locall
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 1 }}>
              Your advanced communication and automation platform
              {/* Connection Status */}
              <Chip 
                label={isConnected ? 'Live' : 'Reconnecting...'} 
                size="small"
                color={isConnected ? 'success' : 'warning'}
                sx={{ 
                  ml: 1,
                  '& .MuiChip-label': { fontSize: '0.75rem' }
                }}
              />
            </Typography>
            {lastUpdated && (
              <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5 }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                refreshData();
                showSuccess('Dashboard data refreshed');
              }}
              disabled={!isConnected}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
              onClick={() => showInfo('Settings panel coming soon')}
              sx={{
                background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0, #7b1fa2)',
                }
              }}
            >
              Settings
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Calls"
            value={metrics.totalCalls.toLocaleString()}
            subtitle="All time"
            icon={<PhoneIcon />}
            color="#1976d2"
            trend={{ value: metrics.revenueGrowth, direction: 'up' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Users"
            value={metrics.totalUsers.toLocaleString()}
            subtitle={`${metrics.callsToday} calls today`}
            icon={<PeopleIcon />}
            color="#2e7d32"
            trend={{ value: metrics.userGrowth, direction: 'up' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Revenue"
            value={`$${metrics.revenue.toLocaleString()}`}
            subtitle="This month"
            icon={<PaymentIcon />}
            color="#ed6c02"
            trend={{ value: metrics.revenueGrowth, direction: 'up' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="System Health"
            value={`${metrics.systemHealth}%`}
            subtitle="All systems operational"
            icon={<SpeedIcon />}
            color="#9c27b0"
            trend={{ value: 0.3, direction: 'up' }}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            🎯 Quick Actions
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((action) => (
              <Grid item xs={12} sm={6} md={4} key={action.id}>
                <QuickActionCard action={action} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Analytics and Activity */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Advanced Analytics Widget */}
        <Grid item xs={12} lg={8}>
          <AnalyticsWidget 
            title="📈 Real-Time Analytics"
            subtitle="Live performance metrics and trends"
            height={350}
            showControls={true}
          />
        </Grid>

        {/* System Performance */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                ⚡ System Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {performanceData.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, bgcolor: item.color, borderRadius: '50%' }} />
                      <Typography variant="body2">{item.name}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}%</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              🔔 Recent Activity
            </Typography>
            <Button variant="outlined" size="small">
              View All
            </Button>
          </Box>
          <List>
            {realTimeData.recentActivities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem>
                  <ListItemIcon>
                    <Avatar 
                      sx={{ 
                        bgcolor: `${getStatusColor(activity.severity)}20`, 
                        color: getStatusColor(activity.severity),
                        width: 40,
                        height: 40
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {activity.message}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        {activity.user && (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            User: {activity.user}
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {activity.timestamp.toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      size="small"
                      label={activity.severity}
                      sx={{
                        bgcolor: `${getStatusColor(activity.severity)}20`,
                        color: getStatusColor(activity.severity),
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                {index < realTimeData.recentActivities.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Welcome Dialog */}
      <Dialog
        open={welcomeDialog}
        onClose={() => setWelcomeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            🎉 Welcome to Locall!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your advanced communication platform is ready to go! 
            Explore our powerful features and start transforming your business today.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              onClick={() => setWelcomeDialog(false)}
            >
              Take Tour
            </Button>
            <Button
              variant="contained"
              startIcon={<LaunchIcon />}
              onClick={() => setWelcomeDialog(false)}
              sx={{
                background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0, #7b1fa2)',
                }
              }}
            >
              Get Started
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
