'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Paper,
  Divider,
  Avatar,
  Tooltip,
  Fab,
  Badge,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Language as DomainIcon,
  Palette as BrandingIcon,
  Visibility as PreviewIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  CheckCircle as ActiveIcon,
  Error as InactiveIcon,
  Launch as LaunchIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { Grid as FixedGrid } from '@/components/FixedGrid';
import DashboardLayout from '@/components/DashboardLayout';

interface WhiteLabel {
  id: string;
  client_name: string;
  subdomain: string;
  custom_domain?: string;
  branding_config: {
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    company_name: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
      id={`white-label-tabpanel-${index}`}
      aria-labelledby={`white-label-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function WhiteLabelPage() {
  const [whiteLabels, setWhiteLabels] = useState<WhiteLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<WhiteLabel | null>(null);
  const [formData, setFormData] = useState({
    client_name: '',
    subdomain: '',
    custom_domain: '',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1F2937',
    company_name: '',
    is_active: true
  });

  useEffect(() => {
    fetchWhiteLabels();
  }, []);

  const fetchWhiteLabels = async () => {
    try {
      const response = await fetch('/api/white-label');
      const data = await response.json();
      if (data.success) {
        setWhiteLabels(data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching white labels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: formData.client_name,
          subdomain: formData.subdomain,
          custom_domain: formData.custom_domain || null,
          branding_config: {
            logo_url: formData.logo_url,
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color,
            company_name: formData.company_name || formData.client_name
          },
          is_active: formData.is_active
        })
      });

      if (response.ok) {
        setCreateDialog(false);
        resetForm();
        fetchWhiteLabels();
      }
    } catch (error) {
      console.error('Error creating white label:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedLabel) return;

    try {
      const response = await fetch('/api/white-label', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedLabel.id,
          client_name: formData.client_name,
          custom_domain: formData.custom_domain || null,
          branding_config: {
            logo_url: formData.logo_url,
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color,
            company_name: formData.company_name
          },
          is_active: formData.is_active
        })
      });

      if (response.ok) {
        setEditDialog(false);
        setSelectedLabel(null);
        resetForm();
        fetchWhiteLabels();
      }
    } catch (error) {
      console.error('Error updating white label:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      subdomain: '',
      custom_domain: '',
      logo_url: '',
      primary_color: '#3B82F6',
      secondary_color: '#1F2937',
      company_name: '',
      is_active: true
    });
  };

  const openEditDialog = (label: WhiteLabel) => {
    setSelectedLabel(label);
    setFormData({
      client_name: label.client_name,
      subdomain: label.subdomain,
      custom_domain: label.custom_domain || '',
      logo_url: label.branding_config.logo_url,
      primary_color: label.branding_config.primary_color,
      secondary_color: label.branding_config.secondary_color,
      company_name: label.branding_config.company_name,
      is_active: label.is_active
    });
    setEditDialog(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const WhiteLabelCard = ({ label }: { label: WhiteLabel }) => (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        },
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header with branding colors */}
      <Box 
        sx={{ 
          height: 60,
          background: `linear-gradient(135deg, ${label.branding_config.primary_color}, ${label.branding_config.secondary_color})`,
          position: 'relative'
        }}
      >
        <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
          <Chip 
            size="small"
            icon={label.is_active ? <ActiveIcon /> : <InactiveIcon />}
            label={label.is_active ? 'Active' : 'Inactive'}
            color={label.is_active ? 'success' : 'error'}
            sx={{ color: 'white' }}
          />
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: label.branding_config.primary_color,
              mr: 2,
              width: 40,
              height: 40
            }}
          >
            <BusinessIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {label.branding_config.company_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label.client_name}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Domain Information */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Subdomain
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {label.subdomain}.locall.com
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => copyToClipboard(`${label.subdomain}.locall.com`)}
            >
              <CopyIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small"
              onClick={() => window.open(`https://${label.subdomain}.locall.com`, '_blank')}
            >
              <LaunchIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {label.custom_domain && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Custom Domain
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {label.custom_domain}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => copyToClipboard(label.custom_domain!)}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Color Palette */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Brand Colors
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box 
              sx={{ 
                width: 24, 
                height: 24, 
                borderRadius: 1,
                bgcolor: label.branding_config.primary_color,
                border: '1px solid',
                borderColor: 'divider'
              }} 
            />
            <Box 
              sx={{ 
                width: 24, 
                height: 24, 
                borderRadius: 1,
                bgcolor: label.branding_config.secondary_color,
                border: '1px solid',
                borderColor: 'divider'
              }} 
            />
          </Box>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => openEditDialog(label)}
            sx={{ flex: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PreviewIcon />}
            onClick={() => window.open(`https://${label.subdomain}.locall.com`, '_blank')}
          >
            Preview
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            White-Label Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage white-label instances for your clients
          </Typography>
        </Box>

        {/* Stats Cards */}
        <FixedGrid container spacing={3} sx={{ mb: 4 }}>
          <FixedGrid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                {whiteLabels.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Instances
              </Typography>
            </Card>
          </FixedGrid>
          <FixedGrid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                {whiteLabels.filter(w => w.is_active).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Instances
              </Typography>
            </Card>
          </FixedGrid>
          <FixedGrid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main', mb: 1 }}>
                {whiteLabels.filter(w => w.custom_domain).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Custom Domains
              </Typography>
            </Card>
          </FixedGrid>
          <FixedGrid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main', mb: 1 }}>
                {new Set(whiteLabels.map(w => w.branding_config.primary_color)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unique Brands
              </Typography>
            </Card>
          </FixedGrid>
        </FixedGrid>

        {/* Main Content */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
              <Tab label="All Instances" icon={<BusinessIcon />} iconPosition="start" />
              <Tab label="Settings" icon={<SettingsIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          <TabPanel value={currentTab} index={0}>
            {loading ? (
              <LinearProgress />
            ) : whiteLabels.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No white-label instances found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first white-label instance to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialog(true)}
                >
                  Create Instance
                </Button>
              </Box>
            ) : (
              <FixedGrid container spacing={3}>
                {whiteLabels.map((label) => (
                  <FixedGrid item xs={12} md={6} lg={4} key={label.id}>
                    <WhiteLabelCard label={label} />
                  </FixedGrid>
                ))}
              </FixedGrid>
            )}
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <FixedGrid container spacing={3}>
              <FixedGrid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Default Settings
                  </Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Auto-activate new instances"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable custom domains"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Require domain verification"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Include analytics tracking"
                    />
                  </Stack>
                </Card>
              </FixedGrid>
              <FixedGrid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Branding Defaults
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Default Primary Color"
                      type="color"
                      value="#3B82F6"
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Default Secondary Color"
                      type="color"
                      value="#1F2937"
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Default Logo URL"
                      placeholder="https://example.com/logo.png"
                      size="small"
                      fullWidth
                    />
                  </Stack>
                </Card>
              </FixedGrid>
            </FixedGrid>
          </TabPanel>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create White-Label Instance</DialogTitle>
          <DialogContent>
            <FixedGrid container spacing={2} sx={{ mt: 1 }}>
              <FixedGrid item xs={12} sm={6}>
                <TextField
                  label="Client Name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  fullWidth
                  required
                />
              </FixedGrid>
              <FixedGrid item xs={12} sm={6}>
                <TextField
                  label="Subdomain"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                  fullWidth
                  required
                  helperText="Will be accessible at subdomain.locall.com"
                />
              </FixedGrid>
              <FixedGrid item xs={12}>
                <TextField
                  label="Custom Domain (Optional)"
                  value={formData.custom_domain}
                  onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                  fullWidth
                  placeholder="app.yourclient.com"
                />
              </FixedGrid>
              <FixedGrid item xs={12} sm={6}>
                <TextField
                  label="Company Name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  fullWidth
                />
              </FixedGrid>
              <FixedGrid item xs={12} sm={6}>
                <TextField
                  label="Logo URL"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  fullWidth
                />
              </FixedGrid>
              <FixedGrid item xs={12} sm={6}>
                <TextField
                  label="Primary Color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  fullWidth
                />
              </FixedGrid>
              <FixedGrid item xs={12} sm={6}>
                <TextField
                  label="Secondary Color"
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  fullWidth
                />
              </FixedGrid>
              <FixedGrid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                  }
                  label="Activate immediately"
                />
              </FixedGrid>
            </FixedGrid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained">Create Instance</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit White-Label Instance</DialogTitle>
          <DialogContent>
            <FixedGrid container spacing={2} sx={{ mt: 1 }}>
              <FixedGrid item xs={12} sm={6}>
                <TextField
                  label="Client Name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  fullWidth
                  required
                />
              </FixedGrid>
              <FixedGrid item xs={12} sm={6}>
                <TextField
                  label="Subdomain"
                  value={formData.subdomain}
                  fullWidth
                  disabled
                  helperText="Subdomain cannot be changed"
                />
              </FixedGrid>
              <FixedGrid item xs={12}>
                <TextField
                  label="Custom Domain"
                  value={formData.custom_domain}
                  onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                  fullWidth
                />
              </FixedGrid>
              <FixedGrid item xs={12} sm={6}>
                <TextField
                  label="Company Name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  fullWidth
                />
              </FixedGrid>
              <FixedGrid item xs={12} sm={6}>
                <TextField
                  label="Logo URL"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  fullWidth
                />
              </FixedGrid>
              <FixedGrid item xs={12} sm={6}>
                <TextField
                  label="Primary Color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  fullWidth
                />
              </FixedGrid>
              <FixedGrid item xs={12} sm={6}>
                <TextField
                  label="Secondary Color"
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  fullWidth
                />
              </FixedGrid>
              <FixedGrid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </FixedGrid>
            </FixedGrid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} variant="contained">Update Instance</Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="create instance"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => setCreateDialog(true)}
        >
          <AddIcon />
        </Fab>
      </Box>
    </DashboardLayout>
  );
}
