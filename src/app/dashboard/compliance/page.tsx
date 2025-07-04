// app/dashboard/compliance/page.tsx
"use client";

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Alert,
  LinearProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Security as SecurityIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Storage as StorageIcon,
  History as HistoryIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import DashboardLayout from '../../../components/DashboardLayout';

interface ComplianceSettings {
  gdpr_enabled: boolean;
  call_recording_consent: boolean;
  data_processing_notice: boolean;
  export_requests_enabled: boolean;
  deletion_requests_enabled: boolean;
  audit_log_enabled: boolean;
}

interface RetentionPolicy {
  id: string;
  data_type: string;
  retention_days: number;
  auto_delete: boolean;
  legal_hold: boolean;
}

interface ExportRequest {
  id: string;
  data_types: string[];
  status: string;
  created_at: string;
  file_url?: string;
}

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  details: any;
  created_at: string;
  user_id: string;
}

function TabPanel({ children, value, index }: any) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CompliancePage() {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState<ComplianceSettings>({
    gdpr_enabled: true,
    call_recording_consent: true,
    data_processing_notice: true,
    export_requests_enabled: true,
    deletion_requests_enabled: true,
    audit_log_enabled: true
  });
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [policyDialog, setPolicyDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    data_type: 'calls',
    retention_days: 365,
    auto_delete: true
  });
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['calls']);

  const workspaceId = 'demo-workspace-id'; // Get from context in production

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      // Fetch compliance settings
      const settingsResponse = await fetch(`/api/compliance/settings?workspaceId=${workspaceId}`);
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData.data) {
          setSettings(settingsData.data);
        }
      }

      // Fetch export requests
      const exportsResponse = await fetch(`/api/compliance/export?workspaceId=${workspaceId}`);
      if (exportsResponse.ok) {
        const exportsData = await exportsResponse.json();
        setExportRequests(exportsData.data || []);
      }

      // Fetch audit logs
      const auditResponse = await fetch(`/api/compliance/audit?workspaceId=${workspaceId}&limit=50`);
      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        setAuditLogs(auditData.data || []);
      }

    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updatedSettings: Partial<ComplianceSettings>) => {
    try {
      const response = await fetch('/api/compliance/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, ...updatedSettings })
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, ...updatedSettings }));
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const createRetentionPolicy = async () => {
    try {
      const response = await fetch('/api/compliance/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, ...newPolicy })
      });

      if (response.ok) {
        const result = await response.json();
        setRetentionPolicies(prev => [...prev, result.data]);
        setPolicyDialog(false);
        setNewPolicy({ data_type: 'calls', retention_days: 365, auto_delete: true });
      }
    } catch (error) {
      console.error('Error creating retention policy:', error);
    }
  };

  const requestDataExport = async () => {
    try {
      const response = await fetch('/api/compliance/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId: 'demo-user-id', // Get from auth in production
          dataTypes: selectedDataTypes
        })
      });

      if (response.ok) {
        const result = await response.json();
        setExportRequests(prev => [result.data, ...prev]);
        setExportDialog(false);
        setSelectedDataTypes(['calls']);
      }
    } catch (error) {
      console.error('Error requesting export:', error);
    }
  };

  const downloadExport = async (exportId: string) => {
    try {
      const response = await fetch(`/api/compliance/export?workspaceId=${workspaceId}&exportId=${exportId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.data.fileUrl) {
          // Create download link
          const link = document.createElement('a');
          link.href = result.data.fileUrl;
          link.download = `export_${exportId}.json`;
          link.click();
        }
      }
    } catch (error) {
      console.error('Error downloading export:', error);
    }
  };

  const triggerCleanup = async () => {
    try {
      const response = await fetch(`/api/compliance/retention?workspaceId=${workspaceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Cleanup process initiated successfully');
        fetchComplianceData(); // Refresh data
      }
    } catch (error) {
      console.error('Error triggering cleanup:', error);
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 2 }} />
          Compliance & Data Management
        </Typography>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Settings" />
            <Tab label="Data Retention" />
            <Tab label="Data Exports" />
            <Tab label="Audit Logs" />
          </Tabs>

          {/* Settings Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="GDPR Compliance" />
                  <CardContent>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color={settings.gdpr_enabled ? 'success' : 'disabled'} />
                        </ListItemIcon>
                        <ListItemText primary="GDPR Enabled" />
                        <Switch
                          checked={settings.gdpr_enabled}
                          onChange={(e) => updateSettings({ gdpr_enabled: e.target.checked })}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color={settings.call_recording_consent ? 'success' : 'disabled'} />
                        </ListItemIcon>
                        <ListItemText primary="Call Recording Consent" />
                        <Switch
                          checked={settings.call_recording_consent}
                          onChange={(e) => updateSettings({ call_recording_consent: e.target.checked })}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color={settings.data_processing_notice ? 'success' : 'disabled'} />
                        </ListItemIcon>
                        <ListItemText primary="Data Processing Notice" />
                        <Switch
                          checked={settings.data_processing_notice}
                          onChange={(e) => updateSettings({ data_processing_notice: e.target.checked })}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="User Rights" />
                  <CardContent>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <DownloadIcon color={settings.export_requests_enabled ? 'primary' : 'disabled'} />
                        </ListItemIcon>
                        <ListItemText primary="Data Export Requests" />
                        <Switch
                          checked={settings.export_requests_enabled}
                          onChange={(e) => updateSettings({ export_requests_enabled: e.target.checked })}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <DeleteIcon color={settings.deletion_requests_enabled ? 'error' : 'disabled'} />
                        </ListItemIcon>
                        <ListItemText primary="Data Deletion Requests" />
                        <Switch
                          checked={settings.deletion_requests_enabled}
                          onChange={(e) => updateSettings({ deletion_requests_enabled: e.target.checked })}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <HistoryIcon color={settings.audit_log_enabled ? 'info' : 'disabled'} />
                        </ListItemIcon>
                        <ListItemText primary="Audit Logging" />
                        <Switch
                          checked={settings.audit_log_enabled}
                          onChange={(e) => updateSettings({ audit_log_enabled: e.target.checked })}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Data Retention Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Data Retention Policies</Typography>
              <Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={triggerCleanup}
                  sx={{ mr: 2 }}
                >
                  Trigger Cleanup
                </Button>
                <Button
                  variant="contained"
                  startIcon={<StorageIcon />}
                  onClick={() => setPolicyDialog(true)}
                >
                  Add Policy
                </Button>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Retention policies automatically delete data older than the specified period. 
              This helps maintain GDPR compliance and manages storage costs.
            </Alert>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Data Type</TableCell>
                    <TableCell>Retention Period</TableCell>
                    <TableCell>Auto Delete</TableCell>
                    <TableCell>Legal Hold</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {retentionPolicies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell>
                        <Chip label={policy.data_type} />
                      </TableCell>
                      <TableCell>{policy.retention_days} days</TableCell>
                      <TableCell>
                        <Chip 
                          label={policy.auto_delete ? 'Enabled' : 'Disabled'} 
                          color={policy.auto_delete ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={policy.legal_hold ? 'Yes' : 'No'} 
                          color={policy.legal_hold ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" color="error">
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {retentionPolicies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No retention policies configured
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Data Exports Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Data Export Requests</Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => setExportDialog(true)}
              >
                Request Export
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request Date</TableCell>
                    <TableCell>Data Types</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exportRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {request.data_types.map(type => (
                          <Chip key={type} label={type} size="small" sx={{ mr: 1 }} />
                        ))}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.status} 
                          color={
                            request.status === 'completed' ? 'success' :
                            request.status === 'failed' ? 'error' :
                            request.status === 'processing' ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {request.status === 'completed' && (
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => downloadExport(request.id)}
                          >
                            Download
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {exportRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No export requests found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Audit Logs Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" sx={{ mb: 3 }}>Audit Logs</Typography>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.user_id}</TableCell>
                      <TableCell>
                        <Chip label={log.action} size="small" />
                      </TableCell>
                      <TableCell>{log.resource_type}</TableCell>
                      <TableCell>
                        {JSON.stringify(log.details)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {auditLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Paper>

        {/* Add Retention Policy Dialog */}
        <Dialog open={policyDialog} onClose={() => setPolicyDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Retention Policy</DialogTitle>
          <DialogContent>
            <TextField
              select
              fullWidth
              label="Data Type"
              value={newPolicy.data_type}
              onChange={(e) => setNewPolicy(prev => ({ ...prev, data_type: e.target.value }))}
              sx={{ mb: 2, mt: 1 }}
              SelectProps={{ native: true }}
            >
              <option value="calls">Calls</option>
              <option value="recordings">Recordings</option>
              <option value="transcripts">Transcripts</option>
              <option value="form_submissions">Form Submissions</option>
              <option value="analytics">Analytics Data</option>
            </TextField>
            
            <TextField
              fullWidth
              type="number"
              label="Retention Days"
              value={newPolicy.retention_days}
              onChange={(e) => setNewPolicy(prev => ({ ...prev, retention_days: parseInt(e.target.value) }))}
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={newPolicy.auto_delete}
                  onChange={(e) => setNewPolicy(prev => ({ ...prev, auto_delete: e.target.checked }))}
                />
              }
              label="Auto Delete"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPolicyDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={createRetentionPolicy}>
              Create Policy
            </Button>
          </DialogActions>
        </Dialog>

        {/* Request Export Dialog */}
        <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Request Data Export</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Select the types of data you want to export:
            </Typography>
            
            {['calls', 'recordings', 'transcripts', 'form_submissions', 'analytics'].map(type => (
              <FormControlLabel
                key={type}
                control={
                  <Switch
                    checked={selectedDataTypes.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDataTypes(prev => [...prev, type]);
                      } else {
                        setSelectedDataTypes(prev => prev.filter(t => t !== type));
                      }
                    }}
                  />
                }
                label={type.replace('_', ' ').toUpperCase()}
                sx={{ display: 'block' }}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialog(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={requestDataExport}
              disabled={selectedDataTypes.length === 0}
            >
              Request Export
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}
