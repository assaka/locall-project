'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Alert,
  Button,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Refresh as RefreshIcon,
  PlayArrow as SimulateIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

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

  // Process historical data for chart display
  const chartData = historicalData.slice(-10).map(item => ({
    timestamp: new Date(item.timestamp).toLocaleTimeString(),
    cpu: item.cpu_usage,
    memory: item.memory_usage,
    disk: item.disk_usage,
    network: item.network_usage
  }));

  const performanceMetrics: PerformanceMetric[] = performanceStats ? [
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
      trend: 0,
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
      trend: 0,
      icon: <NetworkIcon />,
      color: performanceStats.current_metrics.response_time > 2000 ? '#f44336' : 
             performanceStats.current_metrics.response_time > 1000 ? '#ff9800' : '#4caf50'
    }
  ] : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'critical': return <ErrorIcon color="error" />;
      default: return <CheckIcon />;
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUpIcon color="error" />;
    if (trend < 0) return <TrendingDownIcon color="success" />;
    return null;
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Performance Monitoring
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<SimulateIcon />}
              onClick={simulateMetrics}
              variant="outlined"
              disabled={loading}
            >
              Simulate Data
            </Button>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchPerformanceData}
              variant="outlined"
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Last Update */}
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Last updated: {lastUpdate.toLocaleString()}
        </Typography>

        {loading && <LinearProgress sx={{ mb: 3 }} />}

        {/* System Overview */}
        {performanceStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Performance Score
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {Math.round(performanceStats.trends.performance_score)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Active Alerts
                  </Typography>
                  <Typography variant="h4" color="error">
                    {performanceStats.alerts.active_alerts}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Uptime
                  </Typography>
                  <Typography variant="h4" color="success">
                    {performanceStats.availability.uptime_percentage.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Error Rate
                  </Typography>
                  <Typography variant="h4">
                    {(performanceStats.current_metrics.error_rate * 100).toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Performance Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {performanceMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: metric.color, mr: 1 }}>
                      {metric.icon}
                    </Box>
                    <Typography variant="h6" component="div">
                      {metric.name}
                    </Typography>
                    {getStatusIcon(metric.status)}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                    <Typography variant="h4" component="div" sx={{ color: metric.color }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
                      {metric.unit}
                    </Typography>
                    {getTrendIcon(metric.trend)}
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (metric.value / metric.threshold) * 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: metric.color,
                        borderRadius: 4,
                      },
                    }}
                  />
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Threshold: {metric.threshold}{metric.unit}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Historical Data Chart */}
        {chartData.length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Last 24 Hours Performance
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'end', gap: 1 }}>
                {chartData.map((data, index) => (
                  <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                      <Box sx={{ 
                        height: data.cpu * 2, 
                        bgcolor: 'primary.main', 
                        width: 8, 
                        borderRadius: 1,
                        minHeight: 2
                      }} />
                      <Box sx={{ 
                        height: data.memory * 2, 
                        bgcolor: 'secondary.main', 
                        width: 8, 
                        borderRadius: 1,
                        minHeight: 2
                      }} />
                    </Box>
                    <Typography variant="caption" sx={{ transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                      {data.timestamp}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Chip size="small" label="CPU" sx={{ bgcolor: 'primary.main', color: 'white' }} />
                <Chip size="small" label="Memory" sx={{ bgcolor: 'secondary.main', color: 'white' }} />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Alerts Table */}
        {alerts.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Alerts
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Severity</TableCell>
                      <TableCell>Metric</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Chip
                            label={alert.severity}
                            color={alert.severity === 'critical' ? 'error' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{alert.metric_name}</TableCell>
                        <TableCell>{alert.message}</TableCell>
                        <TableCell>
                          {new Date(alert.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">
                            Acknowledge
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {performanceStats && alerts.length === 0 && (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="textSecondary">
                  No active alerts - System is running smoothly
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
