'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Avatar,
  Stack,
  Divider,
  Alert,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon
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
  ResponsiveContainer
} from 'recharts';
import { default as FixedGrid } from '@/components/FixedGrid';
import DashboardLayout from '@/components/DashboardLayout';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  trend: number;
  icon: React.ReactNode;
  color: string;
}

interface SystemLoad {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export default function PerformancePage() {
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const workspaceId = 'default-workspace'; // TODO: Get from auth context
      
      // Get current metrics
      const statsResponse = await fetch(`/api/performance?workspaceId=${workspaceId}&action=current`);
      if (!statsResponse.ok) throw new Error('Failed to fetch performance stats');
      const stats = await statsResponse.json();
      setPerformanceStats(stats);

      // Get historical data
      const histResponse = await fetch(`/api/performance?workspaceId=${workspaceId}&action=historical&hours=24`);
      if (!histResponse.ok) throw new Error('Failed to fetch historical data');
      const hist = await histResponse.json();
      setHistoricalData(hist);

      // Get alerts
      const alertsResponse = await fetch(`/api/performance?workspaceId=${workspaceId}&action=alerts`);
      if (!alertsResponse.ok) throw new Error('Failed to fetch alerts');
      const alertsData = await alertsResponse.json();
      setAlerts(alertsData);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  // Simulate metrics for demo
  const simulateMetrics = async () => {
    try {
      const workspaceId = 'default-workspace';
      const response = await fetch(`/api/performance?workspaceId=${workspaceId}&action=simulate`);
      if (!response.ok) throw new Error('Failed to simulate metrics');
      
      // Refresh data after simulation
      await fetchPerformanceData();
    } catch (error) {
      console.error('Error simulating metrics:', error);
      setError(error instanceof Error ? error.message : 'Failed to simulate metrics');
    }
  };

