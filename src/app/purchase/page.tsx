"use client";
import React, { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { Box, Typography, Card, Button, TextField, List, ListItem, Alert, Stack, CircularProgress, Container, Tabs, Tab, MenuItem, Select, InputLabel, FormControl, Checkbox, ListItemText, OutlinedInput, Paper, Chip } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { supabase } from '@/app/utils/supabaseClient';
import { useSearchParams } from 'next/navigation';
import { COUNTRY_OPTIONS, COUNTRY_CODE_MAP } from '../constant/countries';

type AvailableNumber = { sid: string; phoneNumber: string; friendlyName?: string };

const TYPE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'landline', label: 'Landline' },
  { value: 'toll-free', label: 'Toll-Free' },
];
const FEATURE_OPTIONS = [
  { value: 'SMS', label: 'SMS' },
  { value: 'VOICE', label: 'Voice' },
  { value: 'MMS', label: 'MMS' },
];
const MATCH_TYPE_OPTIONS = [
  { value: 'contains', label: 'Contains' },
  { value: 'starts', label: 'Starts with' },
  { value: 'ends', label: 'Ends with' },
];

function formatFriendlyName(msisdn: string, country: string) {
  if (!msisdn) return '';
  if ((country === 'US' || country === 'CA') && msisdn.length === 11 && msisdn.startsWith('1')) {
    return `+1 ${msisdn.slice(1,4)}-${msisdn.slice(4,7)}-${msisdn.slice(7)}`;
  }
  if (country === 'GB' && msisdn.length === 12 && msisdn.startsWith('44')) {
    return `+44 ${msisdn.slice(2,6)} ${msisdn.slice(6)}`;
  }
  if (country === 'DE' && msisdn.length > 2 && msisdn.startsWith('49')) {
    return `+49 ${msisdn.slice(2,6)} ${msisdn.slice(6)}`;
  }
  if (country === 'FR' && msisdn.length === 11 && msisdn.startsWith('33')) {
    return `+33 ${msisdn.slice(2,3)} ${msisdn.slice(3,5)} ${msisdn.slice(5,7)} ${msisdn.slice(7,9)} ${msisdn.slice(9)}`;
  }
  const code = COUNTRY_CODE_MAP[country];
  if (code && msisdn.startsWith(code)) {
    return `+${code} ${msisdn.slice(code.length)}`;
  }
  return `+${msisdn}`;
}

