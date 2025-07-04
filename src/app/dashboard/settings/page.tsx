'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Tabs,
  Tab,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
} from '@mui/material';
import { Grid } from '../../../components/FixedGrid';
import {
  Palette as PaletteIcon,
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Code as CodeIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Reset as ResetIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../../components/DashboardLayout';
import { useSettings } from '../../../contexts/SettingsContext';
import { useNotification } from '../../../contexts/NotificationContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [importDialog, setImportDialog] = useState(false);
  const [resetDialog, setResetDialog] = useState(false);
  const [importData, setImportData] = useState('');
  
  const theme = useTheme();
  const { settings, updateSetting, resetSettings, exportSettings, importSettings } = useSettings();
  const { showSuccess, showError, showInfo } = useNotification();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleImport = () => {
    try {
      const success = importSettings(importData);
      if (success) {
        showSuccess('Settings imported successfully!');
        setImportDialog(false);
        setImportData('');
      } else {
        showError('Invalid settings format. Please check your data.');
      }
    } catch (error) {
      showError('Failed to import settings. Please try again.');
    }
  };

  const handleExport = () => {
    const data = exportSettings();
    navigator.clipboard.writeText(data).then(() => {
      showSuccess('Settings copied to clipboard!');
    }).catch(() => {
      showError('Failed to copy settings to clipboard.');
    });
  };

  const handleReset = () => {
    resetSettings();
    showSuccess('Settings reset to default values');
    setResetDialog(false);
  };

  const primaryColors = [
    { name: 'Blue', value: '#1976d2' },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Green', value: '#2e7d32' },
    { name: 'Orange', value: '#ed6c02' },
    { name: 'Red', value: '#d32f2f' },
    { name: 'Teal', value: '#00695c' },
  ];

  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            ⚙️ Settings
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Customize your Locall experience
          </Typography>
        </Box>

        <Card sx={{ 
          borderRadius: 3,
          background: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              <Tab icon={<PaletteIcon />} label="Appearance" />
              <Tab icon={<DashboardIcon />} label="Dashboard" />
              <Tab icon={<NotificationsIcon />} label="Notifications" />
              <Tab icon={<SecurityIcon />} label="Privacy" />
              <Tab icon={<StorageIcon />} label="Data" />
              <Tab icon={<CodeIcon />} label="Advanced" />
            </Tabs>
          </Box>

          {/* Appearance Tab */}
          <TabPanel value={tabValue} index={0}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Appearance Settings</Typography>
              
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.darkMode}
                          onChange={(e) => updateSetting('darkMode', e.target.checked)}
                        />
                      }
                      label="Dark Mode"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Toggle between light and dark theme
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.animations}
                          onChange={(e) => updateSetting('animations', e.target.checked)}
                        />
                      }
                      label="Animations"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Enable smooth animations and transitions
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.compactMode}
                          onChange={(e) => updateSetting('compactMode', e.target.checked)}
                        />
                      }
                      label="Compact Mode"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Reduce spacing for more content on screen
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>Primary Color</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {primaryColors.map((color) => (
                        <Chip
                          key={color.value}
                          label={color.name}
                          onClick={() => updateSetting('primaryColor', color.value)}
                          sx={{
                            backgroundColor: color.value,
                            color: 'white',
                            border: settings.primaryColor === color.value ? '3px solid' : '1px solid transparent',
                            borderColor: settings.primaryColor === color.value ? theme.palette.text.primary : 'transparent',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>

          {/* Dashboard Tab */}
          <TabPanel value={tabValue} index={1}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Dashboard Settings</Typography>
              
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Auto Refresh Interval (seconds)
                    </Typography>
                    <Slider
                      value={settings.refreshInterval}
                      onChange={(_, value) => updateSetting('refreshInterval', value as number)}
                      min={5}
                      max={300}
                      step={5}
                      marks={[
                        { value: 30, label: '30s' },
                        { value: 60, label: '1m' },
                        { value: 300, label: '5m' },
                      ]}
                      valueLabelDisplay="on"
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Default View</InputLabel>
                      <Select
                        value={settings.defaultView}
                        onChange={(e) => updateSetting('defaultView', e.target.value as 'grid' | 'list')}
                        label="Default View"
                      >
                        <MenuItem value="grid">Grid View</MenuItem>
                        <MenuItem value="list">List View</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showMetrics}
                          onChange={(e) => updateSetting('showMetrics', e.target.checked)}
                        />
                      }
                      label="Show Metrics"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Display key performance metrics on dashboard
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.autoRefresh}
                          onChange={(e) => updateSetting('autoRefresh', e.target.checked)}
                        />
                      }
                      label="Auto Refresh"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Automatically refresh dashboard data
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>

          {/* Notifications Tab */}
          <TabPanel value={tabValue} index={2}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Notification Preferences</Typography>
              
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Email Notifications"
                        secondary="Receive important updates via email"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.emailNotifications}
                          onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText
                        primary="Push Notifications"
                        secondary="Browser push notifications for real-time alerts"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.pushNotifications}
                          onChange={(e) => updateSetting('pushNotifications', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="SMS Notifications"
                        secondary="Receive critical alerts via SMS"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.smsNotifications}
                          onChange={(e) => updateSetting('smsNotifications', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText
                        primary="Notification Sound"
                        secondary="Play sound for new notifications"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.notificationSound}
                          onChange={(e) => updateSetting('notificationSound', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>

          {/* Privacy Tab */}
          <TabPanel value={tabValue} index={3}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Privacy & Security</Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Your privacy is important to us. These settings control how your data is used.
              </Alert>

              <List>
                <ListItem>
                  <ListItemText
                    primary="Data Sharing"
                    secondary="Allow anonymous usage data to help improve the platform"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.dataSharing}
                      onChange={(e) => updateSetting('dataSharing', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary="Analytics"
                    secondary="Enable analytics to track usage patterns and performance"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.analytics}
                      onChange={(e) => updateSetting('analytics', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </TabPanel>

          {/* Data Tab */}
          <TabPanel value={tabValue} index={4}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Data Management</Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <DownloadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>Export Settings</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Download your current settings as a backup
                    </Typography>
                    <Button variant="contained" onClick={handleExport}>
                      Export Settings
                    </Button>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <UploadIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>Import Settings</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Restore settings from a backup
                    </Typography>
                    <Button variant="contained" color="secondary" onClick={() => setImportDialog(true)}>
                      Import Settings
                    </Button>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 3, textAlign: 'center', border: '1px solid', borderColor: 'error.main' }}>
                    <ResetIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1, color: 'error.main' }}>Reset Settings</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Reset all settings to their default values
                    </Typography>
                    <Button variant="outlined" color="error" onClick={() => setResetDialog(true)}>
                      Reset to Defaults
                    </Button>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>

          {/* Advanced Tab */}
          <TabPanel value={tabValue} index={5}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Advanced Settings</Typography>
              
              <Alert severity="warning" sx={{ mb: 3 }}>
                These settings are for advanced users. Changing them may affect platform functionality.
              </Alert>

              <List>
                <ListItem>
                  <ListItemText
                    primary="Developer Mode"
                    secondary="Enable developer tools and debug information"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.developerMode}
                      onChange={(e) => updateSetting('developerMode', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary="Beta Features"
                    secondary="Enable experimental features and early access to new functionality"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.betaFeatures}
                      onChange={(e) => updateSetting('betaFeatures', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </TabPanel>
        </Card>

        {/* Import Dialog */}
        <Dialog open={importDialog} onClose={() => setImportDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Import Settings</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={10}
              label="Settings JSON"
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              sx={{ mt: 1 }}
              placeholder="Paste your exported settings JSON here..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImportDialog(false)}>Cancel</Button>
            <Button onClick={handleImport} variant="contained" disabled={!importData.trim()}>
              Import
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reset Dialog */}
        <Dialog open={resetDialog} onClose={() => setResetDialog(false)}>
          <DialogTitle>Reset Settings</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to reset all settings to their default values? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetDialog(false)}>Cancel</Button>
            <Button onClick={handleReset} color="error" variant="contained">
              Reset Settings
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}
