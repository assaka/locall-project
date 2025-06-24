"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TimelineIcon from '@mui/icons-material/Timeline';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import CallIcon from '@mui/icons-material/Call';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import HomeIcon from '@mui/icons-material/Home';
import Link from "next/link";

interface NumberRow {
  id: string;
  phone_number: string;
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

export default function AnalyticsPage() {
  const [numbers, setNumbers] = useState<NumberRow[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: numbersData } = await supabase.from("numbers").select("id, phone_number, created_at").order("created_at", { ascending: false }).limit(100);
      setNumbers(numbersData || []);
      const { data: callsData } = await supabase.from("calls").select("id, from, to, status, duration, recording_url, created_at").order("created_at", { ascending: false }).limit(100);
      setCalls(callsData || []);
      const { data: formsData } = await supabase.from("form_submissions").select("id, name, phone, message, created_at").order("created_at", { ascending: false }).limit(100);
      setForms(formsData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const summary = [
    { label: "Numbers", value: numbers.length, icon: <PhoneIphoneIcon color="primary" /> },
    { label: "Calls", value: calls.length, icon: <CallIcon color="success" /> },
    { label: "Forms", value: forms.length, icon: <AssignmentIndIcon color="warning" /> },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box mb={3}>
        <Button
          component={Link}
          href="/"
          variant="outlined"
          startIcon={<HomeIcon />}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          Back to Home
        </Button>
      </Box>
      <Box mb={4} textAlign="center">
        <Typography variant="h4" fontWeight={800} gutterBottom>
          <TimelineIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 36 }} /> Analytics & User Journey
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={3}>
          Visualize your numbers, calls, forms, and user journey in one place.
        </Typography>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : (
        <>
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
              {[...calls, ...forms].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10).map((event) => (
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
        </>
      )}
    </Container>
  );
} 