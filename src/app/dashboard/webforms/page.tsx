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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  Avatar,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Fab,
  SpeedDial,
  SpeedDialAction,
  Grow,
  Fade,
  Slide,
  Switch,
  FormControlLabel,
  Badge,
  Skeleton
} from '@mui/material';
import { Grid } from '../../../components/FixedGrid';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  Web as WebIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Insights as InsightsIcon,
  TrendingUp as TrendingUpIcon,
  PeopleAlt as PeopleIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Launch as LaunchIcon,
  Refresh as RefreshIcon
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
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

// Enhanced interfaces
interface Webform {
  id: string;
  name: string;
  tracking_id: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
  views: number;
  submissions: number;
  conversion_rate: number;
  fields: FormField[];
  settings: FormSettings;
  analytics: FormAnalytics;
}

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox' | 'radio';
  label: string;
  required: boolean;
  validation: any;
}

interface FormSettings {
  theme: 'light' | 'dark' | 'custom';
  redirect_url?: string;
  notification_email?: string;
  captcha_enabled: boolean;
  auto_response: boolean;
}

interface FormAnalytics {
  daily_views: number[];
  daily_submissions: number[];
  top_sources: { source: string; count: number }[];
  field_completion_rates: { field: string; rate: number }[];
}

interface FormSubmission {
  id: string;
  form_id: string;
  data: Record<string, any>;
  submitted_at: string;
  source: string;
  user_agent: string;
  ip_address: string;
}

// Mock data
const mockWebforms: Webform[] = [
  {
    id: '1',
    name: 'Contact Us Form',
    tracking_id: 'contact-form-2024',
    description: 'Primary contact form for customer inquiries and support requests',
    status: 'active',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-03-10T14:22:00Z',
    views: 15420,
    submissions: 892,
    conversion_rate: 5.8,
    fields: [
      { id: '1', type: 'text', label: 'Full Name', required: true, validation: {} },
      { id: '2', type: 'email', label: 'Email Address', required: true, validation: {} },
      { id: '3', type: 'phone', label: 'Phone Number', required: false, validation: {} },
      { id: '4', type: 'textarea', label: 'Message', required: true, validation: {} }
    ],
    settings: {
      theme: 'light',
      redirect_url: '/thank-you',
      notification_email: 'admin@company.com',
      captcha_enabled: true,
      auto_response: true
    },
    analytics: {
      daily_views: [120, 150, 89, 200, 180, 160, 140],
      daily_submissions: [8, 12, 6, 15, 11, 9, 7],
      top_sources: [
        { source: 'Direct', count: 450 },
        { source: 'Google', count: 320 },
        { source: 'Social Media', count: 122 }
      ],
      field_completion_rates: [
        { field: 'Full Name', rate: 98 },
        { field: 'Email', rate: 95 },
        { field: 'Phone', rate: 78 },
        { field: 'Message', rate: 92 }
      ]
    }
  },
  {
    id: '2',
    name: 'Newsletter Signup',
    tracking_id: 'newsletter-2024',
    description: 'Email subscription form for marketing campaigns and updates',
    status: 'active',
    created_at: '2024-02-01T09:15:00Z',
    updated_at: '2024-03-12T11:45:00Z',
    views: 8930,
    submissions: 2140,
    conversion_rate: 24.0,
    fields: [
      { id: '1', type: 'email', label: 'Email Address', required: true, validation: {} },
      { id: '2', type: 'checkbox', label: 'Marketing Consent', required: true, validation: {} }
    ],
    settings: {
      theme: 'custom',
      captcha_enabled: false,
      auto_response: true
    },
    analytics: {
      daily_views: [80, 95, 110, 120, 105, 90, 85],
      daily_submissions: [25, 30, 35, 40, 32, 28, 24],
      top_sources: [
        { source: 'Blog', count: 890 },
        { source: 'Homepage', count: 650 },
        { source: 'Email', count: 400 }
      ],
      field_completion_rates: [
        { field: 'Email', rate: 97 },
        { field: 'Consent', rate: 89 }
      ]
    }
  },
  {
    id: '3',
    name: 'Product Demo Request',
    tracking_id: 'demo-request-form',
    description: 'Lead generation form for product demonstrations and sales inquiries',
    status: 'draft',
    created_at: '2024-03-01T14:20:00Z',
    updated_at: '2024-03-14T16:30:00Z',
    views: 245,
    submissions: 18,
    conversion_rate: 7.3,
    fields: [
      { id: '1', type: 'text', label: 'Company Name', required: true, validation: {} },
      { id: '2', type: 'text', label: 'Full Name', required: true, validation: {} },
      { id: '3', type: 'email', label: 'Work Email', required: true, validation: {} },
      { id: '4', type: 'select', label: 'Company Size', required: false, validation: {} },
      { id: '5', type: 'textarea', label: 'Requirements', required: false, validation: {} }
    ],
    settings: {
      theme: 'dark',
      redirect_url: '/demo-scheduled',
      notification_email: 'sales@company.com',
      captcha_enabled: true,
      auto_response: false
    },
    analytics: {
      daily_views: [12, 18, 15, 22, 19, 16, 14],
      daily_submissions: [1, 3, 2, 4, 3, 2, 3],
      top_sources: [
        { source: 'Landing Page', count: 180 },
        { source: 'Google Ads', count: 45 },
        { source: 'LinkedIn', count: 20 }
      ],
      field_completion_rates: [
        { field: 'Company', rate: 95 },
        { field: 'Name', rate: 92 },
        { field: 'Email', rate: 88 },
        { field: 'Size', rate: 65 },
        { field: 'Requirements', rate: 78 }
      ]
    }
  }
];

