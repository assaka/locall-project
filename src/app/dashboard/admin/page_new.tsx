'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  LinearProgress,
  Avatar,
  CardHeader,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Badge,
  Grow,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Skeleton
} from '@mui/material';
import { Grid } from '../../../components/FixedGrid';
import {
  Dashboard as DashboardIcon,
  Tune as IntegrationIcon,
  CardGiftcard as LoyaltyIcon,
  Web as WebformIcon,
  Payment as BillingIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  People as PeopleIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
  Build as BuildIcon,
  Shield as ShieldIcon,
  Monitor as MonitorIcon,
  Cloud as CloudIcon,
  Memory as MemoryIcon,
  DataUsage as DataUsageIcon
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
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// Enhanced interfaces
interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  response_time: number;
  active_connections: number;
  error_rate: number;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  last_check: string;
  response_time: number;
  error_count: number;
}

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'permission_change' | 'data_access' | 'api_call';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user: string;
  description: string;
  timestamp: string;
  ip_address: string;
}

interface UserMetrics {
  total_users: number;
  active_users: number;
  new_registrations: number;
  user_growth_rate: number;
}

interface SystemMetrics {
  total_requests: number;
  api_calls: number;
  data_processed: number;
  storage_used: number;
}

// Mock data
const mockSystemHealth: SystemHealth = {
  status: 'healthy',
  uptime: 99.97,
  cpu_usage: 45.2,
  memory_usage: 67.8,
  disk_usage: 34.1,
  response_time: 142,
  active_connections: 1247,
  error_rate: 0.12
};

const mockServices: ServiceStatus[] = [
  {
    name: 'API Gateway',
    status: 'online',
    uptime: 99.98,
    last_check: '2024-03-15T14:22:00Z',
    response_time: 45,
    error_count: 2
  },
  {
    name: 'Database',
    status: 'online',
    uptime: 99.95,
    last_check: '2024-03-15T14:21:30Z',
    response_time: 23,
    error_count: 0
  },
  {
    name: 'File Storage',
    status: 'degraded',
    uptime: 98.76,
    last_check: '2024-03-15T14:20:45Z',
    response_time: 189,
    error_count: 5
  },
  {
    name: 'Email Service',
    status: 'online',
    uptime: 99.87,
    last_check: '2024-03-15T14:22:15Z',
    response_time: 67,
    error_count: 1
  },
  {
    name: 'SMS Gateway',
    status: 'online',
    uptime: 99.92,
    last_check: '2024-03-15T14:21:55Z',
    response_time: 78,
    error_count: 0
  }
];

const mockSecurityEvents: SecurityEvent[] = [
  {
    id: '1',
    type: 'login_attempt',
    severity: 'low',
    user: 'john.doe@company.com',
    description: 'Successful login from new device',
    timestamp: '2 minutes ago',
    ip_address: '192.168.1.100'
  },
  {
    id: '2',
    type: 'permission_change',
    severity: 'medium',
    user: 'admin@company.com',
    description: 'User permissions updated for team member',
    timestamp: '15 minutes ago',
    ip_address: '10.0.0.5'
  },
  {
    id: '3',
    type: 'api_call',
    severity: 'high',
    user: 'system_integration',
    description: 'Unusual API access pattern detected',
    timestamp: '1 hour ago',
    ip_address: '203.0.113.42'
  }
];

const mockUserMetrics: UserMetrics = {
  total_users: 15847,
  active_users: 8932,
  new_registrations: 147,
  user_growth_rate: 12.3
};

const mockSystemMetrics: SystemMetrics = {
  total_requests: 2847392,
  api_calls: 453621,
  data_processed: 847.2,
  storage_used: 1247.8
};

const chartColors = ['#1976d2', '#dc004e', '#ed6c02', '#2e7d32', '#9c27b0', '#00695c'];

