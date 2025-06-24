"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import CallIcon from '@mui/icons-material/Call';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import Button from "@mui/material/Button";
import HomeIcon from "@mui/icons-material/Home";
import Link from "next/link";
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import BusinessIcon from '@mui/icons-material/Business';
import FilterListIcon from '@mui/icons-material/FilterList';
import TimelineIcon from '@mui/icons-material/Timeline';
import GroupIcon from '@mui/icons-material/Group';
import { ensurePersonalWorkspace } from "@/app/utils/ensurePersonalWorkspace";
import AddIcCallIcon from '@mui/icons-material/AddIcCall';
import Tooltip from '@mui/material/Tooltip';

interface NumberRow {
  id: string;
  phone_number: string;
  workspace_id?: string | null;
  created_at: string;
}

interface Call {
  id: string;
  from: string;
  to: string;
  status: string;
  duration?: number | null;
  recording_url?: string | null;
  created_at: string;
}

interface FormSubmission {
  id: string;
  name: string | null;
  phone: string;
  message: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const [numbers, setNumbers] = useState<NumberRow[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string; agency_id: string }[]>([]);
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [selectedAgency, setSelectedAgency] = useState<string>("");
  const [members, setMembers] = useState<{ id: string; email: string; role: string }[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [membersTabLoading, setMembersTabLoading] = useState(false);
  const session = null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await ensurePersonalWorkspace({ id: user.id, email: user.email, name: user.user_metadata?.name });
      }
      const agencyRes = await supabase.from('agencies').select('id, name');
      const workspaceRes = await supabase.from('workspaces').select('id, name, agency_id');
      if (agencyRes.data) setAgencies(agencyRes.data);
      if (workspaceRes.data) setWorkspaces(workspaceRes.data);
      if (workspaceRes.data && workspaceRes.data.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(workspaceRes.data[0].id);
        setSelectedAgency(workspaceRes.data[0].agency_id);
      }
      const { data: numbersData } = await supabase
        .from("numbers")
        .select("id, phone_number, workspace_id, agency_id, created_at")
        .eq('workspace_id', selectedWorkspace)
        .eq('agency_id', selectedAgency)
        .order("created_at", { ascending: false })
        .limit(100);
      setNumbers((numbersData as NumberRow[]) || []);

      const { data: callsData } = await supabase
        .from("calls")
        .select("id, from, to, status, duration, recording_url, workspace_id, agency_id, created_at")
        .eq('workspace_id', selectedWorkspace)
        .eq('agency_id', selectedAgency)
        .order("created_at", { ascending: false })
        .limit(100);
      setCalls((callsData as Call[]) || []);

