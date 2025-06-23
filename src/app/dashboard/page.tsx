"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import CallIcon from '@mui/icons-material/Call';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: numbersData } = await supabase
        .from("numbers")
        .select("id, phone_number, workspace_id, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      setNumbers((numbersData as NumberRow[]) || []);

      const { data: callsData } = await supabase
        .from("calls")
        .select("id, from, to, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      setCalls((callsData as Call[]) || []);

      const { data: formsData } = await supabase
        .from("form_submissions")
        .select("id, name, phone, message, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      setForms((formsData as FormSubmission[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box mb={5}>
        <Typography variant="h3" fontWeight={800} align="center" gutterBottom>
          📊 SaaS Call & Form Tracking Dashboard
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary">
          Manage your purchased numbers, track calls, and monitor form submissions in real time.
        </Typography>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <CircularProgress size={48} />
        </Box>
      ) : (
        <>
          <Card elevation={4} sx={{ mb: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              avatar={<PhoneIphoneIcon color="primary" fontSize="large" />}
              title={<Typography variant="h6" fontWeight={700}>Purchased Numbers</Typography>}
            />
            <Divider />
            <CardContent sx={{ flex: 1 }}>
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
                    {numbers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ color: 'text.disabled', py: 6 }}>
                          <InfoOutlinedIcon sx={{ mb: 1 }} />
                          <br />No numbers purchased yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      numbers.map((num, idx) => (
                        <TableRow key={num.id} sx={{ backgroundColor: idx % 2 === 0 ? 'grey.50' : 'background.paper' }}>
                          <TableCell>{num.phone_number}</TableCell>
                          <TableCell>{num.workspace_id || '-'}</TableCell>
                          <TableCell>{new Date(num.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
          <Card elevation={4} sx={{ mb: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              avatar={<CallIcon color="success" fontSize="large" />}
              title={<Typography variant="h6" fontWeight={700}>Recent Calls</Typography>}
            />
            <Divider />
            <CardContent sx={{ flex: 1 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ color: 'text.disabled', py: 6 }}>
                          <InfoOutlinedIcon sx={{ mb: 1 }} />
                          <br />No calls found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      calls.map((call, idx) => (
                        <TableRow key={call.id} sx={{ backgroundColor: idx % 2 === 0 ? 'grey.50' : 'background.paper' }}>
                          <TableCell>{call.from}</TableCell>
                          <TableCell>{call.to}</TableCell>
                          <TableCell>{call.status}</TableCell>
                          <TableCell>{new Date(call.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
          <Card elevation={4} sx={{ mb: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              avatar={<AssignmentIndIcon color="warning" fontSize="large" />}
              title={<Typography variant="h6" fontWeight={700}>Recent Form Submissions</Typography>}
            />
            <Divider />
            <CardContent sx={{ flex: 1 }}>
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
                    {forms.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ color: 'text.disabled', py: 6 }}>
                          <InfoOutlinedIcon sx={{ mb: 1 }} />
                          <br />No form submissions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      forms.map((form, idx) => (
                        <TableRow key={form.id} sx={{ backgroundColor: idx % 2 === 0 ? 'grey.50' : 'background.paper' }}>
                          <TableCell>{form.name}</TableCell>
                          <TableCell>{form.phone}</TableCell>
                          <TableCell>{form.message}</TableCell>
                          <TableCell>{new Date(form.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Container>
  );
} 