const performanceData = [
  { time: '00:00', cpu: 35, memory: 60, response: 120 },
  { time: '04:00', cpu: 28, memory: 55, response: 98 },
  { time: '08:00', cpu: 52, memory: 72, response: 156 },
  { time: '12:00', cpu: 68, memory: 78, response: 189 },
  { time: '16:00', cpu: 45, memory: 65, response: 134 },
  { time: '20:00', cpu: 38, memory: 58, response: 112 }
];

const systemHealthRadar = [
  { subject: 'Performance', A: 90, fullMark: 100 },
  { subject: 'Security', A: 95, fullMark: 100 },
  { subject: 'Reliability', A: 88, fullMark: 100 },
  { subject: 'Scalability', A: 92, fullMark: 100 },
  { subject: 'Monitoring', A: 85, fullMark: 100 },
  { subject: 'Backup', A: 98, fullMark: 100 }
];

// Enhanced MetricCard component
const MetricCard = ({ title, value, subtitle, icon, color, trend, status, loading = false }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; direction: 'up' | 'down' };
  status?: 'healthy' | 'warning' | 'critical';
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
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 56, height: 56 }}>
              {icon}
            </Avatar>
            {status && (
              <Chip
                size="small"
                label={status}
                color={status === 'healthy' ? 'success' : status === 'warning' ? 'warning' : 'error'}
                sx={{ fontWeight: 600, textTransform: 'capitalize' }}
              />
            )}
          </Box>
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

