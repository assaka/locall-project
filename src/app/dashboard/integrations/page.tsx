'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Tooltip,
  LinearProgress,
  Fab,
  SpeedDial,
  SpeedDialAction,
  Grow,
  Fade,
  Slide,
  Avatar,
  CardHeader,
  Divider,
  Badge,
  Container,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Skeleton
} from '@mui/material';
import { Grid } from '../../../components/FixedGrid';
import {
  Settings as SettingsIcon,
  Sync as SyncIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  CloudSync as CloudSyncIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Api as ApiIcon,
  Link as LinkIcon,
  Webhook as WebhookIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Shield as ShieldIcon,
  Code as CodeIcon,
  Hub as IntegrationIcon,
  Storage as StorageIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon
} from '@mui/icons-material';
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
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';

// Enhanced interfaces
interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  logo: string;
  category: 'CRM' | 'Calendar' | 'Marketing' | 'Analytics' | 'Communication' | 'Storage';
  features: string[];
  status: 'available' | 'connected' | 'error' | 'premium';
  connectedAt?: string;
  lastSync?: string;
  dataPoints: number;
  isRealTime: boolean;
  health: number;
}

interface SyncMetrics {
  totalSyncs: number;
  successRate: number;
  avgSyncTime: number;
  dataTransferred: number;
  errors: number;
  lastSync: string;
}

interface RealtimeActivity {
  id: string;
  provider: string;
  action: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  details: string;
}

// Mock data for demonstration
const mockProviders: IntegrationProvider[] = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Advanced CRM integration with real-time contact and deal synchronization',
    logo: '🔗',
    category: 'CRM',
    features: ['Contacts', 'Deals', 'Companies', 'Custom Properties', 'Workflows'],
    status: 'connected',
    connectedAt: '2024-01-15T10:30:00Z',
    lastSync: '2024-03-15T14:22:00Z',
    dataPoints: 15420,
    isRealTime: true,
    health: 98
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Seamless calendar integration with intelligent appointment management',
    logo: '📅',
    category: 'Calendar',
    features: ['Events', 'Attendees', 'Reminders', 'Recurring Events'],
    status: 'connected',
    connectedAt: '2024-02-01T09:15:00Z',
    lastSync: '2024-03-15T14:18:00Z',
    dataPoints: 8930,
    isRealTime: true,
    health: 95
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication integration for notifications and bot interactions',
    logo: '💬',
    category: 'Communication',
    features: ['Channels', 'Direct Messages', 'Bot Commands', 'File Sharing'],
    status: 'available',
    dataPoints: 0,
    isRealTime: true,
    health: 0
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing automation and audience management',
    logo: '📧',
    category: 'Marketing',
    features: ['Campaigns', 'Audiences', 'Templates', 'Analytics'],
    status: 'premium',
    dataPoints: 0,
    isRealTime: false,
    health: 0
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Web analytics and performance tracking integration',
    logo: '📊',
    category: 'Analytics',
    features: ['Page Views', 'User Sessions', 'Conversions', 'Custom Events'],
    status: 'error',
    connectedAt: '2024-01-20T11:45:00Z',
    lastSync: '2024-03-14T08:30:00Z',
    dataPoints: 45200,
    isRealTime: false,
    health: 15
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Cloud storage integration for file management and sharing',
    logo: '📁',
    category: 'Storage',
    features: ['File Sync', 'Sharing', 'Version Control', 'Team Folders'],
    status: 'available',
    dataPoints: 0,
    isRealTime: false,
    health: 0
  }
];

const mockSyncMetrics: SyncMetrics = {
  totalSyncs: 1248,
  successRate: 96.8,
  avgSyncTime: 2.4,
  dataTransferred: 847.2,
  errors: 12,
  lastSync: '2024-03-15T14:22:00Z'
};

const mockActivity: RealtimeActivity[] = [
  {
    id: '1',
    provider: 'HubSpot',
    action: 'Contact updated',
    timestamp: '2 minutes ago',
    status: 'success',
    details: 'John Doe contact information synchronized'
  },
  {
    id: '2',
    provider: 'Google Calendar',
    action: 'Event created',
    timestamp: '5 minutes ago',
    status: 'success',
    details: 'New appointment scheduled for tomorrow'
  },
  {
    id: '3',
    provider: 'Google Analytics',
    action: 'Sync failed',
    timestamp: '12 minutes ago',
    status: 'error',
    details: 'Authentication token expired'
  },
  {
    id: '4',
    provider: 'HubSpot',
    action: 'Deal updated',
    timestamp: '18 minutes ago',
    status: 'success',
    details: 'Pipeline stage changed to "Negotiation"'
  }
];

const chartColors = ['#1976d2', '#dc004e', '#ed6c02', '#2e7d32', '#9c27b0', '#00695c'];