  useEffect(() => {
    fetchPerformanceData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchPerformanceData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Process historical data for chart
  const chartData = historicalData.map(item => ({
    timestamp: new Date(item.timestamp).toLocaleTimeString(),
    cpu: item.cpu_usage,
    memory: item.memory_usage,
    disk: item.disk_usage,
    network: item.network_usage
  }));

  const performanceMetrics = performanceStats ? [
    {
      name: 'CPU Usage',
      value: Math.round(performanceStats.current_metrics.cpu),
      unit: '%',
      threshold: 80,
      status: performanceStats.current_metrics.cpu > 80 ? 'critical' : 
               performanceStats.current_metrics.cpu > 60 ? 'warning' : 'good',
      trend: performanceStats.trends.cpu_trend,
      icon: <SpeedIcon />,
      color: performanceStats.current_metrics.cpu > 80 ? '#f44336' : 
             performanceStats.current_metrics.cpu > 60 ? '#ff9800' : '#4caf50'
    },
    {
      name: 'Memory Usage',
      value: Math.round(performanceStats.current_metrics.memory),
      unit: '%',
      threshold: 85,
      status: performanceStats.current_metrics.memory > 85 ? 'critical' : 
               performanceStats.current_metrics.memory > 70 ? 'warning' : 'good',
      trend: performanceStats.trends.memory_trend,
      icon: <MemoryIcon />,
      color: performanceStats.current_metrics.memory > 85 ? '#f44336' : 
             performanceStats.current_metrics.memory > 70 ? '#ff9800' : '#4caf50'
    },
    {
      name: 'Disk Usage',
      value: Math.round(performanceStats.current_metrics.disk),
      unit: '%',
      threshold: 90,
      status: performanceStats.current_metrics.disk > 90 ? 'critical' : 
               performanceStats.current_metrics.disk > 75 ? 'warning' : 'good',
      trend: 0, // No trend for disk in current stats
      icon: <StorageIcon />,
      color: performanceStats.current_metrics.disk > 90 ? '#f44336' : 
             performanceStats.current_metrics.disk > 75 ? '#ff9800' : '#4caf50'
    },
    {
      name: 'Response Time',
      value: Math.round(performanceStats.current_metrics.response_time),
      unit: 'ms',
      threshold: 2000,
      status: performanceStats.current_metrics.response_time > 2000 ? 'critical' : 
               performanceStats.current_metrics.response_time > 1000 ? 'warning' : 'good',
      trend: 0, // No trend for response time in current stats
      icon: <NetworkCheckIcon />,
      color: performanceStats.current_metrics.response_time > 2000 ? '#f44336' : 
             performanceStats.current_metrics.response_time > 1000 ? '#ff9800' : '#4caf50'
    }
  ] : [];
    {
      name: 'Disk Usage',
      value: 52,
      unit: '%',
      threshold: 90,
      status: 'good',
      trend: 3,
      icon: <StorageIcon />,
      color: '#4caf50'
    },
    {
      name: 'Network I/O',
      value: 45,
      unit: 'MB/s',
      threshold: 100,
      status: 'good',
      trend: 18,
      icon: <NetworkIcon />,
      color: '#2196f3'
    }
  ];

  const systemAlerts = [
    {
      id: 1,
      severity: 'warning' as const,
      message: 'High CPU usage detected on server-01',
      timestamp: '2 minutes ago'
    },
    {
      id: 2,
      severity: 'info' as const,
      message: 'Database backup completed successfully',
      timestamp: '15 minutes ago'
    },
    {
      id: 3,
      severity: 'error' as const,
      message: 'API response time exceeded threshold',
      timestamp: '1 hour ago'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // In real app, fetch fresh data here
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'critical': return <ErrorIcon color="error" />;
      default: return <CheckIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'success.main';
      case 'warning': return 'warning.main';
      case 'critical': return 'error.main';
      default: return 'grey.500';
    }
  };

  const MetricCard = ({ metric }: { metric: PerformanceMetric }) => (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar sx={{ bgcolor: metric.color, width: 48, height: 48 }}>
            {metric.icon}
          </Avatar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon(metric.status)}
            <Chip
              size="small"
              icon={metric.trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={`${metric.trend >= 0 ? '+' : ''}${metric.trend}%`}
              color={metric.trend >= 0 ? 'error' : 'success'}
              variant="outlined"
            />
          </Box>
        </Box>
        
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {metric.value}{metric.unit}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {metric.name}
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <LinearProgress
            variant="determinate"
            value={metric.value}
            color={metric.status === 'good' ? 'success' : metric.status === 'warning' ? 'warning' : 'error'}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Threshold: {metric.threshold}{metric.unit}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <LinearProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              System Performance
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real-time monitoring and performance analytics
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Typography>
            <Button startIcon={<DownloadIcon />} variant="outlined" size="small">
              Export Report
            </Button>
            <Button 
              startIcon={<RefreshIcon />} 
              variant="contained" 
              size="small"
              onClick={() => setLastUpdate(new Date())}
            >
              Refresh
            </Button>
          </Stack>
        </Box>

        {/* Performance Metrics */}
        <FixedGrid container spacing={3} sx={{ mb: 4 }}>
          {performanceMetrics.map((metric, index) => (
            <FixedGrid item xs={12} sm={6} md={3} key={index}>
              <MetricCard metric={metric} />
            </FixedGrid>
          ))}
        </FixedGrid>

        {/* Charts and Alerts */}
        <FixedGrid container spacing={3}>
          {/* Performance Chart */}
          <FixedGrid item xs={12} lg={8}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                System Load Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <ChartTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#ff9800" 
                    strokeWidth={2}
                    name="CPU %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="#f44336" 
                    strokeWidth={2}
                    name="Memory %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="disk" 
                    stroke="#4caf50" 
                    strokeWidth={2}
                    name="Disk %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="network" 
                    stroke="#2196f3" 
                    strokeWidth={2}
                    name="Network MB/s"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </FixedGrid>

          {/* System Alerts */}
          <FixedGrid item xs={12} lg={4}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                System Alerts
              </Typography>
              <Stack spacing={2}>
                {systemAlerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    severity={alert.severity}
                    sx={{ 
                      '& .MuiAlert-message': { 
                        width: '100%' 
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {alert.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {alert.timestamp}
                      </Typography>
                    </Box>
                  </Alert>
                ))}
                
                <Button variant="outlined" size="small" fullWidth sx={{ mt: 2 }}>
                  View All Alerts
                </Button>
              </Stack>
            </Card>
          </FixedGrid>

          {/* System Info */}
          <FixedGrid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                System Information
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">OS</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Ubuntu 22.04 LTS</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Uptime</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>15 days, 4 hours</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Load Average</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>0.68, 0.82, 0.75</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Active Processes</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>247</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Network Connections</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>1,543 active</Typography>
                </Box>
              </Stack>
            </Card>
          </FixedGrid>

          {/* Quick Actions */}
          <FixedGrid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Button variant="outlined" fullWidth startIcon={<RefreshIcon />}>
                  Restart Services
                </Button>
                <Button variant="outlined" fullWidth startIcon={<MemoryIcon />}>
                  Clear Cache
                </Button>
                <Button variant="outlined" fullWidth startIcon={<StorageIcon />}>
                  Clean Logs
                </Button>
                <Button variant="outlined" fullWidth startIcon={<DownloadIcon />}>
                  Generate Report
                </Button>
                <Button variant="outlined" fullWidth startIcon={<TimelineIcon />}>
                  View Logs
                </Button>
              </Stack>
            </Card>
          </FixedGrid>
        </FixedGrid>
      </Box>
    </DashboardLayout>
  );
}