const chartColors = ['#1976d2', '#dc004e', '#ed6c02', '#2e7d32', '#9c27b0', '#00695c'];

const conversionFunnelData = [
  { name: 'Page Views', value: 15420, fill: '#1976d2' },
  { name: 'Form Started', value: 2841, fill: '#dc004e' },
  { name: 'Form Completed', value: 892, fill: '#2e7d32' }
];

const submissionTrendData = [
  { date: 'Mon', submissions: 45, views: 890 },
  { date: 'Tue', submissions: 52, views: 1020 },
  { date: 'Wed', submissions: 38, views: 756 },
  { date: 'Thu', submissions: 61, views: 1180 },
  { date: 'Fri', submissions: 48, views: 932 },
  { date: 'Sat', submissions: 29, views: 567 },
  { date: 'Sun', submissions: 33, views: 645 }
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

// WebformCard component
const WebformCard = ({ form, onEdit, onView, onShare, onAnalytics, onDelete }: {
  form: Webform;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onShare: (id: string) => void;
  onAnalytics: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#2e7d32';
      case 'draft': return '#ed6c02';
      case 'archived': return '#757575';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />;
      case 'draft': return <WarningIcon />;
      case 'archived': return <ErrorIcon />;
      default: return <ErrorIcon />;
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
            border: `2px solid ${getStatusColor(form.status)}40`,
          }
        }}
      >
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: `${getStatusColor(form.status)}20`, color: getStatusColor(form.status) }}>
              <WebIcon />
            </Avatar>
          }
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                size="small"
                icon={getStatusIcon(form.status)}
                label={form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                sx={{
                  bgcolor: `${getStatusColor(form.status)}20`,
                  color: getStatusColor(form.status),
                  fontWeight: 600
                }}
              />
            </Box>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {form.name}
            </Typography>
          }
          subheader={
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              ID: {form.tracking_id}
            </Typography>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
            {form.description}
          </Typography>
          
          {/* Key Metrics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
                  {form.views.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Views
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                  {form.submissions.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Submissions
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ed6c02' }}>
                  {form.conversion_rate}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Conversion
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Form Details */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Form Details:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              <Chip size="small" label={`${form.fields.length} fields`} variant="outlined" />
              <Chip size="small" label={form.settings.theme} variant="outlined" />
              {form.settings.captcha_enabled && (
                <Chip size="small" label="CAPTCHA" variant="outlined" color="primary" />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Updated: {new Date(form.updated_at).toLocaleDateString()}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<ViewIcon />}
              onClick={() => onView(form.id)}
              sx={{ flex: 1, minWidth: 'auto' }}
            >
              View
            </Button>
            <IconButton size="small" onClick={() => onEdit(form.id)}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={() => onAnalytics(form.id)}>
              <AnalyticsIcon />
            </IconButton>
            <IconButton size="small" onClick={() => onShare(form.id)}>
              <ShareIcon />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(form.id)} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default function WebformsPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webforms, setWebforms] = useState<Webform[]>([]);
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Webform | null>(null);
  const [shareDialog, setShareDialog] = useState(false);

  // Enhanced webform tracking features
  const [trackingScript, setTrackingScript] = useState('');
  const [analyticsData, setAnalyticsData] = useState({});
  const [analytics, setAnalytics] = useState({
    total_views: 0,
    total_submissions: 0,
    conversion_rate: 0,
    spam_blocked: 0
  });
  const [utmData, setUtmData] = useState({});
  const [spamSettings, setSpamSettings] = useState({
    honeypot_enabled: true,
    recaptcha_enabled: false,
    rate_limiting: true
  });

  const fetchWebformsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/webforms');
      if (!response.ok) {
        throw new Error(`Failed to fetch webforms data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setWebforms(data.webforms || []);
    } catch (err) {
      console.error('Error fetching webforms data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch webforms data');
      
      // Fallback to mock data on error
      setWebforms(mockWebforms);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebformsData();
    
    // Set up auto-refresh every 60 seconds
    const interval = setInterval(fetchWebformsData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleEdit = (formId: string) => {
    console.log('Edit form:', formId);
  };

  const handleView = (formId: string) => {
    window.open(`/form/${formId}`, '_blank');
  };

  const handleShare = (formId: string) => {
    const form = webforms.find(f => f.id === formId);
    if (form) {
      setSelectedForm(form);
      setShareDialog(true);
    }
  };

  const handleAnalytics = (formId: string) => {
    setSelectedTab(1); // Switch to analytics tab
  };

  const handleDelete = (formId: string) => {
    setWebforms(prev => prev.filter(f => f.id !== formId));
  };

  const totalViews = webforms.reduce((sum, form) => sum + form.views, 0);
  const totalSubmissions = webforms.reduce((sum, form) => sum + form.submissions, 0);
  const avgConversion = webforms.reduce((sum, form) => sum + form.conversion_rate, 0) / webforms.length;
  const activeForms = webforms.filter(f => f.status === 'active').length;

  // Fetch tracking analytics
  const fetchAnalytics = async (formId) => {
    try {
      const response = await fetch(`/api/webforms/analytics?formId=${formId}`);
      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // Generate tracking script
  const generateTrackingScript = (workspaceId) => {
    const script = `<!-- Locall Webform Tracker -->
<script src="${window.location.origin}/js/locall-tracker.js" 
        data-workspace-id="${workspaceId}"
        data-enable-spam-protection="true"
        data-track-utm="true">
</script>

<!-- Or manual initialization -->
<script>
  window.LocallTracker.init({
    workspaceId: '${workspaceId}',
    apiEndpoint: '${window.location.origin}/api',
    enableSpamProtection: true,
    trackUtmParams: true,
    enableHeatmaps: false,
    debug: false
  });
</script>`;
    
    setTrackingScript(script);
  };

  const handleSpamSettingsChange = (newSettings) => {
    setSpamSettings(newSettings);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, background: 'linear-gradient(45deg, #1976d2, #9c27b0)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          📝 Webforms Studio
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>
          Create, manage, and analyze your web forms with advanced insights
        </Typography>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchWebformsData}>
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
            title="Active Forms"
            value={activeForms}
            subtitle={`${webforms.length} total forms`}
            icon={<WebIcon />}
            color="#1976d2"
            trend={{ value: 15, direction: 'up' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Views"
            value={totalViews.toLocaleString()}
            subtitle="This month"
            icon={<AnalyticsIcon />}
            color="#2e7d32"
            trend={{ value: 12, direction: 'up' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Submissions"
            value={totalSubmissions.toLocaleString()}
            subtitle="All time"
            icon={<PeopleIcon />}
            color="#ed6c02"
            trend={{ value: 8, direction: 'up' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg. Conversion"
            value={`${avgConversion.toFixed(1)}%`}
            subtitle="Across all forms"
            icon={<TrendingUpIcon />}
            color="#9c27b0"
            trend={{ value: 3.2, direction: 'up' }}
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
          <Tab icon={<WebIcon />} label="All Forms" />
          <Tab icon={<AnalyticsIcon />} label="Analytics" />
          <Tab icon={<TimelineIcon />} label="Submissions" />
          <Tab icon={<SettingsIcon />} label="Settings" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Tab 0: All Forms */}
          {selectedTab === 0 && (
            <Grid container spacing={3}>
              {webforms.map((form) => (
                <Grid item xs={12} md={6} lg={4} key={form.id}>
                  <WebformCard
                    form={form}
                    onEdit={handleEdit}
                    onView={handleView}
                    onShare={handleShare}
                    onAnalytics={handleAnalytics}
                    onDelete={handleDelete}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {/* Tab 1: Analytics */}
          {selectedTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Submission Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={submissionTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip />
                      <Area type="monotone" dataKey="submissions" stroke="#1976d2" fill="#1976d240" strokeWidth={3} />
                      <Area type="monotone" dataKey="views" stroke="#2e7d32" fill="#2e7d3240" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
                <Card sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Form Performance Comparison
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={webforms}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip />
                      <Bar dataKey="conversion_rate" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Card sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Conversion Funnel
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <FunnelChart>
                      <Funnel
                        dataKey="value"
                        data={conversionFunnelData}
                        isAnimationActive
                      >
                        <LabelList position="center" fill="#fff" stroke="none" />
                      </Funnel>
                      <ChartTooltip />
                    </FunnelChart>
                  </ResponsiveContainer>
                </Card>
                <Card sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Top Performing Forms
                  </Typography>
                  <List>
                    {webforms
                      .sort((a, b) => b.conversion_rate - a.conversion_rate)
                      .slice(0, 3)
                      .map((form, index) => (
                        <ListItem key={form.id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: chartColors[index], width: 32, height: 32, fontSize: '0.875rem' }}>
                              {index + 1}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={form.name}
                            secondary={`${form.conversion_rate}% conversion`}
                          />
                        </ListItem>
                      ))}
                  </List>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tab 2: Submissions */}
          {selectedTab === 2 && (
            <Card sx={{ borderRadius: 2 }}>
              <CardHeader
                title="Recent Submissions"
                subheader="Latest form submissions across all forms"
                action={
                  <Button startIcon={<DownloadIcon />} variant="outlined" size="small">
                    Export CSV
                  </Button>
                }
              />
              <Divider />
              <Box sx={{ p: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  Submission data would be displayed here with real-time updates and filtering options.
                </Typography>
              </Box>
            </Card>
          )}

          {/* Tab 3: Settings */}
          {selectedTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Global Settings
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Email notifications"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="CAPTCHA protection"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Auto-archive old forms"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Analytics tracking"
                    />
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Integration Settings
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Webhook URL"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value="https://api.yourapp.com/webhooks/forms"
                    />
                    <TextField
                      label="Default Notification Email"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value="admin@company.com"
                    />
                    <Button variant="outlined" startIcon={<CodeIcon />}>
                      API Documentation
                    </Button>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create form"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => setCreateDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Create Form Dialog */}
      <Dialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Webform</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Form Name"
              variant="outlined"
              fullWidth
              placeholder="Enter a descriptive name for your form"
            />
            <TextField
              label="Description"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              placeholder="Describe the purpose of this form"
            />
            <FormControl fullWidth>
              <InputLabel>Template</InputLabel>
              <Select defaultValue="">
                <MenuItem value="contact">Contact Form</MenuItem>
                <MenuItem value="newsletter">Newsletter Signup</MenuItem>
                <MenuItem value="survey">Survey Form</MenuItem>
                <MenuItem value="custom">Custom Form</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => setCreateDialog(false)}>
            Create Form
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialog}
        onClose={() => setShareDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Share Form: {selectedForm?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Form URL"
              variant="outlined"
              fullWidth
              value={`https://yourapp.com/form/${selectedForm?.tracking_id}`}
              InputProps={{
                endAdornment: (
                  <IconButton>
                    <CopyIcon />
                  </IconButton>
                )
              }}
            />
            <TextField
              label="Embed Code"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              value={`<iframe src="https://yourapp.com/form/${selectedForm?.tracking_id}" width="100%" height="500"></iframe>`}
              InputProps={{
                endAdornment: (
                  <IconButton>
                    <CopyIcon />
                  </IconButton>
                )
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<QrCodeIcon />} fullWidth>
                Generate QR Code
              </Button>
              <Button variant="outlined" startIcon={<LaunchIcon />} fullWidth>
                Preview Form
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* UTM Tracking Card */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="UTM Parameter Analysis" 
          subheader="Traffic source attribution"
        />
        <CardContent>
          {Object.keys(utmData).length === 0 ? (
            <Alert severity="info">
              No UTM parameters tracked yet. Ensure the tracking script is installed.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {Object.entries(utmData).map(([param, values]) => (
                <Grid item xs={12} md={6} key={param}>
                  <Typography variant="h6" gutterBottom>
                    {param.replace('utm_', '').toUpperCase()}
                  </Typography>
                  <List dense>
                    {Object.entries(values).map(([value, count]) => (
                      <ListItem key={value}>
                        <ListItemText 
                          primary={value} 
                          secondary={`${count} submissions`}
                        />
                        <ListItemSecondaryAction>
                          <Chip size="small" label={count} />
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Spam Protection Settings Component */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Spam Protection" 
          subheader="Configure anti-spam measures"
        />
        <CardContent>
          <FormControlLabel
            control={
              <Switch 
                checked={spamSettings.honeypot_enabled}
                onChange={(e) => handleSpamSettingsChange({ ...spamSettings, honeypot_enabled: e.target.checked })}
              />
            }
            label="Honeypot Fields"
          />
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Automatically add hidden fields to detect bot submissions
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={spamSettings.recaptcha_enabled}
                onChange={(e) => handleSpamSettingsChange({ ...spamSettings, recaptcha_enabled: e.target.checked })}
              />
            }
            label="reCAPTCHA Protection"
          />
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Require human verification for form submissions
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={spamSettings.rate_limiting}
                onChange={(e) => handleSpamSettingsChange({ ...spamSettings, rate_limiting: e.target.checked })}
              />
            }
            label="Rate Limiting"
          />
          <Typography variant="body2" color="textSecondary">
            Limit submission frequency from the same IP address
          </Typography>
        </CardContent>
      </Card>

      {/* Analytics Overview Component */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Form Analytics" 
          subheader="Performance metrics and insights"
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {analytics.total_views || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Form Views
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {analytics.total_submissions || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Submissions
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {((analytics.conversion_rate || 0) * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Conversion Rate
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {analytics.spam_blocked || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Spam Blocked
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
}