// ServiceCard component
const ServiceCard = ({ service }: { service: ServiceStatus }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#2e7d32';
      case 'degraded': return '#ed6c02';
      case 'offline': return '#d32f2f';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckIcon />;
      case 'degraded': return <WarningIcon />;
      case 'offline': return <ErrorIcon />;
      default: return <ErrorIcon />;
    }
  };

  return (
    <Fade in timeout={600}>
      <Card
        sx={{
          borderRadius: 2,
          border: `2px solid ${getStatusColor(service.status)}30`,
          background: `linear-gradient(135deg, ${getStatusColor(service.status)}10 0%, ${getStatusColor(service.status)}20 100%)`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 16px ${getStatusColor(service.status)}20`,
          }
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {service.name}
            </Typography>
            <Chip
              size="small"
              icon={getStatusIcon(service.status)}
              label={service.status.charAt(0).toUpperCase() + service.status.slice(1)}
              sx={{
                bgcolor: `${getStatusColor(service.status)}20`,
                color: getStatusColor(service.status),
                fontWeight: 600
              }}
            />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Uptime
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: getStatusColor(service.status) }}>
                {service.uptime}%
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Response
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {service.response_time}ms
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Last check: {new Date(service.last_check).toLocaleTimeString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>(mockSystemHealth);
  const [services, setServices] = useState<ServiceStatus[]>(mockServices);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(mockSecurityEvents);
  const [userMetrics, setUserMetrics] = useState<UserMetrics>(mockUserMetrics);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>(mockSystemMetrics);
  const [settingsDialog, setSettingsDialog] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#2e7d32';
      case 'medium': return '#ed6c02';
      case 'high': return '#d32f2f';
      case 'critical': return '#7b1fa2';
      default: return '#757575';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, background: 'linear-gradient(45deg, #1976d2, #9c27b0)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            🛠️ System Admin
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>
            Monitor, manage, and maintain your platform infrastructure
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            onClick={() => setSettingsDialog(true)}
          >
            Settings
          </Button>
        </Box>
      </Box>

      {/* System Health Alert */}
      {systemHealth.status !== 'healthy' && (
        <Alert 
          severity={systemHealth.status === 'warning' ? 'warning' : 'error'} 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small">
              Investigate
            </Button>
          }
        >
          System status: {systemHealth.status}. Some services may be experiencing issues.
        </Alert>
      )}

      {/* Overview Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="System Health"
            value={`${systemHealth.uptime}%`}
            subtitle="Uptime"
            icon={<MonitorIcon />}
            color="#1976d2"
            status={systemHealth.status}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Users"
            value={userMetrics.active_users.toLocaleString()}
            subtitle={`${userMetrics.total_users.toLocaleString()} total`}
            icon={<PeopleIcon />}
            color="#2e7d32"
            trend={{ value: userMetrics.user_growth_rate, direction: 'up' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="API Calls"
            value={systemMetrics.api_calls.toLocaleString()}
            subtitle="Today"
            icon={<DataUsageIcon />}
            color="#ed6c02"
            trend={{ value: 8.2, direction: 'up' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Storage Used"
            value={`${systemMetrics.storage_used}GB`}
            subtitle="Available space"
            icon={<StorageIcon />}
            color="#9c27b0"
            trend={{ value: 12, direction: 'up' }}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{
            bgcolor: 'background.paper',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem'
            }
          }}
        >
          <Tab icon={<DashboardIcon />} label="Overview" />
          <Tab icon={<SpeedIcon />} label="Performance" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<SettingsIcon />} label="System Config" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Tab 0: Overview */}
          {selectedTab === 0 && (
            <Grid container spacing={3}>
              {/* Services Status */}
              <Grid item xs={12} lg={8}>
                <Card sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Service Status
                  </Typography>
                  <Grid container spacing={2}>
                    {services.map((service) => (
                      <Grid item xs={12} sm={6} md={4} key={service.name}>
                        <ServiceCard service={service} />
                      </Grid>
                    ))}
                  </Grid>
                </Card>

                {/* Quick Actions */}
                <Card sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        component={Link}
                        href="/dashboard/integrations"
                        variant="outlined"
                        fullWidth
                        startIcon={<IntegrationIcon />}
                        sx={{ height: 60, flexDirection: 'column', gap: 1 }}
                      >
                        <Typography variant="body2">Integrations</Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        component={Link}
                        href="/dashboard/billing"
                        variant="outlined"
                        fullWidth
                        startIcon={<BillingIcon />}
                        sx={{ height: 60, flexDirection: 'column', gap: 1 }}
                      >
                        <Typography variant="body2">Billing</Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        component={Link}
                        href="/dashboard/webforms"
                        variant="outlined"
                        fullWidth
                        startIcon={<WebformIcon />}
                        sx={{ height: 60, flexDirection: 'column', gap: 1 }}
                      >
                        <Typography variant="body2">Webforms</Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        component={Link}
                        href="/dashboard/loyalty"
                        variant="outlined"
                        fullWidth
                        startIcon={<LoyaltyIcon />}
                        sx={{ height: 60, flexDirection: 'column', gap: 1 }}
                      >
                        <Typography variant="body2">Loyalty</Typography>
                      </Button>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              {/* System Health Radar */}
              <Grid item xs={12} lg={4}>
                <Card sx={{ p: 3, borderRadius: 2, height: 'fit-content' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    System Health Overview
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={systemHealthRadar}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={60} domain={[0, 100]} />
                      <Radar
                        name="Health Score"
                        dataKey="A"
                        stroke="#1976d2"
                        fill="#1976d2"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tab 1: Performance */}
          {selectedTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    System Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <ChartTooltip />
                      <Area type="monotone" dataKey="cpu" stackId="1" stroke="#1976d2" fill="#1976d240" />
                      <Area type="monotone" dataKey="memory" stackId="2" stroke="#dc004e" fill="#dc004e40" />
                      <Area type="monotone" dataKey="response" stackId="3" stroke="#ed6c02" fill="#ed6c0240" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Resource Usage
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>
                          {systemHealth.cpu_usage}%
                        </Typography>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>CPU Usage</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={systemHealth.cpu_usage}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc004e', mb: 1 }}>
                          {systemHealth.memory_usage}%
                        </Typography>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>Memory Usage</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={systemHealth.memory_usage}
                          color="secondary"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#ed6c02', mb: 1 }}>
                          {systemHealth.disk_usage}%
                        </Typography>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>Disk Usage</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={systemHealth.disk_usage}
                          color="warning"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Performance Metrics
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <SpeedIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Response Time"
                        secondary={`${systemHealth.response_time}ms avg`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PeopleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Active Connections"
                        secondary={systemHealth.active_connections.toLocaleString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Error Rate"
                        secondary={`${systemHealth.error_rate}%`}
                      />
                    </ListItem>
                  </List>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tab 2: Security */}
          {selectedTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardHeader
                    title="Security Events"
                    subheader="Recent security-related activities and alerts"
                    action={
                      <Button variant="outlined" size="small">
                        View All
                      </Button>
                    }
                  />
                  <Divider />
                  <List>
                    {securityEvents.map((event, index) => (
                      <React.Fragment key={event.id}>
                        <ListItem>
                          <ListItemIcon>
                            <Avatar
                              sx={{
                                bgcolor: `${getSeverityColor(event.severity)}20`,
                                color: getSeverityColor(event.severity),
                                width: 40,
                                height: 40
                              }}
                            >
                              <SecurityIcon />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {event.description}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={event.severity}
                                  sx={{
                                    bgcolor: `${getSeverityColor(event.severity)}20`,
                                    color: getSeverityColor(event.severity),
                                    fontWeight: 600,
                                    textTransform: 'capitalize'
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  User: {event.user} • IP: {event.ip_address}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {event.timestamp}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < securityEvents.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Security Settings
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Two-factor authentication"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Failed login alerts"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="IP whitelist enabled"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Security event logging"
                    />
                    <Button variant="outlined" startIcon={<ShieldIcon />} sx={{ mt: 2 }}>
                      Security Audit
                    </Button>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tab 3: System Config */}
          {selectedTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    System Configuration
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="System Name"
                      variant="outlined"
                      size="small"
                      fullWidth
                      defaultValue="Locall Platform"
                    />
                    <TextField
                      label="API Base URL"
                      variant="outlined"
                      size="small"
                      fullWidth
                      defaultValue="https://api.locall.com"
                    />
                    <TextField
                      label="Max Upload Size (MB)"
                      variant="outlined"
                      size="small"
                      type="number"
                      defaultValue="50"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Maintenance mode"
                    />
                  </Box>
                </Card>

                <Card sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Backup & Recovery
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button variant="outlined" startIcon={<CloudIcon />}>
                      Manual Backup
                    </Button>
                    <Button variant="outlined" startIcon={<TimelineIcon />}>
                      View Backup History
                    </Button>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Automated daily backups"
                    />
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Email Configuration
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="SMTP Server"
                      variant="outlined"
                      size="small"
                      fullWidth
                      defaultValue="smtp.gmail.com"
                    />
                    <TextField
                      label="SMTP Port"
                      variant="outlined"
                      size="small"
                      type="number"
                      defaultValue="587"
                    />
                    <TextField
                      label="From Email"
                      variant="outlined"
                      size="small"
                      fullWidth
                      defaultValue="noreply@locall.com"
                    />
                    <Button variant="outlined">Test Email Configuration</Button>
                  </Box>
                </Card>

                <Card sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Monitoring & Alerts
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Performance monitoring"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Error notifications"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Weekly reports"
                    />
                    <Button variant="outlined" startIcon={<NotificationsIcon />}>
                      Configure Alerts
                    </Button>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Card>

      {/* Settings Dialog */}
      <Dialog
        open={settingsDialog}
        onClose={() => setSettingsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>System Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Alert severity="info">
              Changes to system settings will affect all users and require administrator privileges.
            </Alert>
            <TextField
              label="System Timezone"
              variant="outlined"
              fullWidth
              defaultValue="UTC"
            />
            <TextField
              label="Default Language"
              variant="outlined"
              fullWidth
              defaultValue="English"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable system-wide notifications"
            />
            <FormControlLabel
              control={<Switch />}
              label="Allow user registration"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => setSettingsDialog(false)}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
