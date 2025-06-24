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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: numbersData } = await supabase
        .from("numbers")
        .select("id, phone_number, workspace_id, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      setNumbers((numbersData as NumberRow[]) || []);

      const { data: callsData } = await supabase
        .from("calls")
        .select("id, from, to, status, duration, recording_url, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      setCalls((callsData as Call[]) || []);

      const { data: formsData } = await supabase
        .from("form_submissions")
        .select("id, name, phone, message, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      setForms((formsData as FormSubmission[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

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
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearch(""); }} centered>
          <Tab icon={<PhoneIphoneIcon />} label="Numbers" />
          <Tab icon={<CallIcon />} label="Calls" />
          <Tab icon={<AssignmentIndIcon />} label="Form Submissions" />
        </Tabs>
        <CardContent>
          <Box mb={2} display="flex" justifyContent="flex-end">
            <TextField
              size="small"
              placeholder={tab === 0 ? "Search numbers..." : tab === 1 ? "Search calls..." : "Search forms..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              sx={{ width: 260 }}
            />
          </Box>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {tab === 0 && (
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
              )}
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
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
