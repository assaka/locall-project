'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tab,
  Tabs,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Avatar,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip
} from '@mui/material';
import {
  CardGiftcard as RewardsIcon,
  Share as ReferralIcon,
  TrendingUp as GrowthIcon,
  Person as PersonIcon,
  ContentCopy as CopyIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Link as LinkIcon,
  Star as PointsIcon,
  EmojiEvents as TrophyIcon,
  History as HistoryIcon,
  Analytics as AnalyticsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CheckCircle as SuccessIcon,
  Cancel as CancelIcon,
  MonetizationOn as CashIcon
} from '@mui/icons-material';
import { Grid as FixedGrid } from '@/components/FixedGrid';
import DashboardLayout from '@/components/DashboardLayout';

interface LoyaltyProgram {
  id: string;
  name: string;
  type: 'points' | 'tier' | 'cashback';
  status: 'active' | 'paused' | 'draft';
  points_per_dollar: number;
  redemption_rate: number;
  tier_benefits: any;
  created_at: string;
}

interface ReferralProgram {
  id: string;
  name: string;
  referrer_reward: number;
  referee_reward: number;
  reward_type: 'points' | 'cash' | 'discount';
  max_referrals: number;
  expiry_days: number;
  status: 'active' | 'paused';
  created_at: string;
}

