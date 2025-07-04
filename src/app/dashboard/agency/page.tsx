'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Fab,
  Badge,
  Alert,
  LinearProgress,
} from '@mui/material';
import { Grid } from '../../../components/FixedGrid';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
  PhoneInTalk as CallIcon,
  Email as EmailIcon,
  Assessment as ReportIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

// Types for Agency Dashboard
interface Agency {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  plan: 'starter' | 'professional' | 'enterprise';
  created: string;
  lastActivity: string;
  totalClients: number;
  monthlyRevenue: number;
  callVolume: number;
  complianceScore: number;
  owner: {
    name: string;
    email: string;
    phone: string;
  };
  billing: {
    status: 'current' | 'overdue' | 'cancelled';
    nextPayment: string;
    amount: number;
  };
  features: {
    whiteLabel: boolean;
    customDomain: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
  };
}

interface AgencyMetrics {
  totalAgencies: number;
  activeAgencies: number;
  monthlyRevenue: number;
  averageCallVolume: number;
  complianceIssues: number;
  newSignups: number;
  churnRate: number;
  supportTickets: number;
}

// Mock data
const mockAgencies: Agency[] = [
  {
    id: 'ag_001',
    name: 'TechCall Solutions',
    domain: 'techcall.locall.io',
    status: 'active',
    plan: 'enterprise',
    created: '2024-01-15',
    lastActivity: '2024-01-20',
    totalClients: 45,
    monthlyRevenue: 12500,
    callVolume: 8950,
    complianceScore: 98,
    owner: {
      name: 'Sarah Johnson',
      email: 'sarah@techcall.com',
      phone: '+1-555-0123'
    },
    billing: {
      status: 'current',
      nextPayment: '2024-02-15',
      amount: 1250
    },
    features: {
      whiteLabel: true,
      customDomain: true,
      apiAccess: true,
      prioritySupport: true
    }
  },
  {
    id: 'ag_002',
    name: 'Sales Boost Agency',
    domain: 'salesboost.locall.io',
    status: 'active',
    plan: 'professional',
    created: '2024-01-08',
    lastActivity: '2024-01-19',
    totalClients: 28,
    monthlyRevenue: 7800,
    callVolume: 5240,
    complianceScore: 92,
    owner: {
      name: 'Mike Chen',
      email: 'mike@salesboost.com',
      phone: '+1-555-0456'
    },
    billing: {
      status: 'current',
      nextPayment: '2024-02-08',
      amount: 780
    },
    features: {
      whiteLabel: true,
      customDomain: false,
      apiAccess: true,
      prioritySupport: true
    }
  },
  {
    id: 'ag_003',
    name: 'Local Connect',
    domain: 'connect.locall.io',
    status: 'pending',
    plan: 'starter',
    created: '2024-01-18',
    lastActivity: '2024-01-18',
    totalClients: 8,
    monthlyRevenue: 0,
    callVolume: 120,
    complianceScore: 85,
    owner: {
      name: 'Emma Davis',
      email: 'emma@localconnect.com',
      phone: '+1-555-0789'
    },
    billing: {
      status: 'current',
      nextPayment: '2024-02-18',
      amount: 99
    },
    features: {
      whiteLabel: false,
      customDomain: false,
      apiAccess: false,
      prioritySupport: false
    }
  }
];

const mockMetrics: AgencyMetrics = {
  totalAgencies: 24,
  activeAgencies: 21,
  monthlyRevenue: 89750,
  averageCallVolume: 4580,
  complianceIssues: 3,
  newSignups: 8,
  churnRate: 2.1,
  supportTickets: 12
};

const AgencyMetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  trend 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; direction: 'up' | 'down' };
}) => (
  <Card
    sx={{
      background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
      border: `2px solid ${color}30`,
      borderRadius: 3,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 24px ${color}20`,
      },
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: color }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ color: color, fontSize: '2.5rem' }}>
          {icon}
        </Box>
      </Box>
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon 
            sx={{ 
              color: trend.direction === 'up' ? '#2e7d32' : '#d32f2f', 
              fontSize: 16,
              transform: trend.direction === 'down' ? 'rotate(180deg)' : 'none'
            }} 
          />
          <Typography variant="body2" sx={{ color: trend.direction === 'up' ? '#2e7d32' : '#d32f2f' }}>
            {trend.direction === 'up' ? '+' : ''}{trend.value}%
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            vs last month
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return '#2e7d32';
    case 'inactive': return '#757575';
    case 'suspended': return '#d32f2f';
    case 'pending': return '#ed6c02';
    default: return '#757575';
  }
};

const getPlanColor = (plan: string) => {
  switch (plan) {
    case 'starter': return '#1976d2';
    case 'professional': return '#9c27b0';
    case 'enterprise': return '#f57c00';
    default: return '#757575';
  }
};

const getBillingStatusColor = (status: string) => {
  switch (status) {
    case 'current': return '#2e7d32';
    case 'overdue': return '#d32f2f';
    case 'cancelled': return '#757575';
    default: return '#757575';
  }
};

export default function AgencyDashboard() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [metrics, setMetrics] = useState<AgencyMetrics | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgencyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/agency');
      if (!response.ok) {
        throw new Error(`Failed to fetch agency data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setAgencies(data.agencies || []);
      setMetrics(data.metrics);
    } catch (err) {
      console.error('Error fetching agency data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch agency data');
      
      // Fallback to mock data on error
      setAgencies(mockAgencies);
      setMetrics(mockMetrics);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencyData();
    
    // Set up auto-refresh every 60 seconds for agency data
    const interval = setInterval(fetchAgencyData, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredAgencies = agencies.filter(agency => {
    const statusMatch = filterStatus === 'all' || agency.status === filterStatus;
    const planMatch = filterPlan === 'all' || agency.plan === filterPlan;
    return statusMatch && planMatch;
  });

  const handleViewAgency = (agency: Agency) => {
    setSelectedAgency(agency);
    setDialogOpen(true);
  };

  const handleStatusChange = async (agencyId: string, newStatus: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setAgencies(prev => prev.map(agency => 
      agency.id === agencyId 
        ? { ...agency, status: newStatus as Agency['status'] }
        : agency
    ));
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
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
          🏢 Agency Dashboard
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          Manage and monitor your agency partners
        </Typography>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchAgencyData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <AgencyMetricCard
            title="Total Agencies"
            value={metrics ? metrics.totalAgencies : '--'}
            subtitle={metrics ? `${metrics.activeAgencies} active` : '--'}
            icon={<BusinessIcon />}
            color="#1976d2"
            trend={{ value: 12.5, direction: 'up' }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <AgencyMetricCard
            title="Monthly Revenue"
            value={metrics ? formatCurrency(metrics.monthlyRevenue) : '--'}
            subtitle="From all agencies"
            icon={<PaymentIcon />}
            color="#2e7d32"
            trend={{ value: 8.3, direction: 'up' }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <AgencyMetricCard
            title="Avg Call Volume"
            value={metrics ? formatNumber(metrics.averageCallVolume) : '--'}
            subtitle="Per agency/month"
            icon={<CallIcon />}
            color="#9c27b0"
            trend={{ value: 5.7, direction: 'up' }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <AgencyMetricCard
            title="Compliance Issues"
            value={metrics ? metrics.complianceIssues : '--'}
            subtitle="Require attention"
            icon={<WarningIcon />}
            color="#d32f2f"
            trend={{ value: 2.1, direction: 'down' }}
          />
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Plan</InputLabel>
                <Select
                  value={filterPlan}
                  label="Plan"
                  onChange={(e) => setFilterPlan(e.target.value)}
                >
                  <MenuItem value="all">All Plans</MenuItem>
                  <MenuItem value="starter">Starter</MenuItem>
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<ReportIcon />}>
                Export Report
              </Button>
              <Button variant="contained" startIcon={<AddIcon />}>
                Add Agency
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Agencies Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell><strong>Agency</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Plan</strong></TableCell>
                  <TableCell><strong>Clients</strong></TableCell>
                  <TableCell><strong>Revenue</strong></TableCell>
                  <TableCell><strong>Calls</strong></TableCell>
                  <TableCell><strong>Compliance</strong></TableCell>
                  <TableCell><strong>Billing</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAgencies.map((agency) => (
                  <TableRow key={agency.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {agency.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {agency.domain}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {agency.owner.name} • {agency.owner.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={agency.status.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: `${getStatusColor(agency.status)}20`,
                          color: getStatusColor(agency.status),
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={agency.plan.toUpperCase()}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: getPlanColor(agency.plan),
                          color: getPlanColor(agency.plan),
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {agency.totalClients}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                        {formatCurrency(agency.monthlyRevenue)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {formatNumber(agency.callVolume)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">
                          {agency.complianceScore}%
                        </Typography>
                        {agency.complianceScore >= 95 ? (
                          <CheckIcon sx={{ color: '#2e7d32', fontSize: 16 }} />
                        ) : agency.complianceScore >= 90 ? (
                          <WarningIcon sx={{ color: '#ed6c02', fontSize: 16 }} />
                        ) : (
                          <WarningIcon sx={{ color: '#d32f2f', fontSize: 16 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={agency.billing.status.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: `${getBillingStatusColor(agency.billing.status)}20`,
                          color: getBillingStatusColor(agency.billing.status),
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewAgency(agency)}
                            sx={{ color: '#1976d2' }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" sx={{ color: '#ed6c02' }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Settings">
                          <IconButton size="small" sx={{ color: '#9c27b0' }}>
                            <SettingsIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Agency Details Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BusinessIcon />
            <Typography variant="h6">
              {selectedAgency?.name}
            </Typography>
            <Chip
              label={selectedAgency?.status.toUpperCase()}
              size="small"
              sx={{
                backgroundColor: `${getStatusColor(selectedAgency?.status || '')}20`,
                color: getStatusColor(selectedAgency?.status || ''),
                fontWeight: 600
              }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAgency && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography><strong>Domain:</strong> {selectedAgency.domain}</Typography>
                    <Typography><strong>Plan:</strong> {selectedAgency.plan}</Typography>
                    <Typography><strong>Created:</strong> {selectedAgency.created}</Typography>
                    <Typography><strong>Last Activity:</strong> {selectedAgency.lastActivity}</Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Owner Information</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography><strong>Name:</strong> {selectedAgency.owner.name}</Typography>
                    <Typography><strong>Email:</strong> {selectedAgency.owner.email}</Typography>
                    <Typography><strong>Phone:</strong> {selectedAgency.owner.phone}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Performance Metrics</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography><strong>Total Clients:</strong> {selectedAgency.totalClients}</Typography>
                    <Typography><strong>Monthly Revenue:</strong> {formatCurrency(selectedAgency.monthlyRevenue)}</Typography>
                    <Typography><strong>Call Volume:</strong> {formatNumber(selectedAgency.callVolume)}</Typography>
                    <Typography><strong>Compliance Score:</strong> {selectedAgency.complianceScore}%</Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Features</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={<Switch checked={selectedAgency.features.whiteLabel} disabled />}
                      label="White Label"
                    />
                    <FormControlLabel
                      control={<Switch checked={selectedAgency.features.customDomain} disabled />}
                      label="Custom Domain"
                    />
                    <FormControlLabel
                      control={<Switch checked={selectedAgency.features.apiAccess} disabled />}
                      label="API Access"
                    />
                    <FormControlLabel
                      control={<Switch checked={selectedAgency.features.prioritySupport} disabled />}
                      label="Priority Support"
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Billing Information</Typography>
                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <Typography><strong>Status:</strong> 
                      <Chip
                        label={selectedAgency.billing.status.toUpperCase()}
                        size="small"
                        sx={{
                          ml: 1,
                          backgroundColor: `${getBillingStatusColor(selectedAgency.billing.status)}20`,
                          color: getBillingStatusColor(selectedAgency.billing.status),
                          fontWeight: 600
                        }}
                      />
                    </Typography>
                    <Typography><strong>Next Payment:</strong> {selectedAgency.billing.nextPayment}</Typography>
                    <Typography><strong>Amount:</strong> {formatCurrency(selectedAgency.billing.amount)}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
          <Button variant="contained">
            Edit Agency
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Actions FAB */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
}
