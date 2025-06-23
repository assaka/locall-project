"use client";
import React, { useState } from "react";
import { Box, Typography, Card, Button, TextField, Alert, Stack, CircularProgress, Container } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const FormPage: React.FC = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setError("");
    const res = await fetch("/api/form-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, message }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) setStatus("Form submitted successfully!");
    else setError(data.error || "Submission failed");
  };

  return (
    <Box sx={{ bgcolor: '#f7faff', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="sm">
        <Button component="a" href="/" startIcon={<ArrowBackIcon />} sx={{ mb: 3, fontWeight: 600, textTransform: 'none' }} color="primary" variant="text">
          Back to Home
        </Button>
        <Card sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, boxShadow: 6, mb: 4, textAlign: 'center' }}>
          <Box sx={{ bgcolor: 'primary.main', color: '#fff', width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, mx: 'auto', mb: 3, boxShadow: 2 }}>
            <EditNoteIcon fontSize="inherit" />
          </Box>
          <Typography variant="h4" fontWeight={800} mb={1}>
            Submit a Form
          </Typography>
          <Typography color="text.secondary" mb={4} sx={{ fontSize: 18 }}>
            Send a message and track submissions in real time.
          </Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3} mb={2}>
              <TextField
                label="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Your name"
                size="medium"
                sx={{ bgcolor: '#fff', borderRadius: 2 }}
              />
              <TextField
                label="Phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                placeholder="+1..."
                size="medium"
                sx={{ bgcolor: '#fff', borderRadius: 2 }}
              />
              <TextField
                label="Message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                placeholder="Type your message..."
                size="medium"
                multiline
                minRows={3}
                sx={{ bgcolor: '#fff', borderRadius: 2 }}
              />
              <Button type="submit" variant="contained" startIcon={<EditNoteIcon />} disabled={loading} sx={{ fontWeight: 700, px: 4, py: 1.5, borderRadius: 2 }}>
                {loading ? <CircularProgress size={20} color="inherit" /> : "Submit"}
              </Button>
            </Stack>
          </form>
          {status && <Alert severity="success" sx={{ my: 3 }}>{status}</Alert>}
          {error && <Alert severity="error" sx={{ my: 3 }}>{error}</Alert>}
        </Card>
      </Container>
    </Box>
  );
};

export default FormPage;
