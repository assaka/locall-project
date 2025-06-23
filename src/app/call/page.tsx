"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography, Card, Button, TextField, Alert, Stack, CircularProgress } from '@mui/material';
import CallIcon from '@mui/icons-material/Call';

const CallPage: React.FC = () => {
  const searchParams = useSearchParams();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromNumber = searchParams.get("from");
    if (fromNumber) {
      setFrom(fromNumber);
    }
  }, [searchParams]);

  const handleCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const res = await fetch("/api/twilio-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.sid) setMessage(`Call initiated! SID: ${data.sid}`);
    else setError(data.error || "Call failed");
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Initiate a Call
      </Typography>
      <Card sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleCall}>
          <Stack spacing={3}>
            <TextField
              label="From (Twilio Number)"
              value={from}
              onChange={e => setFrom(e.target.value)}
              required
              placeholder="+1..."
              size="small"
            />
            <TextField
              label="To (Destination Number)"
              value={to}
              onChange={e => setTo(e.target.value)}
              required
              placeholder="+1..."
              size="small"
            />
            <Button type="submit" variant="contained" startIcon={<CallIcon />} disabled={loading}>
              {loading ? <CircularProgress size={20} color="inherit" /> : "Call"}
            </Button>
          </Stack>
        </form>
      </Card>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    </Box>
  );
};

export default CallPage; 