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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Container
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
  Hub as IntegrationIcon
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

interface OAuthConnection {
  id: string;
  provider: string;
  provider_email: string;
  status: 'active' | 'expired' | 'error';
  last_sync: string;
  created_at: string;
}

interface SyncEvent {
  id: string;
  provider: string;
  event_type: string;
  metadata: any;
  created_at: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<OAuthConnection[]>([]);
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [connectDialog, setConnectDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const providers = [
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Sync contacts and deals from your HubSpot CRM',
      logo: 'https://logo.clearbit.com/hubspot.com',
      features: ['Contacts', 'Deals', 'Companies', 'Real-time sync']
    },
    {
      id: 'google',
      name: 'Google Calendar',
      description: 'Sync appointments and meetings from Google Calendar',
      logo: 'https://logo.clearbit.com/google.com',
      features: ['Events', 'Attendees', 'Reminders', 'Real-time updates']
    },
    {
      id: 'calendly',
      name: 'Calendly',
      description: 'Import scheduled meetings and appointments',
      logo: 'https://logo.clearbit.com/calendly.com',
      features: ['Scheduled events', 'Attendee info', 'Event types', 'Webhook notifications']
    }
  ];

  useEffect(() => {
    loadConnections();
    loadSyncEvents();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await fetch('/api/oauth/sync?workspaceId=default-workspace');
      const data = await response.json();
      setConnections(data.data?.connections || []);
      setSyncEvents(data.data?.recent_events || []);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncEvents = async () => {
    try {
      const response = await fetch('/api/oauth/sync?workspaceId=default-workspace');
      const data = await response.json();
      setSyncEvents(data.data?.recent_events || []);
    } catch (error) {
      console.error('Failed to load sync events:', error);
    }
  };

  const handleConnect = async (providerId: string) => {
    try {
      const response = await fetch('/api/oauth/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          workspaceId: 'default-workspace'
        })
      });

      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to initiate connection' });
    }
  };

  const handleSync = async (connectionId: string, provider: string) => {
    setSyncing(connectionId);
    try {
      const response = await fetch('/api/oauth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      });

      if (response.ok) {
        setNotification({ type: 'success', message: `${provider} sync completed successfully` });
        loadConnections();
        loadSyncEvents();
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      setNotification({ type: 'error', message: `Failed to sync ${provider}` });
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (connectionId: string, provider: string) => {
    try {
      const response = await fetch(`/api/oauth/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      });

      if (response.ok) {
        setNotification({ type: 'success', message: `${provider} disconnected successfully` });
        loadConnections();
      }
    } catch (error) {
      setNotification({ type: 'error', message: `Failed to disconnect ${provider}` });
    }
  };

  const getConnectionStatus = (connection: OAuthConnection) => {
    switch (connection.status) {
      case 'active':
        return <Chip icon={<CheckCircleIcon />} label="Connected" color="success" size="small" />;
      case 'expired':
        return <Chip icon={<ErrorIcon />} label="Expired" color="warning" size="small" />;
      case 'error':
        return <Chip icon={<ErrorIcon />} label="Error" color="error" size="small" />;
      default:
        return <Chip label="Unknown" color="default" size="small" />;
    }
  };

  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {notification && (
        <Alert 
          severity={notification.type} 
          onClose={() => setNotification(null)}
          sx={{ mb: 3 }}
        >
          {notification.message}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Integrations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setConnectDialog(true)}
        >
          Connect Integration
        </Button>
      </Box>

      <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Connected Apps" />
        <Tab label="Sync History" />
        <Tab label="Settings" />
      </Tabs>

      <TabPanel value={selectedTab} index={0}>
        <Grid container spacing={3}>
          {providers.map((provider) => {
            const connection = connections.find(c => c.provider === provider.id);
            return (
              <Grid item xs={12} md={6} lg={4} key={provider.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Box
                        component="img"
                        src={provider.logo}
                        alt={provider.name}
                        sx={{ width: 40, height: 40, mr: 2 }}
                      />
                      <Box flexGrow={1}>
                        <Typography variant="h6" fontWeight="bold">
                          {provider.name}
                        </Typography>
                        {connection && getConnectionStatus(connection)}
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {provider.description}
                    </Typography>

                    <Box mb={2}>
                      {provider.features.map((feature) => (
                        <Chip 
                          key={feature} 
                          label={feature} 
                          size="small" 
                          sx={{ mr: 1, mb: 1 }} 
                        />
                      ))}
                    </Box>

                    {connection ? (
                      <Box>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          Connected as: {connection.provider_email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          Last sync: {formatLastSync(connection.last_sync)}
                        </Typography>
                        
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            startIcon={syncing === connection.id ? <CircularProgress size={16} /> : <SyncIcon />}
                            onClick={() => handleSync(connection.id, provider.name)}
                            disabled={syncing === connection.id}
                          >
                            Sync Now
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => handleDisconnect(connection.id, provider.name)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => handleConnect(provider.id)}
                      >
                        Connect
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Provider</TableCell>
                <TableCell>Event Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {syncEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Box
                        component="img"
                        src={providers.find(p => p.id === event.provider)?.logo}
                        alt={event.provider}
                        sx={{ width: 24, height: 24, mr: 1 }}
                      />
                      {providers.find(p => p.id === event.provider)?.name || event.provider}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={event.event_type.replace('_', ' ')} 
                      size="small"
                      color={event.event_type.includes('failed') ? 'error' : 'success'}
                    />
                  </TableCell>
                  <TableCell>
                    {event.event_type.includes('failed') ? (
                      <ErrorIcon color="error" />
                    ) : (
                      <CheckCircleIcon color="success" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {event.metadata?.contacts_synced && 
                        `${event.metadata.contacts_synced} contacts synced`}
                      {event.metadata?.appointments_synced && 
                        `${event.metadata.appointments_synced} appointments synced`}
                      {event.metadata?.error && `Error: ${event.metadata.error}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {formatLastSync(event.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={selectedTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={3}>Sync Settings</Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                />
              }
              label="Enable automatic sync"
            />
            
            <Typography variant="body2" color="text.secondary" mt={1} mb={3}>
              When enabled, integrations will sync automatically every hour
            </Typography>

            <Typography variant="h6" mb={2}>Sync Frequency</Typography>
            <TextField
              select
              label="Sync Interval"
              value="1h"
              SelectProps={{ native: true }}
              sx={{ mb: 3, minWidth: 200 }}
            >
              <option value="15m">Every 15 minutes</option>
              <option value="30m">Every 30 minutes</option>
              <option value="1h">Every hour</option>
              <option value="6h">Every 6 hours</option>
              <option value="24h">Every 24 hours</option>
            </TextField>

            <Box>
              <Button variant="contained" sx={{ mr: 2 }}>
                Save Settings
              </Button>
              <Button variant="outlined">
                Reset to Defaults
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Connect Integration Dialog */}
      <Dialog open={connectDialog} onClose={() => setConnectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connect New Integration</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Choose a provider to connect with your workspace
          </Typography>
          
          <Grid container spacing={2}>
            {providers.map((provider) => {
              const isConnected = connections.some(c => c.provider === provider.id);
              return (
                <Grid item xs={12} key={provider.id}>
                  <Card 
                    sx={{ 
                      cursor: isConnected ? 'default' : 'pointer',
                      opacity: isConnected ? 0.6 : 1,
                      '&:hover': !isConnected ? { boxShadow: 2 } : {}
                    }}
                    onClick={() => !isConnected && handleConnect(provider.id)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center">
                        <Box
                          component="img"
                          src={provider.logo}
                          alt={provider.name}
                          sx={{ width: 32, height: 32, mr: 2 }}
                        />
                        <Box flexGrow={1}>
                          <Typography variant="h6">{provider.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {provider.description}
                          </Typography>
                        </Box>
                        {isConnected && (
                          <Chip label="Connected" color="success" size="small" />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
