"use client";
import { useEffect, useState, Suspense } from "react";
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
import Link from "next/link";
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Divider from '@mui/material/Divider';
import FilterListIcon from '@mui/icons-material/FilterList';
import TimelineIcon from '@mui/icons-material/Timeline';
import GroupIcon from '@mui/icons-material/Group';
import { ensurePersonalWorkspace } from "@/app/utils/ensurePersonalWorkspace";
import AddIcCallIcon from '@mui/icons-material/AddIcCall';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface NumberRow {
  id: string;
  phone_number: string;
  workspace_id?: string | null;
  purchased_at: string;
}

interface Call {
  id: string;
  from_number: string;
  to_number: string;
  status: string;
  duration?: number | null;
  recording_url?: string | null;
  created_at: string;
  user_id: string;
}

interface FormSubmission {
  id: string;
  workspace_id: string;
  agency_id: string | null;
  user_id: string | null;
  form_name: string;
  submitted_at: string;
  data: Record<string, unknown>;
  source: string | null;
  ip_address: string | null;
  user_agent: string | null;
}

interface Member {
  user_id: string;
  users?: { email?: string };
  role: string;
}

export default function DashboardPage() {
  const [numbers, setNumbers] = useState<NumberRow[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [membersTabLoading, setMembersTabLoading] = useState(false);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteCallId, setNoteCallId] = useState<string | null>(null);
  const [noteMessage, setNoteMessage] = useState('');
  const [noteType, setNoteType] = useState('note');
  const [callEvents, setCallEvents] = useState<Record<string, unknown[]>>({});
  const [profileTabVisitorId, setProfileTabVisitorId] = useState('');
  const [profileTabEvents, setProfileTabEvents] = useState<unknown[]>([]);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotLoggedIn(true);
        return;
      }
      await ensurePersonalWorkspace({ id: user.id, email: user.email, name: user.user_metadata?.name });
      const workspaceRes = await supabase.from('workspaces').select('id, name');
      if (workspaceRes.data) {
        setWorkspaces(workspaceRes.data);
        if (!selectedWorkspace && workspaceRes.data.length > 0) {
          setSelectedWorkspace(workspaceRes.data[0].id);
        }
      }
    };
    fetchWorkspaces();
  }, [selectedWorkspace]);

  useEffect(() => {
    if (!selectedWorkspace) return;
    const fetchData = async () => {
      const { data: numbersData } = await supabase
        .from("numbers")
        .select("id, phone_number, workspace_id, purchased_at")
        .eq('workspace_id', selectedWorkspace)
        .order("purchased_at", { ascending: false })
        .limit(100);
      setNumbers((numbersData as NumberRow[]) || []);
      const { data: callsData } = await supabase
        .from("calls")
        .select("id, from_number, to_number, status, duration, recording_url, workspace_id, created_at, user_id")
        .eq('workspace_id', selectedWorkspace)
        .order("created_at", { ascending: false })
        .limit(100);
      setCalls((callsData as Call[]) || []);
      const { data: formsData } = await supabase
        .from("form_submissions")
        .select("id, workspace_id, user_id, form_name, submitted_at, data, source, ip_address, user_agent")
        .eq('workspace_id', selectedWorkspace)
        .order("submitted_at", { ascending: false })
        .limit(100);
      setForms((formsData as FormSubmission[]) || []);
    };
    fetchData();
  }, [selectedWorkspace]);

  useEffect(() => {
    if (tab === 4 && selectedWorkspace) {
      setMembersTabLoading(true);
      supabase
        .from('workspace_members')
        .select('id, role, user_id, users(email)')
        .eq('workspace_id', selectedWorkspace)
        .then(({ data }) => {
          setMembers((data as Member[]) || []);
          setMembersTabLoading(false);
        });
    }
  }, [tab, selectedWorkspace]);

  useEffect(() => {
    const fetchEvents = async () => {
      const eventsMap: Record<string, unknown[]> = {};
      for (const call of calls) {
        if (call.id) {
          const { data } = await supabase.from('calls').select('events').eq('id', call.id).single();
          eventsMap[call.id] = data?.events || [];
        }
      }
      setCallEvents(eventsMap);
    };
    if (calls.length > 0) fetchEvents();
  }, [calls]);

  const handleInvite = async () => {
    setInviteStatus('sending');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const inviterUserId = user?.id;
      const generatedInviteLink = `${window.location.origin}/auth?workspace_id=${selectedWorkspace}`;
      const payload = {
        email: inviteEmail,
        workspaceName: workspaces.find(ws => ws.id === selectedWorkspace)?.name,
        inviteLink: generatedInviteLink,
        workspace_id: selectedWorkspace,
        invited_by: inviterUserId,
      };
      const res = await fetch('/api/send-invite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteStatus('error');
        setInviteError(data.error || 'Failed to send invite');
        console.error('Invite error:', data.details || data.error);
      } else {
        setInviteStatus('sent');
        setInviteError('');
        console.log('Invite sent result:', data.result);
      }
    } catch (err) {
      setInviteStatus('error');
      setInviteError('Network or server error');
      console.error('Invite error:', err);
    }
  };

  const filteredNumbers = numbers.filter(n => n.phone_number.includes(search));
  const filteredCalls = calls.filter(c =>
    (selectedUser === "all" || c.user_id === selectedUser) &&
    (c.from_number.includes(search) || c.to_number.includes(search))
  );
  const filteredForms = forms.filter(f =>
    (selectedUser === "all" || f.user_id === selectedUser) &&
    (
      (f.form_name || "").toLowerCase().includes(search.toLowerCase()) ||
      ((f.data as { phone?: string }).phone ?? "").includes(search)
    )
  );

  const summary = [
    { label: "Numbers", value: numbers.length, icon: <PhoneIphoneIcon color="primary" /> },
    { label: "Calls", value: calls.length, icon: <CallIcon color="success" /> },
    { label: "Forms", value: forms.length, icon: <AssignmentIndIcon color="warning" /> },
  ];

  const handleOpenNoteDialog = (callId: string) => {
    setNoteCallId(callId);
    setNoteMessage('');
    setNoteType('note');
    setNoteDialogOpen(true);
  };

  const handleCloseNoteDialog = () => {
    setNoteDialogOpen(false);
    setNoteCallId(null);
    setNoteMessage('');
  };

  const handleAddNote = async () => {
    if (!noteCallId || !noteMessage) return;
    await fetch('/api/call-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call_id: noteCallId, type: noteType, message: noteMessage }),
    });
    handleCloseNoteDialog();
    const { data } = await supabase.from('calls').select('events').eq('id', noteCallId).single();
    setCallEvents(prev => ({ ...prev, [noteCallId]: data?.events || [] }));
  };

  const getCountsByDay = (items: { created_at?: string; submitted_at?: string }[], key: 'created_at' | 'submitted_at') => {
    const counts: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      counts[dateStr] = 0;
    }
    items.forEach(item => {
      const dateStr = (item[key] || '').slice(0, 10);
      if (dateStr in counts) counts[dateStr]++;
    });
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  };
  const callsByDay = getCountsByDay(calls, 'created_at');
  const formsByDay = getCountsByDay(forms, 'submitted_at');
  const topNumbers = Object.entries(
    calls.reduce((acc, c) => {
      acc[c.from_number] = (acc[c.from_number] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([number, count]) => ({ number, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];

  const handleSearchProfile = async () => {
    if (!profileTabVisitorId) return;
    const { data: callData } = await supabase.from('calls').select('*').eq('visitor_id', profileTabVisitorId).order('created_at', { ascending: false });
    const { data: formData } = await supabase.from('form_submissions').select('*').eq('visitor_id', profileTabVisitorId).order('submitted_at', { ascending: false });
    setProfileTabEvents([
      ...(callData || []),
      ...(formData || [])
    ].sort((a, b) => new Date('submitted_at' in b ? b.submitted_at : b.created_at).getTime() - new Date('submitted_at' in a ? a.submitted_at : a.created_at).getTime()));
  };

  if (notLoggedIn) {
    return (
      <Snackbar open={true} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <MuiAlert elevation={6} variant="filled" severity="warning">
          You must be logged in to view the dashboard.
        </MuiAlert>
      </Snackbar>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Container maxWidth="xl" sx={{ py: 8, background: '#fff', color: '#000' }}>
        <Box display="flex" alignItems="center" mb={2} gap={2}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ArrowBackIcon />}
            component={Link}
            href="/"
            sx={{ minWidth: 0, px: 2 }}
          >
            Back to Home
          </Button>
        </Box>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h3" fontWeight={900} align="center" gutterBottom>
            Welcome to Smart Dashboard
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" mb={3}>
            All your numbers, calls, and form submissions in one place.
          </Typography>
          <Box display="flex" justifyContent="center" gap={3} mb={2}>
            {summary.map((s) => (
              <Card key={s.label} sx={{ minWidth: 120, px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, boxShadow: 2 }}>
                {s.icon}
                <Box>
                  <Typography fontWeight={700} fontSize={22}>{s.value}</Typography>
                  <Typography fontSize={14} color="text.secondary">{s.label}</Typography>
                </Box>
              </Card>
            ))}
          </Box>
          <Box
            sx={{
              mt: 4,
              mb: 4,
              p: 3,
              background: '#fff',
              borderRadius: 4,
              boxShadow: 3,
              maxWidth: 1200,
              width: '100%',
            }}
          >
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
                  value={selectedWorkspace ?? ""}
                  onChange={e => {
                    setSelectedWorkspace(e.target.value);
                  }}
                >
                  {workspaces.map(ws => (
                    <MenuItem key={ws.id} value={ws.id}>{ws.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box flexGrow={1} />
              <FormControl variant="outlined" size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="user-label">User</InputLabel>
                <Select
                  labelId="user-label"
                  label="User"
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                >
                  <MenuItem value="all">All users</MenuItem>
                  {members.map(user => (
                    <MenuItem key={user.user_id} value={user.user_id}>{user.users?.email || user.user_id}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <PersonIcon color="action" />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Card sx={{ mb: 4, boxShadow: 3 }}>
              <Tabs value={tab} onChange={(_, v) => { setTab(Number(v)); setSearch(""); }} centered>
                <Tab icon={<PhoneIphoneIcon />} label="Numbers" />
                <Tab icon={<CallIcon />} label="Calls" />
                <Tab icon={<AssignmentIndIcon />} label="Form Submissions" />
                <Tab icon={<TimelineIcon />} label="Analytics" />
                <Tab icon={<GroupIcon />} label="Members" />
                <Tab icon={<EventIcon />} label="Appointments" />
                <Tab icon={<PersonIcon />} label="User Profiles" />
              </Tabs>
              <CardContent>
                <Box mb={2} display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                  <TextField
                    size="small"
                    placeholder="Search numbers..."
                    value={search ?? ""}
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
                      href={`/purchase?workspace_id=${selectedWorkspace}`}
                      startIcon={<AddIcCallIcon />}
                      sx={{ fontWeight: 700, px: 2, py: 0.5, borderRadius: 1, fontSize: 14, boxShadow: 1, minWidth: 0 }}
                    >
                      Buy Number
                    </Button>
                  </Tooltip>
                </Box>
                {tab === 0 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Phone Number</TableCell>
                          <TableCell>Purchased At</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredNumbers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ color: 'text.disabled', py: 6 }}>
                              <InfoOutlinedIcon sx={{ mb: 1 }} />
                              <br />No data found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredNumbers.map((num, idx) => (
                            <TableRow
                              key={num.id}
                              sx={{
                                backgroundColor: idx % 2 === 0 ? 'grey.50' : 'background.paper',
                                transition: 'background 0.2s',
                                '&:hover': { backgroundColor: 'primary.lighter' }
                              }}
                            >
                              <TableCell sx={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <Tooltip title={num.phone_number}>
                                  <span>{num.phone_number}</span>
                                </Tooltip>
                              </TableCell>
                              <TableCell>{new Date(num.purchased_at).toLocaleString()}</TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  component={Link}
                                  href={`/call?from=${encodeURIComponent(num.phone_number)}&workspace_id=${encodeURIComponent(num.workspace_id || "")}`}
                                  sx={{ mr: 1 }}
                                >
                                  Call
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  component={Link}
                                  href={`/form?from=${encodeURIComponent(num.phone_number)}&workspace_id=${encodeURIComponent(num.workspace_id || "")}`}
                                >
                                  Message
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                {tab === 1 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'grey.100' }}>
                          <TableCell>From</TableCell>
                          <TableCell>To</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Duration</TableCell>
                          <TableCell>Recording</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell>Events/Notes</TableCell>
                          <TableCell>Add Note</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredCalls.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ color: 'text.disabled', py: 6 }}>
                              <InfoOutlinedIcon sx={{ mb: 1 }} />
                              <br />No data found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredCalls.map((call, idx) => (
                            <TableRow
                              key={call.id}
                              sx={{
                                backgroundColor: idx % 2 === 0 ? 'grey.50' : 'background.paper',
                                transition: 'background 0.2s',
                                '&:hover': { backgroundColor: 'primary.lighter' }
                              }}
                            >
                              <TableCell sx={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <Tooltip title={call.from_number}>
                                  <span>{call.from_number}</span>
                                </Tooltip>
                              </TableCell>
                              <TableCell sx={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <Tooltip title={call.to_number}>
                                  <span>{call.to_number}</span>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Chip label={call.status} color={call.status === 'completed' ? 'success' : 'warning'} size="small" />
                              </TableCell>
                              <TableCell>{call.duration ? `${call.duration} sec` : '-'}</TableCell>
                              <TableCell>
                                {call.recording_url ? (
                                  <a href={call.recording_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>Listen</a>
                                ) : '-'}
                              </TableCell>
                              <TableCell>{new Date(call.created_at).toLocaleString()}</TableCell>
                              <TableCell>
                                <Box>
                                  {(callEvents[call.id] || []).map((event) => {
                                    const e = event as { id: string; type: string; message: string; timestamp: string };
                                    return (
                                      <Box key={e.id} mb={1}>
                                        <Chip label={e.type} size="small" sx={{ mr: 1 }} />
                                        <Typography component="span" fontSize={13}>{e.message}</Typography>
                                        <Typography component="span" color="text.secondary" fontSize={11} sx={{ ml: 1 }}>
                                          {new Date(e.timestamp).toLocaleString()}
                                        </Typography>
                                      </Box>
                                    );
                                  })}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Button size="small" variant="outlined" onClick={() => handleOpenNoteDialog(call.id)}>
                                  Add Note
                                </Button>
                              </TableCell>
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
                          <TableCell>Form Name</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Phone</TableCell>
                          <TableCell>Message</TableCell>
                          <TableCell>Time</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredForms.map((form) => (
                          <TableRow key={form.id}>
                            <TableCell>{form.form_name}</TableCell>
                            <TableCell>{(form.data as { name?: string }).name ?? '-'}</TableCell>
                            <TableCell>{(form.data as { phone?: string }).phone ?? '-'}</TableCell>
                            <TableCell>{(form.data as { message?: string }).message ?? '-'}</TableCell>
                            <TableCell>{new Date(form.submitted_at).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                {tab === 3 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} mb={2}>Analytics</Typography>
                    <Box display="flex" gap={4} flexWrap="wrap" mb={4}>
                      <Box flex={1} minWidth={320}>
                        <Typography fontWeight={600} mb={1}>Calls per Day (7d)</Typography>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={callsByDay}>
                            <XAxis dataKey="date" fontSize={12} />
                            <YAxis allowDecimals={false} fontSize={12} />
                            <RechartsTooltip />
                            <Bar dataKey="count" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box flex={1} minWidth={320}>
                        <Typography fontWeight={600} mb={1}>Forms per Day (7d)</Typography>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={formsByDay}>
                            <XAxis dataKey="date" fontSize={12} />
                            <YAxis allowDecimals={false} fontSize={12} />
                            <RechartsTooltip />
                            <Bar dataKey="count" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box flex={1} minWidth={320}>
                        <Typography fontWeight={600} mb={1}>Top Numbers (by Calls)</Typography>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={topNumbers} dataKey="count" nameKey="number" cx="50%" cy="50%" outerRadius={60} label>
                              {topNumbers.map((entry, idx) => (
                                <Cell key={entry.number} fill={COLORS[idx % COLORS.length]} />
                              ))}
                            </Pie>
                            <Legend />
                            <RechartsTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" fontWeight={700} mb={2}>User Journey Timeline</Typography>
                    <Box>
                      {[...calls, ...forms]
                        .sort((a, b) =>
                          new Date('submitted_at' in b ? b.submitted_at : b.created_at).getTime() -
                          new Date('submitted_at' in a ? a.submitted_at : a.created_at).getTime()
                        )
                        .slice(0, 20)
                        .map((event) => (
                          <Box key={event.id} display="flex" alignItems="center" gap={2} mb={1}>
                            <Chip label={"from_number" in event ? "Call" : "Form"} color={"from_number" in event ? "success" : "warning"} size="small" />
                            <Typography fontWeight={600}>
                              {"from_number" in event
                                ? `${event.from_number} → ${event.to_number}`
                                : (event as FormSubmission).form_name || ((event as FormSubmission).data as { phone?: string }).phone}
                            </Typography>
                            <Typography color="text.secondary" fontSize={13}>
                              {new Date("submitted_at" in event ? event.submitted_at : event.created_at).toLocaleString()}
                            </Typography>
                          </Box>
                        ))}
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
                              <Box key={m.user_id} display="flex" alignItems="center" gap={2} mb={1}>
                                <Typography fontWeight={600}>{m.users?.email || m.user_id}</Typography>
                                <Chip label={m.role} color={m.role === 'admin' ? 'primary' : 'default'} size="small" />
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}
                    {true && (
                      <Box component="form" onSubmit={e => { e.preventDefault(); handleInvite(); }} display="flex" gap={2} alignItems="center">
                        <TextField
                          size="small"
                          label="Invite by Email"
                          value={inviteEmail ?? ""}
                          onChange={e => setInviteEmail(e.target.value)}
                          type="email"
                          required
                        />
                        <Button type="submit" variant="contained" color="primary">Invite</Button>
                        {inviteStatus === 'sending' && <Typography color="text.secondary">Sending...</Typography>}
                        {inviteStatus === 'sent' && <Typography color="success.main" fontSize={14}>Invitation sent!</Typography>}
                        {inviteStatus === 'error' && <Typography color="error.main" fontSize={14}>{inviteError}</Typography>}
                      </Box>
                    )}
                  </Box>
                )}
                {tab === 5 && (
                  <Box sx={{ my: 4 }}>
                    <iframe
                      src="https://calendly.com/edwardp-dev2025/30min"
                      width="100%"
                      height="600"
                      frameBorder="0"
                      title="Book an Appointment"
                      style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    />
                  </Box>
                )}
                {tab === 6 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} mb={2}>User Profile Lookup</Typography>
                    <Box display="flex" gap={2} mb={2}>
                      <TextField
                        size="small"
                        label="Visitor ID"
                        value={profileTabVisitorId}
                        onChange={e => setProfileTabVisitorId(e.target.value)}
                        sx={{ width: 320 }}
                      />
                      <Button variant="contained" onClick={handleSearchProfile} startIcon={<SearchIcon />}>Search</Button>
                    </Box>
                    {profileTabEvents.length === 0 ? (
                      <Typography color="text.secondary">No events found for this visitor ID.</Typography>
                    ) : (
                      <Box>
                        {profileTabEvents.map((event) => {
                          const e = event as Call | FormSubmission;
                          return (
                            <Box key={e.id} display="flex" alignItems="center" gap={2} mb={1}>
                              <Chip label={"from_number" in e ? "Call" : "Form"} color={"from_number" in e ? "success" : "warning"} size="small" />
                              <Typography fontWeight={600}>
                                {"from_number" in e
                                  ? `${e.from_number} → ${e.to_number}`
                                  : (e as FormSubmission).form_name || ((e as FormSubmission).data as { phone?: string }).phone}
                              </Typography>
                              <Typography color="text.secondary" fontSize={13}>
                                {new Date("submitted_at" in e ? e.submitted_at : (e as Call).created_at).toLocaleString()}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
        <Dialog open={noteDialogOpen} onClose={handleCloseNoteDialog}>
          <DialogTitle>Add Note/Event</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select value={noteType} label="Type" onChange={e => setNoteType(e.target.value)}>
                <MenuItem value="note">Note</MenuItem>
                <MenuItem value="event">Event</MenuItem>
                <MenuItem value="flag">Flag</MenuItem>
              </Select>
            </FormControl>
            <TextField
              autoFocus
              margin="dense"
              label="Message"
              type="text"
              fullWidth
              value={noteMessage}
              onChange={e => setNoteMessage(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseNoteDialog}>Cancel</Button>
            <Button onClick={handleAddNote} variant="contained">Add</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Suspense>
  );
}