const syncTrendData = [
  { time: '00:00', syncs: 45, errors: 1 },
  { time: '04:00', syncs: 23, errors: 0 },
  { time: '08:00', syncs: 89, errors: 2 },
  { time: '12:00', syncs: 156, errors: 1 },
  { time: '16:00', syncs: 234, errors: 3 },
  { time: '20:00', syncs: 178, errors: 0 },
];

const providerUsageData = [
  { name: 'HubSpot', value: 45, color: '#1976d2' },
  { name: 'Google Cal', value: 30, color: '#dc004e' },
  { name: 'Analytics', value: 15, color: '#ed6c02' },
  { name: 'Others', value: 10, color: '#2e7d32' }
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

// Provider Card component
const ProviderCard = ({ provider, onConnect, onDisconnect, onSettings }: {
  provider: IntegrationProvider;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onSettings: (id: string) => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#2e7d32';
      case 'error': return '#d32f2f';
      case 'premium': return '#9c27b0';
      default: return '#757575';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'error': return 'Error';
      case 'premium': return 'Premium';
      default: return 'Available';
    }
  };

  return (
    <Fade in timeout={600}>
      <Card
        sx={{
          height: '100%',
          borderRadius: 3,
          border: '2px solid transparent',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
            border: `2px solid ${getStatusColor(provider.status)}40`,
          }
        }}
      >
        <CardHeader
          avatar={
            <Badge
              badgeContent={provider.isRealTime ? <span style={{ fontSize: 8 }}>⚡</span> : null}
              color="primary"
            >
              <Avatar sx={{ bgcolor: `${getStatusColor(provider.status)}20`, fontSize: 24 }}>
                {provider.logo}
              </Avatar>
            </Badge>
          }
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {provider.status === 'connected' && (
                <Chip
                  size="small"
                  label={`${provider.health}%`}
                  color={provider.health > 90 ? 'success' : provider.health > 70 ? 'warning' : 'error'}
                  sx={{ fontWeight: 600 }}
                />
              )}
              <Chip
                size="small"
                label={getStatusLabel(provider.status)}
                sx={{
                  bgcolor: `${getStatusColor(provider.status)}20`,
                  color: getStatusColor(provider.status),
                  fontWeight: 600
                }}
              />
            </Box>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {provider.name}
            </Typography>
          }
          subheader={
            <Chip size="small" label={provider.category} variant="outlined" sx={{ mt: 0.5 }} />
          }
        />
        <CardContent sx={{ pt: 0 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6 }}>
            {provider.description}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Features:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {provider.features.slice(0, 3).map((feature, index) => (
                <Chip
                  key={index}
                  label={feature}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
              {provider.features.length > 3 && (
                <Chip
                  label={`+${provider.features.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
            </Box>
          </Box>

          {provider.status === 'connected' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                <strong>{provider.dataPoints.toLocaleString()}</strong> data points synced
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Last sync: {new Date(provider.lastSync!).toLocaleString()}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            {provider.status === 'connected' ? (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SyncIcon />}
                  sx={{ flex: 1 }}
                >
                  Sync
                </Button>
                <IconButton size="small" onClick={() => onSettings(provider.id)}>
                  <SettingsIcon />
                </IconButton>
                <IconButton size="small" onClick={() => onDisconnect(provider.id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </>
            ) : provider.status === 'error' ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<RefreshIcon />}
                color="error"
                sx={{ flex: 1 }}
                onClick={() => onConnect(provider.id)}
              >
                Reconnect
              </Button>
            ) : provider.status === 'premium' ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<IntegrationIcon />}
                sx={{ 
                  flex: 1,
                  background: 'linear-gradient(45deg, #9c27b0, #e91e63)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #7b1fa2, #c2185b)',
                  }
                }}
              >
                Upgrade
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                sx={{ flex: 1 }}
                onClick={() => onConnect(provider.id)}
              >
                Connect
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default function IntegrationsPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [activity, setActivity] = useState<RealtimeActivity[]>([]);
  const [connectDialog, setConnectDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);

  const fetchIntegrationsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard-integrations');
      if (!response.ok) {
        throw new Error(`Failed to fetch integrations data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setProviders(data.providers || []);
      setMetrics(data.metrics);
      setActivity(data.activity || []);
    } catch (err) {
      console.error('Error fetching integrations data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations data');
      
      // Fallback to mock data on error
      setProviders(mockProviders);
      setMetrics(mockSyncMetrics);
      setActivity(mockActivity);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrationsData();
    
    // Set up auto-refresh every 30 seconds for real-time activity
    const interval = setInterval(fetchIntegrationsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setSelectedProvider(provider);
      setConnectDialog(true);
    }
  };

  const handleDisconnect = (providerId: string) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId 
        ? { ...p, status: 'available' as const, connectedAt: undefined, lastSync: undefined, dataPoints: 0, health: 0 }
        : p
    ));
  };

  const handleSettings = (providerId: string) => {
    console.log('Settings for:', providerId);
  };

  const connectedProviders = providers.filter(p => p.status === 'connected');
  const errorProviders = providers.filter(p => p.status === 'error');

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, background: 'linear-gradient(45deg, #1976d2, #9c27b0)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          🔗 Integrations Hub
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>
          Connect and manage your business tools with powerful integrations
        </Typography>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchIntegrationsData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Connected Apps"
            value={connectedProviders.length}
            subtitle={`${providers.length - connectedProviders.length} available`}
            icon={<IntegrationIcon />}
            color="#1976d2"
            trend={{ value: 12, direction: 'up' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Syncs"
            value={metrics ? metrics.totalSyncs.toLocaleString() : '--'}
            subtitle="This month"
            icon={<SyncIcon />}
            color="#2e7d32"
            trend={{ value: 8, direction: 'up' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Success Rate"
            value={metrics ? `${metrics.successRate}%` : '--'}
            subtitle="Last 30 days"
            icon={<CheckCircleIcon />}
            color="#ed6c02"
            trend={{ value: 2.1, direction: 'up' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Data Transferred"
            value={metrics ? `${metrics.dataTransferred}MB` : '--'}
            subtitle="This month"
            icon={<StorageIcon />}
            color="#9c27b0"
            trend={{ value: 15, direction: 'up' }}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Error Alerts */}
      {errorProviders.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small">
              Fix All
            </Button>
          }
        >
          {errorProviders.length} integration{errorProviders.length > 1 ? 's' : ''} need{errorProviders.length === 1 ? 's' : ''} attention. 
          Click to resolve connection issues.
        </Alert>
      )}

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
          <Tab icon={<IntegrationIcon />} label="All Integrations" />
          <Tab icon={<AnalyticsIcon />} label="Analytics" />
          <Tab icon={<TimelineIcon />} label="Activity" />
          <Tab icon={<SettingsIcon />} label="Settings" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Tab 0: All Integrations */}
          {selectedTab === 0 && (
            <Grid container spacing={3}>
              {providers.map((provider) => (
                <Grid item xs={12} sm={6} lg={4} key={provider.id}>
                  <ProviderCard
                    provider={provider}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onSettings={handleSettings}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {/* Tab 1: Analytics */}
          {selectedTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Sync Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={syncTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <ChartTooltip />
                      <Area type="monotone" dataKey="syncs" stroke="#1976d2" fill="#1976d240" strokeWidth={3} />
                      <Area type="monotone" dataKey="errors" stroke="#d32f2f" fill="#d32f2f40" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Card sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Usage by Provider
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={providerUsageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {providerUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tab 2: Activity */}
          {selectedTab === 2 && (
            <Card sx={{ borderRadius: 2 }}>
              <CardHeader
                title="Real-time Activity"
                subheader="Live updates from your connected integrations"
                action={
                  <IconButton>
                    <RefreshIcon />
                  </IconButton>
                }
              />
              <Divider />
              <List>
                {activity.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemIcon>
                        {item.status === 'success' ? (
                          <CheckCircleIcon color="success" />
                        ) : item.status === 'error' ? (
                          <ErrorIcon color="error" />
                        ) : (
                          <ScheduleIcon color="warning" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {item.provider}
                            </Typography>
                            <Typography variant="body2">
                              {item.action}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {item.details}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {item.timestamp}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < activity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Card>
          )}

          {/* Tab 3: Settings */}
          {selectedTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Sync Settings
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Auto-sync enabled"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Real-time notifications"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Error notifications"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Weekly sync reports"
                    />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    API Settings
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Webhook URL"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value="https://api.yourapp.com/webhooks"
                    />
                    <TextField
                      label="API Rate Limit"
                      variant="outlined"
                      size="small"
                      value="1000"
                      InputProps={{ endAdornment: 'requests/hour' }}
                    />
                    <Button variant="outlined" startIcon={<CodeIcon />}>
                      View API Documentation
                    </Button>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Card>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Integration actions"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<AddIcon />}
      >
        <SpeedDialAction
          icon={<IntegrationIcon />}
          tooltipTitle="Browse Integrations"
        />
        <SpeedDialAction
          icon={<SyncIcon />}
          tooltipTitle="Sync All"
        />
        <SpeedDialAction
          icon={<SettingsIcon />}
          tooltipTitle="Settings"
        />
      </SpeedDial>

      {/* Connect Dialog */}
      <Dialog
        open={connectDialog}
        onClose={() => setConnectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Connect to {selectedProvider?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            {selectedProvider?.description}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              You'll be redirected to {selectedProvider?.name} to authorize the connection.
            </Alert>
            <TextField
              label="Connection Name"
              variant="outlined"
              fullWidth
              defaultValue={`My ${selectedProvider?.name} Account`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectDialog(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => setConnectDialog(false)}>
            Connect
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
