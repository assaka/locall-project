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
  Skeleton,
  Alert
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
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Link from 'next/link';

// Types
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
    id: 'analytics',
    title: 'Advanced Analytics',
    description: 'Deep insights and reporting',
    icon: <AnalyticsIcon />,
    color: '#7b1fa2',
    href: '/analytics'
  }
];

const chartColors = ['#1976d2', '#dc004e', '#ed6c02', '#2e7d32', '#9c27b0', '#00695c'];

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
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCalls: 0,
    totalUsers: 0,
    revenue: 0,
    activeCampaigns: 0,
    callsToday: 0,
    revenueGrowth: 0,
    userGrowth: 0,
    systemHealth: 0
  });
  const [welcomeDialog, setWelcomeDialog] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const workspaceId = 'default-workspace'; // TODO: Get from auth context

      // Fetch main dashboard data
      const response = await fetch(`/api/dashboard?workspaceId=${workspaceId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        // Transform API data to match component expectations
        const apiMetrics = data.data.metrics;
        setMetrics({
          totalCalls: apiMetrics.totalCalls || 0,
          totalUsers: apiMetrics.activeUsers || 0,
          revenue: apiMetrics.revenue || 0,
          activeCampaigns: apiMetrics.topPerformingCampaigns?.length || 0,
          callsToday: apiMetrics.totalCalls || 0, // Using total calls for now
          revenueGrowth: 15.8, // Mock growth rate for now
          userGrowth: 12.3, // Mock growth rate for now
          systemHealth: 98.5 // Mock health score for now
        });
        setSystemHealth(data.data.health);
        setRecentActivity(data.data.activity);

        // Create sample weekly data from metrics
        const sampleWeeklyData = [
          { day: 'Mon', calls: Math.floor(data.data.metrics.callsToday * 0.8), revenue: Math.floor(data.data.metrics.revenue * 0.1), users: Math.floor(data.data.metrics.totalUsers * 0.05) },
          { day: 'Tue', calls: Math.floor(data.data.metrics.callsToday * 1.2), revenue: Math.floor(data.data.metrics.revenue * 0.15), users: Math.floor(data.data.metrics.totalUsers * 0.07) },
          { day: 'Wed', calls: Math.floor(data.data.metrics.callsToday * 0.9), revenue: Math.floor(data.data.metrics.revenue * 0.12), users: Math.floor(data.data.metrics.totalUsers * 0.04) },
          { day: 'Thu', calls: Math.floor(data.data.metrics.callsToday * 1.5), revenue: Math.floor(data.data.metrics.revenue * 0.18), users: Math.floor(data.data.metrics.totalUsers * 0.09) },
          { day: 'Fri', calls: Math.floor(data.data.metrics.callsToday * 1.3), revenue: Math.floor(data.data.metrics.revenue * 0.16), users: Math.floor(data.data.metrics.totalUsers * 0.08) },
          { day: 'Sat', calls: Math.floor(data.data.metrics.callsToday * 0.6), revenue: Math.floor(data.data.metrics.revenue * 0.08), users: Math.floor(data.data.metrics.totalUsers * 0.03) },
          { day: 'Sun', calls: Math.floor(data.data.metrics.callsToday * 0.5), revenue: Math.floor(data.data.metrics.revenue * 0.06), users: Math.floor(data.data.metrics.totalUsers * 0.02) }
        ];
        setWeeklyData(sampleWeeklyData);

        // Create performance data from system health
        const samplePerformanceData = [
          { name: 'Call Success', value: Math.floor(data.data.health.uptime || 94), color: '#2e7d32' },
          { name: 'User Satisfaction', value: Math.floor((100 - (data.data.health.error_rate || 1) * 10)), color: '#1976d2' },
          { name: 'System Uptime', value: Math.floor(data.data.health.uptime || 99), color: '#ed6c02' },
          { name: 'Response Time', value: Math.max(70, Math.floor(100 - (data.data.health.response_time || 200) / 10)), color: '#9c27b0' }
        ];
        setPerformanceData(samplePerformanceData);
      } else {
        throw new Error(data.error || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
      
      // Set fallback data to prevent UI crashes
      setWeeklyData([
        { day: 'Mon', calls: 0, revenue: 0, users: 0 },
        { day: 'Tue', calls: 0, revenue: 0, users: 0 },
        { day: 'Wed', calls: 0, revenue: 0, users: 0 },
        { day: 'Thu', calls: 0, revenue: 0, users: 0 },
        { day: 'Fri', calls: 0, revenue: 0, users: 0 },
        { day: 'Sat', calls: 0, revenue: 0, users: 0 },
        { day: 'Sun', calls: 0, revenue: 0, users: 0 }
      ]);
      setPerformanceData([
        { name: 'Call Success', value: 0, color: '#2e7d32' },
        { name: 'User Satisfaction', value: 0, color: '#1976d2' },
        { name: 'System Uptime', value: 0, color: '#ed6c02' },
        { name: 'Response Time', value: 0, color: '#9c27b0' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneIcon />;
      case 'user': return <PeopleIcon />;
      case 'payment': return <PaymentIcon />;
      case 'integration': return <IntegrationIcon />;
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
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>
              Your advanced communication and automation platform
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchDashboardData}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
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

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button onClick={fetchDashboardData} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Calls"
            value={(metrics?.totalCalls || 0).toLocaleString()}
            subtitle="All time"
            icon={<PhoneIcon />}
            color="#1976d2"
            trend={{ value: metrics?.revenueGrowth || 0, direction: 'up' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Users"
            value={(metrics?.totalUsers || 0).toLocaleString()}
            subtitle="Active accounts"
            icon={<PeopleIcon />}
            color="#2e7d32"
            trend={{ value: metrics?.userGrowth || 0, direction: 'up' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Revenue"
            value={`$${(metrics?.revenue || 0).toLocaleString()}`}
            subtitle="This month"
            icon={<PaymentIcon />}
            color="#ed6c02"
            trend={{ value: metrics?.revenueGrowth || 0, direction: 'up' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="System Health"
            value={`${(metrics?.systemHealth || 0).toFixed(1)}%`}
            subtitle="Uptime"
            icon={<SpeedIcon />}
            color="#9c27b0"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ borderRadius: 3, mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            ⚡ Quick Actions
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((action) => (
              <Grid item xs={12} sm={6} md={3} key={action.id}>
                <QuickActionCard action={action} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Analytics and Activity */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Weekly Performance */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                📈 Weekly Performance
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip />
                  <Area 
                    type="monotone" 
                    dataKey="calls" 
                    stackId="1" 
                    stroke="#1976d2" 
                    fill="#1976d240" 
                    strokeWidth={3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stackId="2" 
                    stroke="#2e7d32" 
                    fill="#2e7d3240" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
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
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar 
                        sx={{ 
                          bgcolor: `${getStatusColor(activity.status)}20`, 
                          color: getStatusColor(activity.status),
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
                          {activity.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {activity.timestamp}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        size="small"
                        label={activity.status}
                        sx={{
                          bgcolor: `${getStatusColor(activity.status)}20`,
                          color: getStatusColor(activity.status),
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                      {loading ? 'Loading activity...' : 'No recent activity'}
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>
    </Container>
  );
}
