'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Avatar,
  Stack,
  Divider,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
  Web as WebIcon,
  Payment as PaymentIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Grid as FixedGrid } from '@/components/FixedGrid';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalCalls: number;
    totalForms: number;
    totalRevenue: number;
    userGrowth: number;
    callGrowth: number;
    formGrowth: number;
    revenueGrowth: number;
  };
  timeline: {
    date: string;
    users: number;
    calls: number;
    forms: number;
    revenue: number;
  }[];
}

export default function AnalyticsPage() {
  const [currentTab, setCurrentTab] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      
      // Fallback to hardcoded data on error
      setAnalyticsData({
        overview: {
          totalUsers: 15847,
          totalCalls: 8934,
          totalForms: 2456,
          totalRevenue: 89750,
          userGrowth: 23.5,
          callGrowth: 18.2,
          formGrowth: 31.7,
          revenueGrowth: 15.8
        },
        timeline: [
          { date: '2024-01-01', users: 1200, calls: 450, forms: 120, revenue: 8500 },
          { date: '2024-01-02', users: 1350, calls: 520, forms: 145, revenue: 9200 },
          { date: '2024-01-03', users: 1180, calls: 480, forms: 132, revenue: 8800 },
          { date: '2024-01-04', users: 1450, calls: 580, forms: 168, revenue: 10200 },
          { date: '2024-01-05', users: 1620, calls: 650, forms: 195, revenue: 11500 },
          { date: '2024-01-06', users: 1580, calls: 620, forms: 188, revenue: 11200 },
          { date: '2024-01-07', users: 1750, calls: 720, forms: 220, revenue: 12800 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    
    // Set up auto-refresh every 30 seconds for real-time analytics
    const interval = setInterval(fetchAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const MetricCard = ({ 
    title, 
    value, 
    growth, 
    icon, 
    color = 'primary.main' 
  }: {
    title: string;
    value: string | number;
    growth?: number;
    icon: React.ReactNode;
    color?: string;
  }) => (
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
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
          {growth !== undefined && (
            <Chip
              icon={growth >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={`${growth >= 0 ? '+' : ''}${growth}%`}
              color={growth >= 0 ? 'success' : 'error'}
              size="small"
            />
          )}
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Advanced Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Deep insights and comprehensive reporting
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          <Button startIcon={<DownloadIcon />} variant="outlined">
            Export
          </Button>
          <Button startIcon={<RefreshIcon />} variant="contained" onClick={fetchAnalyticsData}>
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchAnalyticsData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Overview Metrics */}
      <FixedGrid container spacing={3} sx={{ mb: 4 }}>
        <FixedGrid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Users"
            value={analyticsData?.overview.totalUsers || 0}
            growth={analyticsData?.overview.userGrowth || 0}
            icon={<PeopleIcon />}
            color="primary.main"
          />
        </FixedGrid>
        <FixedGrid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Calls"
            value={analyticsData?.overview.totalCalls || 0}
            growth={analyticsData?.overview.callGrowth || 0}
            icon={<PhoneIcon />}
            color="success.main"
          />
        </FixedGrid>
        <FixedGrid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Forms"
            value={analyticsData?.overview.totalForms || 0}
            growth={analyticsData?.overview.formGrowth || 0}
            icon={<WebIcon />}
            color="warning.main"
          />
        </FixedGrid>
        <FixedGrid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Revenue"
            value={analyticsData?.overview.totalRevenue || 0}
            growth={analyticsData?.overview.revenueGrowth || 0}
            icon={<PaymentIcon />}
            color="error.main"
          />
        </FixedGrid>
      </FixedGrid>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label="Overview" icon={<AnalyticsIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Timeline Chart */}
          <FixedGrid container spacing={3}>
            <FixedGrid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Performance Timeline
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData?.timeline || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="calls" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#ffc658" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </FixedGrid>
          </FixedGrid>
        </Box>
      </Card>
    </Box>
  );
}
