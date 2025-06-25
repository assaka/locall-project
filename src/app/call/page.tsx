"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography, Card, Button, TextField, Alert, Stack, CircularProgress, Container, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import CallIcon from '@mui/icons-material/Call';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { supabase } from '@/app/utils/supabaseClient';

const CallPage: React.FC = () => {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const workspaceIdParam = searchParams.get("workspace_id");
  const [from, setFrom] = useState(fromParam || "");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const user_id = user?.id;
    const res = await fetch("/api/twilio-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, user_id, workspace_id: workspaceIdParam }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.sid) setMessage(`Call initiated! SID: ${data.sid}`);
    else setError(data.error || "Call failed");
  };

  return (
    <Box sx={{ bgcolor: '#f7faff', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="sm">
        <Button component="a" href="/" startIcon={<ArrowBackIcon />} sx={{ mb: 3, fontWeight: 600, textTransform: 'none' }} color="primary" variant="text">
          Back to Home
        </Button>
        <Card sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, boxShadow: 6, mb: 4, textAlign: 'center' }}>
          <Box sx={{ bgcolor: 'primary.main', color: '#fff', width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, mx: 'auto', mb: 3, boxShadow: 2 }}>
            <CallIcon fontSize="inherit" />
          </Box>
          <Typography variant="h4" fontWeight={800} mb={1}>
            Initiate a Call
          </Typography>
          <Typography color="text.secondary" mb={4} sx={{ fontSize: 18 }}>
            Place a call from your Twilio number to any destination.
          </Typography>
          <form onSubmit={handleCall}>
            <Stack spacing={3} mb={2}>
              <TextField
                label="From (Twilio Number)"
                value={fromParam || ""}
                disabled
                fullWidth
              />
              <TextField
                label="To (Destination Number)"
                value={to}
                onChange={e => setTo(e.target.value)}
                required
                placeholder="+1..."
                size="medium"
                sx={{ bgcolor: '#fff', borderRadius: 2 }}
              />
              <Button type="submit" variant="contained" startIcon={<CallIcon />} disabled={loading} sx={{ fontWeight: 700, px: 4, py: 1.5, borderRadius: 2 }}>
                {loading ? <CircularProgress size={20} color="inherit" /> : "Call"}
              </Button>
            </Stack>
          </form>
          {message && <Alert severity="success" sx={{ my: 3 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ my: 3 }}>{error}</Alert>}
        </Card>
      </Container>
    </Box>
  );
};

export default CallPage; 