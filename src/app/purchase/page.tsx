"use client";
import React, { useState, Suspense } from "react";
import Link from "next/link";
import { Box, Typography, Card, Button, TextField, List, ListItem, Alert, Stack, CircularProgress, Container } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { supabase } from '@/app/utils/supabaseClient';
import { useSearchParams } from 'next/navigation';

function PurchasePageContent() {
  const [areaCode, setAreaCode] = useState("");
  const [numbers, setNumbers] = useState<unknown[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const searchParams = useSearchParams();
  const workspaceIdParam = searchParams.get("workspace_id");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setNumbers([]);
    setLoading(true);
    setStep(1);
    const res = await fetch("/api/twilio-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ search: areaCode }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.numbers && data.numbers.length > 0) {
      setNumbers(data.numbers);
      setStep(2);
    } else {
      setError(data.error || "No available numbers found for that area code. Please try a different one.");
      setStep(0);
    }
  };

  const handleBuy = async (number: string) => {
    setBuying(number);
    setMessage("");
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const user_id = user?.id;
    console.log("workspaceIdParam", workspaceIdParam);
    console.log("user_id", user_id);
    const res = await fetch("/api/twilio-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buy: number, user_id, workspace_id: workspaceIdParam }),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }
    const data = await res.json();
    setBuying(null);
    if (data.purchased) {
      setMessage(`Purchased: ${data.purchased.phoneNumber}`);
      setNumbers([]);
      setStep(3);
    } else {
      setError(data.error || "Purchase failed");
    }
  };

  return (
    <Box sx={{ bgcolor: '#f7faff', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="sm">
        <Button component={Link} href="/" startIcon={<ArrowBackIcon />} sx={{ mb: 3, fontWeight: 600, textTransform: 'none' }} color="primary" variant="text">
          Back to Home
        </Button>
        <Card sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, boxShadow: 6, mb: 4, textAlign: 'center', overflow: 'visible' }}>
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={step} alternativeLabel>
              <Step><StepLabel>Search</StepLabel></Step>
              <Step><StepLabel>Select</StepLabel></Step>
              <Step><StepLabel>Confirm</StepLabel></Step>
            </Stepper>
          </Box>
          <Box sx={{ bgcolor: 'primary.main', color: '#fff', width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, mx: 'auto', mb: 3, boxShadow: 2 }}>
            <PhoneIcon fontSize="inherit" />
          </Box>
          <Typography variant="h4" fontWeight={800} mb={1}>
            Purchase a Twilio Number
          </Typography>
          <Typography color="text.secondary" mb={4} sx={{ fontSize: 18 }}>
            Search and instantly buy a local or toll-free number.
          </Typography>
          {step === 0 && (
            <form onSubmit={handleSearch}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="center" mb={3}>
                <TextField
                  label="Area Code (US)"
                  value={areaCode}
                  onChange={e => setAreaCode(e.target.value)}
                  inputProps={{ maxLength: 3 }}
                  required
                  placeholder="e.g. 815"
                  size="medium"
                  sx={{ width: 160, bgcolor: '#fff', borderRadius: 2 }}
                />
                <Button type="submit" variant="contained" startIcon={<PhoneIcon />} disabled={loading} sx={{ fontWeight: 700, px: 4, py: 1.5, borderRadius: 2 }}>
                  {loading ? <CircularProgress size={20} color="inherit" /> : "Search"}
                </Button>
              </Stack>
            </form>
          )}
          {step === 2 && numbers.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Available Numbers:</Typography>
              <List sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {numbers.map((num) => {
                  const n = num as { phoneNumber: string };
                  return (
                    <ListItem key={n.phoneNumber} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#e8f0fe', borderRadius: 2, mb: 1, px: 2, boxShadow: 1, border: '2px solid transparent', transition: 'border 0.2s', '&:hover': { borderColor: 'primary.main', bgcolor: '#e3f2fd' } }}>
                      <Typography fontFamily="monospace" fontSize={18}>{n.phoneNumber}</Typography>
                      <Button
                        variant="contained"
                        color={buying === n.phoneNumber ? "inherit" : "primary"}
                        onClick={() => handleBuy(n.phoneNumber)}
                        disabled={buying === n.phoneNumber}
                        sx={{ ml: 2, fontWeight: 700 }}
                      >
                        {buying === n.phoneNumber ? <CircularProgress size={20} color="inherit" /> : "Buy"}
                      </Button>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
          {step === 3 && message && (
            <Box sx={{ mt: 4, mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CelebrationIcon color="success" sx={{ fontSize: 60 }} />
              <Typography variant="h5" fontWeight={700} color="success.main">Number Purchased!</Typography>
              <Typography fontSize={18} color="text.secondary">{message}</Typography>
              <Button
                component={Link}
                href="/dashboard"
                color="primary"
                size="large"
                variant="contained"
                sx={{ mt: 2, fontWeight: 700, px: 4 }}
                startIcon={<CheckCircleIcon />}
              >
                Go to Dashboard
              </Button>
            </Box>
          )}
          {error && <Alert severity="error" sx={{ my: 3 }}>{error}</Alert>}
        </Card>
      </Container>
    </Box>
  );
}

export default function PurchasePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PurchasePageContent />
    </Suspense>
  );
}
