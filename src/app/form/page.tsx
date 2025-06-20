"use client";
import React, { useState } from "react";
import { Box, Typography, Card, Button, TextField, Alert, Stack, CircularProgress } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';

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
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Submit a Form
      </Typography>
      <Card sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Your name"
              size="small"
            />
            <TextField
              label="Phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              placeholder="+1..."
              size="small"
            />
            <TextField
              label="Message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              placeholder="Type your message..."
              size="small"
              multiline
              minRows={3}
            />
            <Button type="submit" variant="contained" startIcon={<EditNoteIcon />} disabled={loading}>
              {loading ? <CircularProgress size={20} color="inherit" /> : "Submit"}
            </Button>
          </Stack>
        </form>
      </Card>
      {status && <Alert severity="success" sx={{ mb: 2 }}>{status}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    </Box>
  );
};

export default FormPage; 