      const { data: formsData } = await supabase
        .from("form_submissions")
        .select("id, name, phone, message, workspace_id, agency_id, created_at")
        .eq('workspace_id', selectedWorkspace)
        .eq('agency_id', selectedAgency)
        .order("created_at", { ascending: false })
        .limit(100);
      setForms((formsData as FormSubmission[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [selectedWorkspace, selectedAgency]);

  useEffect(() => {
    if (tab === 4 && selectedWorkspace) {
      setMembersTabLoading(true);
      supabase
        .from('workspace_members')
        .select('id, role, user_id, users(email)')
        .eq('workspace_id', selectedWorkspace)
        .then(({ data }) => {
          setMembers((data || []).map((m: any) => ({ id: m.user_id, email: m.users?.email || '', role: m.role })));
          setMembersTabLoading(false);
        });
    }
  }, [tab, selectedWorkspace]);

  const handleInvite = async () => {
    setInviteStatus(null);
    const { error } = await supabase.from('invitations').insert({ email: inviteEmail, workspace_id: selectedWorkspace });
    if (error) {
      setInviteStatus('Failed to send invite.');
    } else {
      setInviteStatus('Invitation sent!');
      setInviteEmail("");
    }
  };

  const filteredNumbers = numbers.filter(n => n.phone_number.includes(search));
  const filteredCalls = calls.filter(c => c.from.includes(search) || c.to.includes(search));
  const filteredForms = forms.filter(f => (f.name || "").toLowerCase().includes(search.toLowerCase()) || f.phone.includes(search));

  const summary = [
    { label: "Numbers", value: numbers.length, icon: <PhoneIphoneIcon color="primary" /> },
    { label: "Calls", value: calls.length, icon: <CallIcon color="success" /> },
    { label: "Forms", value: forms.length, icon: <AssignmentIndIcon color="warning" /> },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box mb={2} display="flex" justifyContent="flex-start">
        <Button
          component={Link}
          href="/"
          variant="outlined"
          startIcon={<HomeIcon />}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          Home
        </Button>
      </Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={800} align="center" gutterBottom>
          Welcome to Smart Dashboard
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" mb={3}>
          All your numbers, calls, and form submissions in one place.
        </Typography>
        <Box display="flex" justifyContent="center" gap={3} mb={2}>
          {summary.map((s, i) => (
            <Card key={s.label} sx={{ minWidth: 120, px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, boxShadow: 2 }}>
              {s.icon}
              <Box>
                <Typography fontWeight={700} fontSize={22}>{s.value}</Typography>
                <Typography fontSize={14} color="text.secondary">{s.label}</Typography>
              </Box>
            </Card>
          ))}
        </Box>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <FilterListIcon color="action" sx={{ mr: 1 }} />
        <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 2 }}>
          Filters:
        </Typography>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="workspace-label">Workspace</InputLabel>
          <Select
            labelId="workspace-label"
            label="Workspace"
            value={selectedWorkspace}
            onChange={e => {
              setSelectedWorkspace(e.target.value);
              const ws = workspaces.find(w => w.id === e.target.value);
              if (ws) setSelectedAgency(ws.agency_id);
            }}
          >
            {workspaces.map(ws => (
              <MenuItem key={ws.id} value={ws.id}>{ws.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <BusinessIcon color="secondary" />
        <FormControl variant="outlined" size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="agency-label">Agency</InputLabel>
          <Select
            labelId="agency-label"
            label="Agency"
            value={selectedAgency}
            onChange={e => setSelectedAgency(e.target.value)}
          >
            {agencies.map(ag => (
              <MenuItem key={ag.id} value={ag.id}>{ag.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(Number(v)); setSearch(""); }} centered>
          <Tab icon={<PhoneIphoneIcon />} label="Numbers" />
          <Tab icon={<CallIcon />} label="Calls" />
          <Tab icon={<AssignmentIndIcon />} label="Form Submissions" />
          <Tab icon={<TimelineIcon />} label="Analytics" />
          <Tab icon={<GroupIcon />} label="Members" />
        </Tabs>
        <CardContent>
          <Box mb={2} display="flex" alignItems="center" justifyContent="space-between" gap={2}>
            <TextField
              size="small"
              placeholder="Search numbers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              sx={{ width: 260 }}
            />
            <Tooltip title="Purchase a new phone number for your workspace" arrow>
              <Button
                variant="contained"
                color="primary"
                size="small"
                component={Link}
                href="/purchase"
                startIcon={<AddIcCallIcon />}
                sx={{ fontWeight: 700, px: 2, py: 0.5, borderRadius: 1, fontSize: 14, boxShadow: 1, minWidth: 0 }}
              >
                Buy Number
              </Button>
            </Tooltip>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Workspace</TableCell>
                  <TableCell>Purchased At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredNumbers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ color: 'text.disabled', py: 6 }}>
                      <InfoOutlinedIcon sx={{ mb: 1 }} />
                      <br />No numbers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNumbers.map((num, idx) => (
                    <TableRow key={num.id} sx={{ backgroundColor: idx % 2 === 0 ? 'grey.50' : 'background.paper' }}>
                      <TableCell>
                        <a href={`tel:${num.phone_number}`} style={{ color: '#1976d2', textDecoration: 'none' }}>{num.phone_number}</a>
                      </TableCell>
                      <TableCell>{num.workspace_id || '-'}</TableCell>
                      <TableCell>{new Date(num.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {tab === 1 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Recording</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCalls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: 'text.disabled', py: 6 }}>
                        <InfoOutlinedIcon sx={{ mb: 1 }} />
                        <br />No calls found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCalls.map((call, idx) => (
                      <TableRow key={call.id} sx={{ backgroundColor: idx % 2 === 0 ? 'grey.50' : 'background.paper' }}>
                        <TableCell>
                          <a href={`tel:${call.from}`} style={{ color: '#1976d2', textDecoration: 'none' }}>{call.from}</a>
                        </TableCell>
                        <TableCell>
                          <a href={`tel:${call.to}`} style={{ color: '#1976d2', textDecoration: 'none' }}>{call.to}</a>
                        </TableCell>
                        <TableCell>
                          <Chip label={call.status} color={call.status === 'completed' ? 'success' : call.status === 'failed' ? 'error' : 'warning'} size="small" />
                        </TableCell>
                        <TableCell>{call.duration ? `${call.duration} sec` : '-'}</TableCell>
                        <TableCell>
                          {call.recording_url ? (
                            <a href={call.recording_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>Listen</a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{new Date(call.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {tab === 2 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredForms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ color: 'text.disabled', py: 6 }}>
                        <InfoOutlinedIcon sx={{ mb: 1 }} />
                        <br />No form submissions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredForms.map((form, idx) => (
                      <TableRow key={form.id} sx={{ backgroundColor: idx % 2 === 0 ? 'grey.50' : 'background.paper' }}>
                        <TableCell>{form.name}</TableCell>
                        <TableCell>
                          <a href={`tel:${form.phone}`} style={{ color: '#1976d2', textDecoration: 'none' }}>{form.phone}</a>
                        </TableCell>
                        <TableCell>{form.message}</TableCell>
                        <TableCell>{new Date(form.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {tab === 3 && (
            <Box>
              {/* Summary Cards */}
              <Box display="flex" justifyContent="center" gap={3} mb={4}>
                {summary.map((s, i) => (
                  <Card key={s.label} sx={{ minWidth: 120, px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, boxShadow: 2 }}>
                    {s.icon}
                    <Box>
                      <Typography fontWeight={700} fontSize={22}>{s.value}</Typography>
                      <Typography fontSize={14} color="text.secondary">{s.label}</Typography>
                    </Box>
                  </Card>
                ))}
              </Box>
              {/* Funnel Visualization */}
              <Box mb={4} textAlign="center">
                <Typography variant="h6" fontWeight={700} mb={2}>Conversion Funnel</Typography>
                <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
                  <Box>
                    <Typography fontWeight={700} color="primary.main">{numbers.length}</Typography>
                    <Typography fontSize={14}>Numbers</Typography>
                  </Box>
                  <Box sx={{ width: 40, height: 4, bgcolor: 'primary.main', borderRadius: 2 }} />
                  <Box>
                    <Typography fontWeight={700} color="success.main">{calls.length}</Typography>
                    <Typography fontSize={14}>Calls</Typography>
                  </Box>
                  <Box sx={{ width: 40, height: 4, bgcolor: 'success.main', borderRadius: 2 }} />
                  <Box>
                    <Typography fontWeight={700} color="warning.main">{forms.length}</Typography>
                    <Typography fontSize={14}>Forms</Typography>
                  </Box>
                </Box>
              </Box>
              {/* Timeline of Recent Events */}
              <Box>
                <Typography variant="h6" fontWeight={700} mb={2}>Recent Activity Timeline</Typography>
                <Box>
                  {[...calls, ...forms].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10).map((event, idx) => (
                    <Box key={event.id} display="flex" alignItems="center" gap={2} mb={1}>
                      <Chip label={"from" in event ? "Call" : "Form"} color={"from" in event ? "success" : "warning"} size="small" />
                      <Typography fontWeight={600}>
                        {"from" in event ? `${event.from} → ${event.to}` : event.name || event.phone}
                      </Typography>
                      <Typography color="text.secondary" fontSize={13}>
                        {new Date(event.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
          {tab === 4 && (
            <Box>
              <Typography variant="h6" fontWeight={700} mb={2}>Workspace Members</Typography>
              {membersTabLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}><CircularProgress /></Box>
              ) : (
                <Box mb={3}>
                  {members.length === 0 ? (
                    <Typography color="text.secondary">No members found.</Typography>
                  ) : (
                    <Box>
                      {members.map((m) => (
                        <Box key={m.id} display="flex" alignItems="center" gap={2} mb={1}>
                          <Typography fontWeight={600}>{m.email}</Typography>
                          <Chip label={m.role} color={m.role === 'admin' ? 'primary' : 'default'} size="small" />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
              {/* Invite form (show only if admin) */}
              {/* TODO: Replace session.user.id with actual user id from auth context */}
              {true && (
                <Box component="form" onSubmit={e => { e.preventDefault(); handleInvite(); }} display="flex" gap={2} alignItems="center">
                  <TextField
                    size="small"
                    label="Invite by Email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    type="email"
                    required
                  />
                  <Button type="submit" variant="contained" color="primary">Invite</Button>
                  {inviteStatus && <Typography color="success.main" fontSize={14}>{inviteStatus}</Typography>}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
