'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Fade,
  alpha,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useRealTime } from '../contexts/RealTimeContext';
import { useSettings } from '../contexts/SettingsContext';

interface AnalyticsWidgetProps {
  title: string;
  subtitle?: string;
  height?: number;
  showControls?: boolean;
}

type ChartType = 'line' | 'area' | 'bar' | 'pie';
type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

export default function AnalyticsWidget({ 
  title, 
  subtitle, 
  height = 300,
  showControls = true 
}: AnalyticsWidgetProps) {
  const theme = useTheme();
  const { data: realTimeData } = useRealTime();
  const { settings } = useSettings();
  const [chartType, setChartType] = useState<ChartType>('area');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [animationKey, setAnimationKey] = useState(0);

  // Generate mock historical data
  const generateTimeSeriesData = (range: TimeRange) => {
    const points = range === '1h' ? 12 : range === '6h' ? 24 : range === '24h' ? 48 : range === '7d' ? 168 : 720;
    const interval = range === '1h' ? 5 : range === '6h' ? 15 : range === '24h' ? 30 : range === '7d' ? 60 : 60;
    
    return Array.from({ length: points }, (_, i) => {
      const time = new Date(Date.now() - (points - i) * interval * 60000);
      return {
        time: time.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          ...(range === '7d' || range === '30d' ? { month: 'short', day: 'numeric' } : {})
        }),
        calls: Math.floor(Math.random() * 50) + realTimeData.activeCalls,
        revenue: Math.floor(Math.random() * 1000) + 500,
        conversion: Math.random() * 30 + 15,
        users: Math.floor(Math.random() * 100) + realTimeData.activeUsers,
      };
    });
  };

  const [timeSeriesData, setTimeSeriesData] = useState(() => generateTimeSeriesData(timeRange));

  useEffect(() => {
    setTimeSeriesData(generateTimeSeriesData(timeRange));
    setAnimationKey(prev => prev + 1);
  }, [timeRange, realTimeData]);

  const pieData = [
    { name: 'Incoming Calls', value: 45, color: theme.palette.primary.main },
    { name: 'Outgoing Calls', value: 30, color: theme.palette.secondary.main },
    { name: 'Missed Calls', value: 15, color: theme.palette.warning.main },
    { name: 'Voicemails', value: 10, color: theme.palette.success.main },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ 
          p: 1.5, 
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(8px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography 
              key={index} 
              variant="body2" 
              sx={{ color: entry.color, fontWeight: 600 }}
            >
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Card>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: timeSeriesData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              axisLine={{ stroke: alpha(theme.palette.divider, 0.5) }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              axisLine={{ stroke: alpha(theme.palette.divider, 0.5) }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="calls" 
              stroke={theme.palette.primary.main}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: theme.palette.primary.main }}
              animationDuration={settings.animations ? 1500 : 0}
            />
            <Line 
              type="monotone" 
              dataKey="users" 
              stroke={theme.palette.secondary.main}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              animationDuration={settings.animations ? 1500 : 0}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              axisLine={{ stroke: alpha(theme.palette.divider, 0.5) }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              axisLine={{ stroke: alpha(theme.palette.divider, 0.5) }}
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="calls" 
              stroke={theme.palette.primary.main}
              fillOpacity={1}
              fill="url(#callsGradient)"
              strokeWidth={2}
              animationDuration={settings.animations ? 1500 : 0}
            />
            <Area 
              type="monotone" 
              dataKey="users" 
              stroke={theme.palette.secondary.main}
              fillOpacity={1}
              fill="url(#usersGradient)"
              strokeWidth={2}
              animationDuration={settings.animations ? 1500 : 0}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              axisLine={{ stroke: alpha(theme.palette.divider, 0.5) }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              axisLine={{ stroke: alpha(theme.palette.divider, 0.5) }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="calls" 
              fill={theme.palette.primary.main}
              radius={[4, 4, 0, 0]}
              animationDuration={settings.animations ? 1500 : 0}
            />
            <Bar 
              dataKey="users" 
              fill={theme.palette.secondary.main}
              radius={[4, 4, 0, 0]}
              animationDuration={settings.animations ? 1500 : 0}
            />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart width={400} height={300}>
            <Pie
              data={pieData}
              cx={200}
              cy={150}
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
              animationDuration={settings.animations ? 1500 : 0}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: settings.animations ? 'translateY(-2px)' : 'none',
          boxShadow: `0 12px 48px ${alpha(theme.palette.common.black, 0.12)}`,
        }
      }}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={600} color="text.primary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          
          {showControls && (
            <Box display="flex" gap={1} flexDirection="column" alignItems="flex-end">
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={(_, value) => value && setChartType(value)}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    '&.Mui-selected': {
                      background: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                    }
                  }
                }}
              >
                <ToggleButton value="area">Area</ToggleButton>
                <ToggleButton value="line">Line</ToggleButton>
                <ToggleButton value="bar">Bar</ToggleButton>
                <ToggleButton value="pie">Pie</ToggleButton>
              </ToggleButtonGroup>
              
              <ToggleButtonGroup
                value={timeRange}
                exclusive
                onChange={(_, value) => value && setTimeRange(value)}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    fontSize: '0.75rem',
                    px: 1,
                    '&.Mui-selected': {
                      background: theme.palette.secondary.main,
                      color: theme.palette.secondary.contrastText,
                    }
                  }
                }}
              >
                <ToggleButton value="1h">1H</ToggleButton>
                <ToggleButton value="6h">6H</ToggleButton>
                <ToggleButton value="24h">24H</ToggleButton>
                <ToggleButton value="7d">7D</ToggleButton>
                <ToggleButton value="30d">30D</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}
        </Box>

        <Box flex={1} position="relative">
          <Fade in={true} key={animationKey} timeout={500}>
            <Box height={height}>
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </Box>
          </Fade>
        </Box>

        {chartType === 'pie' && (
          <Box display="flex" justifyContent="center" gap={2} mt={2} flexWrap="wrap">
            {pieData.map((entry, index) => (
              <Box key={index} display="flex" alignItems="center" gap={0.5}>
                <Box 
                  width={12} 
                  height={12} 
                  bgcolor={entry.color} 
                  borderRadius="50%" 
                />
                <Typography variant="caption" color="text.secondary">
                  {entry.name}: {entry.value}%
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
