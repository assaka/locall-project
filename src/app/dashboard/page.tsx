"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

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
  const [calls, setCalls] = useState<Call[]>([]);
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom align="center">
        Dashboard
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper elevation={3} sx={{ mb: 5, p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Recent Calls
            </Typography>
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
                      <TableCell colSpan={4} align="center">
                        No calls found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    calls.map((call) => (
                      <TableRow key={call.id}>
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
          </Paper>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Recent Form Submissions
            </Typography>
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
                      <TableCell colSpan={4} align="center">
                        No form submissions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    forms.map((form) => (
                      <TableRow key={form.id}>
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
          </Paper>
        </>
      )}
    </Container>
  );
} 