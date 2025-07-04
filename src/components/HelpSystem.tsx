'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  IconButton,
  Fab,
  Zoom,
  alpha,
  useTheme,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Help as HelpIcon,
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  CheckCircle as CheckIcon,
  PlayArrow as PlayIcon,
  Dashboard as DashboardIcon,
  Phone as PhoneIcon,
  Assessment as AnalyticsIcon,
  Hub as IntegrationsIcon,
  Web as WebIcon,
  Settings as SettingsIcon,
  Keyboard as KeyboardIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  actions?: string[];
}

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Welcome to Locall',
    description: 'Your advanced communication and automation platform. This guide will help you get started with the key features.',
    icon: <DashboardIcon />,
  },
  {
    title: 'Dashboard Overview',
    description: 'The dashboard shows real-time metrics, recent activity, and quick actions. All data updates automatically.',
    icon: <AnalyticsIcon />,
    actions: ['View real-time metrics', 'Check recent activity', 'Use quick actions']
  },
  {
    title: 'Command Palette',
    description: 'Press Ctrl+K (or Cmd+K) to open the command palette for quick navigation and actions throughout the platform.',
    icon: <SearchIcon />,
    actions: ['Try pressing Ctrl+K now', 'Search for commands', 'Use keyboard shortcuts']
  },
  {
    title: 'Navigation Features',
    description: 'Use the sidebar to navigate between sections. The navbar shows notifications and system status.',
    icon: <DashboardIcon />,
    actions: ['Explore sidebar sections', 'Check notifications', 'Toggle sidebar with Ctrl+B']
  },
  {
    title: 'Real-time Updates',
    description: 'Data refreshes automatically every 30 seconds. You can also manually refresh using the refresh button or F5.',
    icon: <RefreshIcon />,
    actions: ['Notice live data updates', 'Try manual refresh', 'Check connection status']
  },
  {
    title: 'Analytics & Charts',
    description: 'Interactive charts show your data trends. Switch between different chart types and time ranges.',
    icon: <AnalyticsIcon />,
    actions: ['Explore chart controls', 'Change time ranges', 'Switch chart types']
  },
];

const helpTopics: HelpTopic[] = [
  {
    id: 'navigation',
    title: 'Navigation',
    description: 'Learn how to navigate through the platform efficiently',
    icon: <DashboardIcon />,
    keywords: ['sidebar', 'menu', 'navigation', 'pages'],
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Master keyboard shortcuts for faster workflow',
    icon: <KeyboardIcon />,
    keywords: ['keyboard', 'shortcuts', 'hotkeys', 'commands'],
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    description: 'Understanding charts, metrics, and data visualization',
    icon: <AnalyticsIcon />,
    keywords: ['charts', 'analytics', 'reports', 'metrics', 'data'],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect and manage third-party services',
    icon: <IntegrationsIcon />,
    keywords: ['integrations', 'api', 'connections', 'services'],
  },
  {
    id: 'settings',
    title: 'Settings & Customization',
    description: 'Personalize your experience and configure preferences',
    icon: <SettingsIcon />,
    keywords: ['settings', 'preferences', 'customization', 'configuration'],
  },
];

const keyboardShortcuts = [
  { shortcut: 'Ctrl+K', description: 'Open command palette' },
  { shortcut: 'Ctrl+B', description: 'Toggle sidebar' },
  { shortcut: 'Ctrl+D', description: 'Go to dashboard' },
  { shortcut: 'Ctrl+C', description: 'Go to calls' },
  { shortcut: 'F5', description: 'Refresh data' },
  { shortcut: 'F1', description: 'Open help' },
  { shortcut: 'Esc', description: 'Close dialogs' },
  { shortcut: 'Ctrl+Shift+T', description: 'Toggle theme' },
];

interface OnboardingProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingTour({ open, onClose }: OnboardingProps) {
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFinish = () => {
    localStorage.setItem('locall-onboarding-completed', 'true');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
              🚀 Welcome to Locall
            </Typography>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mt: 1 }}>
            Let's get you started with a quick tour
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {onboardingSteps.map((step, index) => (
              <Step key={step.title}>
                <StepLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                      {step.icon}
                    </Avatar>
                    <Typography variant="h6">{step.title}</Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {step.description}
                  </Typography>
                  {step.actions && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Quick Actions:</Typography>
                      {step.actions.map((action, actionIndex) => (
                        <Typography key={actionIndex} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                          {action}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  <Box sx={{ mb: 1 }}>
                    <Button
                      variant="contained"
                      onClick={index === onboardingSteps.length - 1 ? handleFinish : handleNext}
                      sx={{ mt: 1, mr: 1 }}
                      startIcon={index === onboardingSteps.length - 1 ? <CheckIcon /> : <NextIcon />}
                    >
                      {index === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

interface HelpCenterProps {
  open: boolean;
  onClose: () => void;
}

export function HelpCenter({ open, onClose }: HelpCenterProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const theme = useTheme();

  const renderShortcuts = () => (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Keyboard Shortcuts</Typography>
        <List dense>
          {keyboardShortcuts.map((shortcut, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemIcon>
                  <Box sx={{ 
                    p: 1, 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    minWidth: 80,
                    textAlign: 'center'
                  }}>
                    {shortcut.shortcut}
                  </Box>
                </ListItemIcon>
                <ListItemText primary={shortcut.description} />
              </ListItem>
              {index < keyboardShortcuts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.info.main})` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
              💡 Help Center
            </Typography>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mt: 1 }}>
            Get help and learn about platform features
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          {!selectedTopic ? (
            <>
              <Typography variant="h6" sx={{ mb: 3 }}>Help Topics</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
                {helpTopics.map((topic) => (
                  <Card
                    key={topic.id}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4,
                      }
                    }}
                    onClick={() => setSelectedTopic(topic.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {topic.icon}
                        </Avatar>
                        <Typography variant="h6">{topic.title}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {topic.description}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              
              {renderShortcuts()}
            </>
          ) : (
            <Box>
              <Button
                startIcon={<BackIcon />}
                onClick={() => setSelectedTopic(null)}
                sx={{ mb: 2 }}
              >
                Back to Topics
              </Button>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {helpTopics.find(t => t.id === selectedTopic)?.title}
              </Typography>
              <Typography variant="body1">
                Detailed help content for {selectedTopic} would go here...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function HelpSystem() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    // Show onboarding for new users
    const hasSeenOnboarding = localStorage.getItem('locall-onboarding-completed');
    if (!hasSeenOnboarding) {
      setTimeout(() => setOnboardingOpen(true), 2000);
    }
  }, []);

  return (
    <>
      {/* Help FAB */}
      <Zoom in={true}>
        <Fab
          color="info"
          onClick={() => setHelpOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            zIndex: 1200,
            background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976d2, #0288d1)',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          <HelpIcon />
        </Fab>
      </Zoom>

      <OnboardingTour
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />

      <HelpCenter
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </>
  );
}
