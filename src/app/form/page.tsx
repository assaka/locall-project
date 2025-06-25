"use client";
import React, { useState, Suspense } from "react";
import { Box, Typography, Card, Button, TextField, Alert, Stack, CircularProgress, Container } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSearchParams } from "next/navigation";
import { supabase } from "@/app/utils/supabaseClient";
import { getVisitorId } from "@/app/utils/visitorId";

function FormPageContent() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const workspaceIdParam = searchParams.get("workspace_id");
  const formNameParam = searchParams.get("form_name") || "Contact Form";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const user_id = user?.id;
    const visitor_id = getVisitorId();
    const res = await fetch("/api/form-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        message,
        from: fromParam,
        workspace_id: workspaceIdParam,
        user_id: user_id,
        form_name: formNameParam,
        visitor_id,
      }),
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
          {fromParam ? (
            <Box mb={2}>
              <Typography variant="subtitle1" fontWeight={600}>
                From: <span style={{ color: "#1976d2" }}>{fromParam}</span>
              </Typography>
            </Box>
          ) : (
            <Alert severity="warning">No source number selected. Please start from the dashboard.</Alert>
          )}
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
              <input type="hidden" name="form_name" value={formNameParam} />
              <Button type="submit" variant="contained" startIcon={<EditNoteIcon />} disabled={loading || !fromParam} sx={{ fontWeight: 700, px: 4, py: 1.5, borderRadius: 2 }}>
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
}

export default function FormPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FormPageContent />
    </Suspense>
  );
}