function PurchasePageContent() {
  const [numbers, setNumbers] = useState<unknown[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [country, setCountry] = useState('US');
  const [type, setType] = useState('any');
  const [features, setFeatures] = useState(['SMS', 'VOICE', 'MMS']);
  const [numberPattern, setNumberPattern] = useState('');
  const [matchType, setMatchType] = useState('contains');

  const searchParams = useSearchParams();
  const workspaceIdParam = searchParams.get("workspace_id");

  useEffect(() => {
    if (mode === 'existing' && workspaceIdParam) {
      fetch(`/api/available-numbers?workspace_id=${workspaceIdParam}`)
        .then(res => res.json())
        .then(data => setAvailableNumbers(data.numbers || []));
    }
  }, [mode, workspaceIdParam]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setNumbers([]);
    setLoading(true);
    setStep(1);
    try {
      const res = await fetch("/api/vonage-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern: numberPattern, searchPattern: matchType, country, type, features }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        setError("Server error: Could not parse response.");
        setLoading(false);
        setStep(0);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Server error");
        setLoading(false);
        setStep(0);
        return;
      }
      if (Array.isArray(data.numbers)) {
        setNumbers(data.numbers);
        setStep(2);
      } else if (data.error) {
        const errorMsg = typeof data.error === 'string'
          ? data.error
          : data.error['error-code-label'] || JSON.stringify(data.error);
        setError(errorMsg);
        setStep(0);
      } else {
        setError("No available numbers found for that area code. Please try a different one.");
        setStep(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error or server is down.");
      setLoading(false);
      setStep(0);
    }
  };

  const handleBuy = async (number: string) => {
    setBuying(number);
    setMessage("");
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const user_id = user?.id;
    try {
      const res = await fetch("/api/vonage-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msisdn: number, user_id, workspace_id: workspaceIdParam, country }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        setError("Server error: Could not parse response.");
        setBuying(null);
        return;
      }
      if (!res.ok) {
        let errorMsg = "Server error";
        if (data.error) {
          if (typeof data.error === "string") errorMsg = data.error;
          else if (typeof data.error === "object" && data.error["error-code-label"]) errorMsg = data.error["error-code-label"];
          else errorMsg = JSON.stringify(data.error);
        }
        setError(errorMsg);
        setBuying(null);
        return;
      }
      setBuying(null);
      if (data.success) {
        setMessage("Number purchased successfully!");
        setNumbers([]);
        setStep(3);
      } else {
        setError(data.error || "Purchase failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error or server is down.");
      setBuying(null);
    }
  };

  const handleAssign = async (number: string) => {
    setAssigning(number);
    setMessage("");
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const user_id = user?.id;
    const res = await fetch("/api/assign-number", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: number, user_id, workspace_id: workspaceIdParam }),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }
    const data = await res.json();
    setAssigning(null);
    if (data.success) {
      setMessage(`Assigned: ${number}`);
      setAvailableNumbers(availableNumbers.filter(n => n.phoneNumber !== number));
      setStep(3);
    } else {
      setError(data.error || "Assignment failed");
    }
  };

  return (
    <Box sx={{ bgcolor: '#f7faff', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="sm">
        <Button component={Link} href="/" startIcon={<ArrowBackIcon />} sx={{ mb: 3, fontWeight: 600, textTransform: 'none' }} color="primary" variant="text">
          Back to Home
        </Button>
        <Card sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, boxShadow: 6, mb: 4, textAlign: 'center', overflow: 'visible' }}>
          <Tabs value={mode} onChange={(_, v) => setMode(v)} centered sx={{ mb: 3 }}>
            <Tab value="new" label="Buy New Number" />
            <Tab value="existing" label="Use Existing Number" />
          </Tabs>
          {mode === 'new' && (
            <>
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
                Purchase a Vonage Number
              </Typography>
              <Typography color="text.secondary" mb={4} sx={{ fontSize: 18 }}>
                Search and instantly buy a local or toll-free number.
              </Typography>
              {step === 0 && (
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4, maxWidth: 400, mx: 'auto' }}>
                  <form onSubmit={handleSearch}>
                    <Stack spacing={3}>
                      <FormControl fullWidth>
                        <InputLabel>Country</InputLabel>
                        <Select value={country} label="Country" onChange={e => setCountry(e.target.value)}>
                          {COUNTRY_OPTIONS.map(opt => (
                            <MenuItem key={opt.code} value={opt.code}>{opt.label}</MenuItem>
                          ))}
                        </Select>
                        <Typography variant="caption" color="text.secondary">Select the country for your number.</Typography>
                      </FormControl>
                      <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select value={type} label="Type" onChange={e => setType(e.target.value)}>
                          {TYPE_OPTIONS.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                          ))}
                        </Select>
                        <Typography variant="caption" color="text.secondary">Choose the type of number.</Typography>
                      </FormControl>
                      <FormControl fullWidth>
                        <InputLabel>Features</InputLabel>
                        <Select
                          multiple
                          value={features}
                          onChange={e => setFeatures(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                          input={<OutlinedInput label="Features" />}
                          renderValue={selected => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {(selected as string[]).map(value => (
                                <Chip key={value} label={FEATURE_OPTIONS.find(opt => opt.value === value)?.label || value} />
                              ))}
                            </Box>
                          )}
                        >
                          {FEATURE_OPTIONS.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>
                              <Checkbox checked={features.indexOf(opt.value) > -1} />
                              <ListItemText primary={opt.label} />
                            </MenuItem>
                          ))}
                        </Select>
                        <Typography variant="caption" color="text.secondary">Select one or more features.</Typography>
                      </FormControl>
                      <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>Number</InputLabel>
                        <Select value={matchType} label="Number" onChange={e => setMatchType(e.target.value)}>
                          {MATCH_TYPE_OPTIONS.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        label="Number"
                        value={numberPattern}
                        onChange={e => setNumberPattern(e.target.value)}
                        sx={{ minWidth: 120 }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<PhoneIcon />}
                        disabled={loading}
                        fullWidth
                        sx={{ fontWeight: 700, py: 1.5, borderRadius: 2, fontSize: 18 }}
                      >
                        {loading ? <CircularProgress size={20} color="inherit" /> : "Search"}
                      </Button>
                    </Stack>
                  </form>
                </Paper>
              )}
              {step === 2 && numbers.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>Available Numbers:</Typography>
                  <List
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 4,
                      px: 1,
                    }}
                  >
                    {numbers.map((n: unknown, idx) => {
                      const num = n as {
                        msisdn?: string;
                        phoneNumber?: string;
                        features?: string[] | string;
                        cost?: string;
                        monthlyCost?: string;
                        currency?: string;
                        initialPrice?: string;
                      };
                      const displayNumber = num.msisdn || num.phoneNumber || '';
                      const monthly = num.monthlyCost || num.cost || '';
                      const setup = num.initialPrice || '';
                      const currency = num.currency || '€';
                      return (
                        <ListItem
                          key={`${displayNumber}-${idx}`}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            bgcolor: '#fff',
                            borderRadius: 4,
                            boxShadow: 3,
                            p: 3,
                            minHeight: 220,
                            maxWidth: 400,
                            mx: 'auto',
                            position: 'relative',
                          }}
                        >
                          <Typography fontFamily="monospace" fontWeight={700} fontSize={22} mb={1}>
                            {formatFriendlyName(displayNumber, country)}
                          </Typography>
                          <Typography fontSize={16} color="text.secondary" mb={2}>
                            {Array.isArray(num.features) ? num.features.join(' / ') : num.features}
                          </Typography>
                          <Box
                            sx={{
                              background: '#f7faff',
                              borderRadius: 2,
                              p: 2,
                              mb: 2,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
                            }}
                          >
                            {setup && (
                              <Typography fontSize={15} color="secondary">
                                <b>Initial set up fee:</b> {currency}{setup}
                              </Typography>
                            )}
                            {monthly && (
                              <Typography fontSize={15} color="primary">
                                <b>Monthly cost:</b> {currency}{monthly}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ flexGrow: 1 }} />
                          <Button
                            variant="contained"
                            size="large"
                            onClick={() => handleBuy(displayNumber)}
                            disabled={buying === displayNumber}
                            sx={{
                              fontWeight: 700,
                              fontSize: 16,
                              borderRadius: 2,
                              boxShadow: 1,
                              minWidth: 120,
                              mt: 2,
                            }}
                          >
                            {buying === displayNumber ? <CircularProgress size={20} color="inherit" /> : 'BUY'}
                          </Button>
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              )}
              {step === 2 && numbers.length === 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Alert severity="info">
                    No numbers available for your search. Please try different criteria.
                  </Alert>
                  <Button variant="contained" color="primary" onClick={() => { setStep(0); setLoading(false); }} sx={{ mt: 1 }}>
                    Try Again
                  </Button>
                </Box>
              )}
            </>
          )}
          {mode === 'existing' && (
            <>
              <Box sx={{ bgcolor: 'primary.main', color: '#fff', width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, mx: 'auto', mb: 3, boxShadow: 2 }}>
                <PhoneIcon fontSize="inherit" />
              </Box>
              <Typography variant="h4" fontWeight={800} mb={1}>
                Use an Existing Number
              </Typography>
              <Typography color="text.secondary" mb={4} sx={{ fontSize: 18 }}>
                Select from numbers you already own that are not in use.
              </Typography>
              {availableNumbers.length === 0 ? (
                <Alert severity="info">No available numbers found for this workspace.</Alert>
              ) : (
                <List sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  {availableNumbers.map((num, idx) => (
                    <ListItem
                      key={num.phoneNumber || num.sid || idx}
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#e8f0fe', borderRadius: 2, mb: 1, px: 2, boxShadow: 1, border: '2px solid transparent', transition: 'border 0.2s', '&:hover': { borderColor: 'primary.main', bgcolor: '#e3f2fd' } }}
                    >
                      <Typography fontFamily="monospace" fontSize={18}>{formatFriendlyName(num.phoneNumber, country)}</Typography>
                      <Button
                        variant="contained"
                        color={assigning === num.phoneNumber ? "inherit" : "primary"}
                        onClick={() => handleAssign(num.phoneNumber)}
                        disabled={assigning === num.phoneNumber}
                        sx={{ ml: 2, fontWeight: 700 }}
                      >
                        {assigning === num.phoneNumber ? <CircularProgress size={20} color="inherit" /> : "Use"}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
          {step === 3 && message && (
            <Box sx={{ mt: 4, mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CelebrationIcon color="success" sx={{ fontSize: 60 }} />
              <Typography variant="h5" fontWeight={700} color="success.main">Number Ready!</Typography>
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
