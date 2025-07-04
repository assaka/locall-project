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
  LinearProgress
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
  Error as ErrorIcon
} from '@mui/icons-material';
import Link from 'next/link';

interface SystemStatus {
  integrations: {
    total: number;
    active: number;
    errors: number;
  };
  loyalty: {
    total_programs: number;
    active_codes: number;
    total_referrals: number;
    fraud_alerts: number;
  };
  webforms: {
    total_forms: number;
    total_submissions: number;
    spam_blocked: number;
    conversion_rate: number;
  };
  billing: {
    active_subscriptions: number;
    monthly_revenue: number;
    payment_failures: number;
    usage_alerts: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'integration' | 'loyalty' | 'webform' | 'billing' | 'security';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load system status data
      await loadSystemStatus();
      await loadRecentActivity();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStatus = async () => {
    // Mock system status data
    setSystemStatus({
      integrations: {
        total: 3,
        active: 2,
        errors: 1
      },
      loyalty: {
        total_programs: 5,
        active_codes: 23,
        total_referrals: 156,
        fraud_alerts: 3
      },
      webforms: {
        total_forms: 8,
        total_submissions: 1269,
        spam_blocked: 113,
        conversion_rate: 85.2
      },
      billing: {
        active_subscriptions: 47,
        monthly_revenue: 12450,
        payment_failures: 2,
        usage_alerts: 1
      }
    });
  };

  const loadRecentActivity = async () => {
    // Mock recent activity data
    setRecentActivity([
      {
        id: '1',
        type: 'security',
        message: 'High fraud score detected in referral system (Score: 0.89)',
        timestamp: '2024-03-15T14:30:00Z',
        severity: 'error'
      },
      {
        id: '2',
        type: 'billing',
        message: 'Payment failed for subscription sub_1234567890',
        timestamp: '2024-03-15T14:25:00Z',
        severity: 'warning'
      },
      {
        id: '3',
        type: 'integration',
        message: 'HubSpot integration successfully synced 45 contacts',
        timestamp: '2024-03-15T14:20:00Z',
        severity: 'success'
      },
      {
        id: '4',
        type: 'webform',
        message: 'Spam submission blocked from IP 192.168.1.100',
        timestamp: '2024-03-15T14:15:00Z',
        severity: 'info'
      },
      {
        id: '5',
        type: 'loyalty',
        message: 'New loyalty program "Spring Campaign" activated',
        timestamp: '2024-03-15T14:10:00Z',
        severity: 'success'
      }
    ]);
  };

  const getStatusColor = (type: string, value: number, total: number) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    if (type === 'errors' || type === 'fraud' || type === 'failures') {
      return percentage > 10 ? 'error' : percentage > 5 ? 'warning' : 'success';
    }
    return percentage > 80 ? 'success' : percentage > 50 ? 'warning' : 'error';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'success':
        return <CheckIcon color="success" />;
      default:
        return <AnalyticsIcon color="info" />;
    }
  };

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* System Status Cards */}
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <IntegrationIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Integrations</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {systemStatus?.integrations.active}/{systemStatus?.integrations.total}
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              Active Integrations
            </Typography>
            {systemStatus && systemStatus.integrations.errors > 0 && (
              <Chip 
                label={`${systemStatus.integrations.errors} Errors`}
                color="error"
                size="small"
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <LoyaltyIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Loyalty</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {systemStatus?.loyalty.total_referrals}
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              Total Referrals
            </Typography>
            {systemStatus && systemStatus.loyalty.fraud_alerts > 0 && (
              <Chip 
                label={`${systemStatus.loyalty.fraud_alerts} Fraud Alerts`}
                color="warning"
                size="small"
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <WebformIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Webforms</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {systemStatus?.webforms.conversion_rate}%
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              Conversion Rate
            </Typography>
            <Chip 
              label={`${systemStatus?.webforms.spam_blocked} Spam Blocked`}
              color="success"
              size="small"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <BillingIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Billing</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              ${systemStatus?.billing.monthly_revenue?.toLocaleString()}
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              Monthly Revenue
            </Typography>
            {systemStatus && systemStatus.billing.payment_failures > 0 && (
              <Chip 
                label={`${systemStatus.billing.payment_failures} Payment Failures`}
                color="error"
                size="small"
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Actions */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<IntegrationIcon />}
                  component={Link}
                  href="/dashboard/integrations"
                >
                  Manage Integrations
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<LoyaltyIcon />}
                  component={Link}
                  href="/dashboard/loyalty"
                >
                  Loyalty Programs
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<WebformIcon />}
                  component={Link}
                  href="/dashboard/webforms"
                >
                  Webform Analytics
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<BillingIcon />}
                  component={Link}
                  href="/dashboard/billing"
                >
                  Billing Dashboard
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Activity */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              {recentActivity.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getSeverityIcon(activity.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.message}
                      secondary={new Date(activity.timestamp).toLocaleString()}
                    />
                    <Chip
                      label={activity.type}
                      size="small"
                      variant="outlined"
                    />
                  </ListItem>
                  {index < recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* System Health */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Health
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Integration Success Rate
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemStatus ? (systemStatus.integrations.active / systemStatus.integrations.total) * 100 : 0}
                color="success"
              />
            </Box>
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Fraud Detection Rate
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemStatus ? ((systemStatus.webforms.spam_blocked / systemStatus.webforms.total_submissions) * 100) : 0}
                color="warning"
              />
            </Box>
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Payment Success Rate
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemStatus ? (((systemStatus.billing.active_subscriptions - systemStatus.billing.payment_failures) / systemStatus.billing.active_subscriptions) * 100) : 0}
                color="info"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAlerts = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        System Alerts
      </Typography>
      
      {systemStatus && systemStatus.loyalty.fraud_alerts > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Fraud Alert</Typography>
          {systemStatus.loyalty.fraud_alerts} high-risk referral activities detected. 
          <Button color="inherit" component={Link} href="/dashboard/loyalty">
            Review Now
          </Button>
        </Alert>
      )}

      {systemStatus && systemStatus.billing.payment_failures > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6">Payment Issues</Typography>
          {systemStatus.billing.payment_failures} payment failures require attention.
          <Button color="inherit" component={Link} href="/dashboard/billing">
            View Details
          </Button>
        </Alert>
      )}

      {systemStatus && systemStatus.integrations.errors > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Integration Errors</Typography>
          {systemStatus.integrations.errors} integration(s) experiencing issues.
          <Button color="inherit" component={Link} href="/dashboard/integrations">
            Fix Now
          </Button>
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="h6">System Status</Typography>
        All core systems are operational. Last health check: {new Date().toLocaleString()}
      </Alert>
    </Box>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading dashboard...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Monitor and manage all platform features
      </Typography>

      <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Overview" icon={<DashboardIcon />} />
        <Tab label="Alerts" icon={<SecurityIcon />} />
      </Tabs>

      {selectedTab === 0 && renderOverview()}
      {selectedTab === 1 && renderAlerts()}
    </Container>
  );
}
