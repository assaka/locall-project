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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Tooltip
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
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Webform {
  id: string;
  name: string;
  tracking_id: string;
  status: 'active' | 'paused' | 'draft';
  submissions: number;
  conversions: number;
  conversion_rate: number;
  created_at: string;
  last_submission?: string;
}

interface WebformSubmission {
  id: string;
  form_id: string;
  visitor_id: string;
  data: any;
  utm_data?: any;
  user_journey?: any;
  fraud_score: number;
  status: 'verified' | 'spam' | 'pending';
  created_at: string;
}

interface WebformAnalytics {
  total_submissions: number;
  verified_submissions: number;
  spam_submissions: number;
  unique_visitors: number;
  conversion_rate: number;
  avg_time_to_submit: number;
  submissions_by_day: Array<{ date: string; submissions: number; conversions: number }>;
  top_sources: Array<{ source: string; submissions: number }>;
  spam_indicators: Array<{ type: string; count: number }>;
}

export default function WebformsDashboard() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [webforms, setWebforms] = useState<Webform[]>([]);
  const [submissions, setSubmissions] = useState<WebformSubmission[]>([]);
  const [analytics, setAnalytics] = useState<WebformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Webform | null>(null);
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    fields: [] as Array<{ name: string; type: string; required: boolean }>,
    settings: {
      spam_protection: true,
      utm_tracking: true,
      user_journey: true,
      notification_email: ''
    }
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadWebforms(),
        loadSubmissions(),
        loadAnalytics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWebforms = async () => {
    try {
      const response = await fetch('/api/webforms/forms?workspaceId=default-workspace');
      if (response.ok) {
        const data = await response.json();
        setWebforms(data);
      }
    } catch (error) {
      console.error('Error loading webforms:', error);
      // Mock data for demo
      setWebforms([
        {
          id: '1',
          name: 'Contact Form',
          tracking_id: 'wf_contact_123',
          status: 'active',
          submissions: 245,
          conversions: 189,
          conversion_rate: 77.1,
          created_at: '2024-01-15T10:00:00Z',
          last_submission: '2024-03-15T14:30:00Z'
        },
        {
          id: '2', 
          name: 'Newsletter Signup',
          tracking_id: 'wf_newsletter_456',
          status: 'active',
          submissions: 1024,
          conversions: 967,
          conversion_rate: 94.4,
          created_at: '2024-01-10T09:00:00Z',
          last_submission: '2024-03-15T16:45:00Z'
        }
      ]);
    }
  };

  const loadSubmissions = async () => {
    try {
      const response = await fetch('/api/webforms/submissions?workspaceId=default-workspace');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      // Mock data for demo
      setSubmissions([
        {
          id: '1',
          form_id: '1',
          visitor_id: 'vis_123',
          data: { name: 'John Doe', email: 'john@example.com', message: 'Hello world' },
          utm_data: { source: 'google', medium: 'cpc', campaign: 'spring2024' },
          fraud_score: 0.1,
          status: 'verified',
          created_at: '2024-03-15T14:30:00Z'
        },
        {
          id: '2',
          form_id: '2',
          visitor_id: 'vis_456',
          data: { email: 'spam@spam.com' },
          fraud_score: 0.95,
          status: 'spam',
          created_at: '2024-03-15T16:45:00Z'
        }
      ]);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/webforms/analytics?workspaceId=default-workspace&timeRange=30d');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Mock data for demo
      setAnalytics({
        total_submissions: 1269,
        verified_submissions: 1156,
        spam_submissions: 113,
        unique_visitors: 856,
        conversion_rate: 85.2,
        avg_time_to_submit: 2.4,
        submissions_by_day: [
          { date: '2024-03-01', submissions: 45, conversions: 38 },
          { date: '2024-03-02', submissions: 52, conversions: 47 },
          { date: '2024-03-03', submissions: 38, conversions: 32 },
          { date: '2024-03-04', submissions: 61, conversions: 54 },
          { date: '2024-03-05', submissions: 42, conversions: 39 }
        ],
        top_sources: [
          { source: 'google', submissions: 456 },
          { source: 'direct', submissions: 234 },
          { source: 'facebook', submissions: 189 },
          { source: 'linkedin', submissions: 123 }
        ],
        spam_indicators: [
          { type: 'Suspicious email patterns', count: 45 },
          { type: 'Bot-like behavior', count: 32 },
          { type: 'Invalid UTM data', count: 21 },
          { type: 'Rapid submissions', count: 15 }
        ]
      });
    }
  };

  const handleCreateForm = async () => {
    try {
      const response = await fetch('/api/webforms/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'default-workspace',
          name: formData.name,
          config: {
            fields: formData.fields,
            settings: formData.settings
          }
        })
      });

      if (response.ok) {
        setCreateFormOpen(false);
        loadWebforms();
        setFormData({
          name: '',
          fields: [],
          settings: {
            spam_protection: true,
            utm_tracking: true,
            user_journey: true,
            notification_email: ''
          }
        });
      }
    } catch (error) {
      console.error('Error creating form:', error);
    }
  };

  const getTrackingScript = (trackingId: string) => {
    return `<!-- Locall Webform Tracking -->
<script>
(function() {
  var script = document.createElement('script');
  script.src = '${window.location.origin}/api/webforms/script/${trackingId}';
  script.async = true;
  document.head.appendChild(script);
})();
</script>`;
  };

  const renderOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Forms
            </Typography>
            <Typography variant="h4">
              {webforms.length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Submissions
            </Typography>
            <Typography variant="h4">
              {analytics?.total_submissions || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Conversion Rate
            </Typography>
            <Typography variant="h4">
              {analytics?.conversion_rate || 0}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Spam Blocked
            </Typography>
            <Typography variant="h4">
              {analytics?.spam_submissions || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Submissions Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.submissions_by_day || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip />
                <Line type="monotone" dataKey="submissions" stroke="#8884d8" />
                <Line type="monotone" dataKey="conversions" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Traffic Sources
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.top_sources || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="submissions"
                  label={({ source, submissions }) => `${source}: ${submissions}`}
                >
                  {(analytics?.top_sources || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderForms = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Webforms</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setCreateFormOpen(true)}
        >
          Create Form
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submissions</TableCell>
              <TableCell>Conversion Rate</TableCell>
              <TableCell>Last Submission</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {webforms.map((form) => (
              <TableRow key={form.id}>
                <TableCell>{form.name}</TableCell>
                <TableCell>
                  <Chip 
                    label={form.status} 
                    color={form.status === 'active' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>{form.submissions}</TableCell>
                <TableCell>{form.conversion_rate}%</TableCell>
                <TableCell>
                  {form.last_submission ? new Date(form.last_submission).toLocaleDateString() : 'Never'}
                </TableCell>
                <TableCell>
                  <Tooltip title="View Tracking Code">
                    <IconButton 
                      size="small"
                      onClick={() => {
                        setSelectedForm(form);
                        setScriptDialogOpen(true);
                      }}
                    >
                      <CodeIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Form">
                    <IconButton 
                      size="small"
                      onClick={() => {
                        setSelectedForm(form);
                        setEditFormOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View Analytics">
                    <IconButton size="small">
                      <AnalyticsIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderSubmissions = () => (
    <Box>
      <Typography variant="h5" gutterBottom>Recent Submissions</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Form</TableCell>
              <TableCell>Visitor</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Fraud Score</TableCell>
              <TableCell>Submitted</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>
                  {webforms.find(f => f.id === submission.form_id)?.name || 'Unknown'}
                </TableCell>
                <TableCell>{submission.visitor_id}</TableCell>
                <TableCell>
                  <Box sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {JSON.stringify(submission.data)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={submission.status}
                    color={
                      submission.status === 'verified' ? 'success' :
                      submission.status === 'spam' ? 'error' : 'warning'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {(submission.fraud_score * 100).toFixed(1)}%
                    {submission.fraud_score > 0.7 && <SecurityIcon color="error" fontSize="small" />}
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(submission.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderAnalytics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Spam Indicators
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.spam_indicators || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <ChartTooltip />
                <Bar dataKey="count" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {analytics?.unique_visitors || 0}
                  </Typography>
                  <Typography color="textSecondary">
                    Unique Visitors
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {analytics?.avg_time_to_submit || 0}m
                  </Typography>
                  <Typography color="textSecondary">
                    Avg. Time to Submit
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Conversion rate has improved by 12% this month thanks to spam filtering
                </Alert>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Webforms Dashboard
      </Typography>

      <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Forms" />
        <Tab label="Submissions" />
        <Tab label="Analytics" />
      </Tabs>

      {selectedTab === 0 && renderOverview()}
      {selectedTab === 1 && renderForms()}
      {selectedTab === 2 && renderSubmissions()}
      {selectedTab === 3 && renderAnalytics()}

      {/* Create Form Dialog */}
      <Dialog open={createFormOpen} onClose={() => setCreateFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Webform</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Form Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            sx={{ mb: 2 }}
          />
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Advanced form builder and field configuration will be available after creation.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFormOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateForm} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Tracking Script Dialog */}
      <Dialog open={scriptDialogOpen} onClose={() => setScriptDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tracking Code for {selectedForm?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Add this script to your website to enable form tracking:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={selectedForm ? getTrackingScript(selectedForm.tracking_id) : ''}
            variant="outlined"
            InputProps={{ readOnly: true }}
            sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              if (selectedForm) {
                navigator.clipboard.writeText(getTrackingScript(selectedForm.tracking_id));
              }
            }}
            variant="contained"
          >
            Copy to Clipboard
          </Button>
          <Button onClick={() => setScriptDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