interface UserLoyalty {
  id: string;
  user_id: string;
  program_id: string;
  points_balance: number;
  tier: string;
  lifetime_points: number;
  referral_code: string;
  referrals_made: number;
  total_earned: number;
  user: {
    name: string;
    email: string;
  };
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
      id={`loyalty-tabpanel-${index}`}
      aria-labelledby={`loyalty-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LoyaltyPage() {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>([]);
  const [referralPrograms, setReferralPrograms] = useState<ReferralProgram[]>([]);
  const [userLoyalty, setUserLoyalty] = useState<UserLoyalty[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [createDialog, setCreateDialog] = useState(false);
  const [programType, setProgramType] = useState<'loyalty' | 'referral'>('loyalty');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch loyalty programs
      const loyaltyResponse = await fetch('/api/loyalty/programs');
      const loyaltyData = await loyaltyResponse.json();
      if (loyaltyData.success) {
        setLoyaltyPrograms(loyaltyData.programs || []);
      }

      // Fetch referral programs
      const referralResponse = await fetch('/api/referrals/programs');
      const referralData = await referralResponse.json();
      if (referralData.success) {
        setReferralPrograms(referralData.programs || []);
      }

      // Fetch user loyalty data
      const usersResponse = await fetch('/api/loyalty/users');
      const usersData = await usersResponse.json();
      if (usersData.success) {
        setUserLoyalty(usersData.users || []);
      }

      // Fetch analytics
      const analyticsResponse = await fetch('/api/loyalty/analytics');
      const analyticsData = await analyticsResponse.json();
      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics || {});
      }

    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async () => {
    try {
      const endpoint = programType === 'loyalty' ? '/api/loyalty/programs' : '/api/referrals/programs';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setCreateDialog(false);
        setFormData({});
        fetchData();
      }
    } catch (error) {
      console.error('Error creating program:', error);
    }
  };

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/refer/${code}`);
  };

  const shareReferral = (code: string, platform: string) => {
    const url = `${window.location.origin}/refer/${code}`;
    const text = 'Join me and get rewards!';
    
    switch (platform) {
      case 'email':
        window.open(`mailto:?subject=${text}&body=Use my referral link: ${url}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${text} ${url}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
        break;
    }
  };

  const OverviewCards = () => (
    <FixedGrid container spacing={3} sx={{ mb: 3 }}>
      <FixedGrid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Active Members
                </Typography>
                <Typography variant="h4">
                  {analytics.active_members || 0}
                </Typography>
                <Typography color="success.main" variant="body2">
                  +{analytics.new_members_this_month || 0} this month
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <PersonIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </FixedGrid>

      <FixedGrid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Points Distributed
                </Typography>
                <Typography variant="h4">
                  {(analytics.total_points_distributed || 0).toLocaleString()}
                </Typography>
                <Typography color="info.main" variant="body2">
                  ${(analytics.points_value || 0).toFixed(2)} value
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <PointsIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </FixedGrid>

      <FixedGrid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Referrals Made
                </Typography>
                <Typography variant="h4">
                  {analytics.total_referrals || 0}
                </Typography>
                <Typography color="warning.main" variant="body2">
                  {((analytics.referral_conversion_rate || 0) * 100).toFixed(1)}% conversion
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <ReferralIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </FixedGrid>

      <FixedGrid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Revenue Impact
                </Typography>
                <Typography variant="h4">
                  ${(analytics.revenue_impact || 0).toLocaleString()}
                </Typography>
                <Typography color="success.main" variant="body2">
                  {((analytics.roi || 0) * 100).toFixed(1)}% ROI
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <GrowthIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </FixedGrid>
    </FixedGrid>
  );

  const LoyaltyProgramCard = ({ program }: { program: LoyaltyProgram }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {program.name}
            </Typography>
            <Chip 
              label={program.status} 
              color={program.status === 'active' ? 'success' : 'default'}
              size="small"
            />
          </Box>
          <Box>
            <IconButton size="small">
              <EditIcon />
            </IconButton>
            <IconButton size="small">
              <ViewIcon />
            </IconButton>
          </Box>
        </Box>
        
        <FixedGrid container spacing={2}>
          <FixedGrid item xs={12} sm={4}>
            <Typography variant="body2" color="textSecondary">
              Type
            </Typography>
            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
              {program.type}
            </Typography>
          </FixedGrid>
          <FixedGrid item xs={12} sm={4}>
            <Typography variant="body2" color="textSecondary">
              Points per $1
            </Typography>
            <Typography variant="body1">
              {program.points_per_dollar}
            </Typography>
          </FixedGrid>
          <FixedGrid item xs={12} sm={4}>
            <Typography variant="body2" color="textSecondary">
              Redemption Rate
            </Typography>
            <Typography variant="body1">
              {program.redemption_rate}%
            </Typography>
          </FixedGrid>
        </FixedGrid>
      </CardContent>
    </Card>
  );

  const ReferralProgramCard = ({ program }: { program: ReferralProgram }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {program.name}
            </Typography>
            <Chip 
              label={program.status} 
              color={program.status === 'active' ? 'success' : 'default'}
              size="small"
            />
          </Box>
          <Box>
            <IconButton size="small">
              <EditIcon />
            </IconButton>
            <IconButton size="small">
              <ViewIcon />
            </IconButton>
          </Box>
        </Box>

        <FixedGrid container spacing={2}>
          <FixedGrid item xs={12} sm={3}>
            <Typography variant="body2" color="textSecondary">
              Referrer Reward
            </Typography>
            <Typography variant="body1">
              {program.referrer_reward} {program.reward_type}
            </Typography>
          </FixedGrid>
          <FixedGrid item xs={12} sm={3}>
            <Typography variant="body2" color="textSecondary">
              Referee Reward
            </Typography>
            <Typography variant="body1">
              {program.referee_reward} {program.reward_type}
            </Typography>
          </FixedGrid>
          <FixedGrid item xs={12} sm={3}>
            <Typography variant="body2" color="textSecondary">
              Max Referrals
            </Typography>
            <Typography variant="body1">
              {program.max_referrals || 'Unlimited'}
            </Typography>
          </FixedGrid>
          <FixedGrid item xs={12} sm={3}>
            <Typography variant="body2" color="textSecondary">
              Expires
            </Typography>
            <Typography variant="body1">
              {program.expiry_days} days
            </Typography>
          </FixedGrid>
        </FixedGrid>
      </CardContent>
    </Card>
  );

  const UserLoyaltyCard = ({ user }: { user: UserLoyalty }) => (
    <ListItem>
      <ListItemAvatar>
        <Avatar>
          {user.user.name.charAt(0).toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={user.user.name}
        secondary={
          <Box>
            <Typography variant="body2" color="textSecondary">
              {user.user.email}
            </Typography>
            <Box display="flex" gap={2} mt={1}>
              <Chip 
                size="small" 
                icon={<PointsIcon />} 
                label={`${user.points_balance} points`} 
              />
              <Chip 
                size="small" 
                icon={<TrophyIcon />} 
                label={user.tier} 
                color="primary"
              />
              <Chip 
                size="small" 
                icon={<ReferralIcon />} 
                label={`${user.referrals_made} referrals`} 
                color="secondary"
              />
            </Box>
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Copy Referral Link">
            <IconButton 
              size="small" 
              onClick={() => copyReferralCode(user.referral_code)}
            >
              <CopyIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="body2" color="textSecondary">
            ${user.total_earned}
          </Typography>
        </Box>
      </ListItemSecondaryAction>
    </ListItem>
  );

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">
            Loyalty & Referrals
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialog(true)}
          >
            Create Program
          </Button>
        </Box>

        <OverviewCards />

        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={currentTab} 
              onChange={(e, newValue) => setCurrentTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Loyalty Programs" icon={<RewardsIcon />} />
              <Tab label="Referral Programs" icon={<ReferralIcon />} />
              <Tab label="Members" icon={<PersonIcon />} />
              <Tab label="Analytics" icon={<AnalyticsIcon />} />
            </Tabs>
          </Box>

          {loading ? (
            <LinearProgress />
          ) : (
            <>
              <TabPanel value={currentTab} index={0}>
                {loyaltyPrograms.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <RewardsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No loyalty programs found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Create your first loyalty program to start rewarding customers
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setProgramType('loyalty');
                        setCreateDialog(true);
                      }}
                    >
                      Create Loyalty Program
                    </Button>
                  </Box>
                ) : (
                  loyaltyPrograms.map((program) => (
                    <LoyaltyProgramCard key={program.id} program={program} />
                  ))
                )}
              </TabPanel>

              <TabPanel value={currentTab} index={1}>
                {referralPrograms.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <ReferralIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No referral programs found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Create a referral program to grow through word-of-mouth
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setProgramType('referral');
                        setCreateDialog(true);
                      }}
                    >
                      Create Referral Program
                    </Button>
                  </Box>
                ) : (
                  referralPrograms.map((program) => (
                    <ReferralProgramCard key={program.id} program={program} />
                  ))
                )}
              </TabPanel>

              <TabPanel value={currentTab} index={2}>
                <List>
                  {userLoyalty.map((user) => (
                    <React.Fragment key={user.id}>
                      <UserLoyaltyCard user={user} />
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </TabPanel>

              <TabPanel value={currentTab} index={3}>
                <FixedGrid container spacing={3}>
                  <FixedGrid item xs={12} md={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Program Performance
                      </Typography>
                      {/* Add charts here */}
                      <Alert severity="info">
                        Analytics charts will be implemented with your preferred charting library
                      </Alert>
                    </Card>
                  </FixedGrid>
                  <FixedGrid item xs={12} md={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Member Growth
                      </Typography>
                      {/* Add charts here */}
                      <Alert severity="info">
                        Member growth charts will be implemented with your preferred charting library
                      </Alert>
                    </Card>
                  </FixedGrid>
                </FixedGrid>
              </TabPanel>
            </>
          )}
        </Card>

        {/* Create Program Dialog */}
        <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Create {programType === 'loyalty' ? 'Loyalty' : 'Referral'} Program
          </DialogTitle>
          <DialogContent>
            <FixedGrid container spacing={3} sx={{ mt: 1 }}>
              <FixedGrid item xs={12}>
                <TextField
                  fullWidth
                  label="Program Name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </FixedGrid>
              
              {programType === 'loyalty' ? (
                <>
                  <FixedGrid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Program Type</InputLabel>
                      <Select
                        value={formData.type || 'points'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <MenuItem value="points">Points-Based</MenuItem>
                        <MenuItem value="tier">Tier-Based</MenuItem>
                        <MenuItem value="cashback">Cashback</MenuItem>
                      </Select>
                    </FormControl>
                  </FixedGrid>
                  <FixedGrid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Points per Dollar"
                      value={formData.points_per_dollar || ''}
                      onChange={(e) => setFormData({ ...formData, points_per_dollar: parseFloat(e.target.value) })}
                    />
                  </FixedGrid>
                </>
              ) : (
                <>
                  <FixedGrid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Referrer Reward"
                      value={formData.referrer_reward || ''}
                      onChange={(e) => setFormData({ ...formData, referrer_reward: parseFloat(e.target.value) })}
                    />
                  </FixedGrid>
                  <FixedGrid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Referee Reward"
                      value={formData.referee_reward || ''}
                      onChange={(e) => setFormData({ ...formData, referee_reward: parseFloat(e.target.value) })}
                    />
                  </FixedGrid>
                </>
              )}
            </FixedGrid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProgram} variant="contained">Create</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
