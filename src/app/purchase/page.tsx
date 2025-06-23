"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Box, Typography, Card, Button, TextField, List, ListItem, Alert, Stack, CircularProgress, Container } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const PurchasePage: React.FC = () => {
  const [areaCode, setAreaCode] = useState("");
  const [numbers, setNumbers] = useState<any[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [purchasedNumber, setPurchasedNumber] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setNumbers([]);
    setPurchasedNumber(null);
    setLoading(true);
    const res = await fetch("/api/twilio-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ search: areaCode }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.numbers && data.numbers.length > 0) {
      setNumbers(data.numbers);
    } else {
      setError(data.error || "No available numbers found for that area code. Please try a different one.");
    }
  };

  const handleBuy = async (number: string) => {
    setBuying(number);
    setMessage("");
    setError("");
    const res = await fetch("/api/twilio-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buy: number }),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }
    const data = await res.json();
    setBuying(null);
    if (data.purchased) {
      setMessage(`Purchased: ${data.purchased.phoneNumber}`);
      setPurchasedNumber(data.purchased.phoneNumber);
      setNumbers([]);
    } else setError(data.error || "Purchase failed");
  };

  return (
    <Box sx={{ bgcolor: '#f7faff', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="sm">
        <Button component={Link} href="/" startIcon={<ArrowBackIcon />} sx={{ mb: 3, fontWeight: 600, textTransform: 'none' }} color="primary" variant="text">
          Back to Home
        </Button>
        <Card sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, boxShadow: 6, mb: 4, textAlign: 'center' }}>
          <Box sx={{ bgcolor: 'primary.main', color: '#fff', width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, mx: 'auto', mb: 3, boxShadow: 2 }}>
            <PhoneIcon fontSize="inherit" />
          </Box>
          <Typography variant="h4" fontWeight={800} mb={1}>
            Purchase a Twilio Number
          </Typography>
          <Typography color="text.secondary" mb={4} sx={{ fontSize: 18 }}>
            Search and instantly buy a local or toll-free number.
          </Typography>
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
          {numbers.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Available Numbers:</Typography>
              <List>
                {numbers.map(num => (
                  <ListItem key={num.phoneNumber} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#e8f0fe', borderRadius: 2, mb: 1, px: 2 }}>
                    <Typography fontFamily="monospace" fontSize={18}>{num.phoneNumber}</Typography>
                    <Button
                      variant="contained"
                      color={buying === num.phoneNumber ? "inherit" : "primary"}
                      onClick={() => handleBuy(num.phoneNumber)}
                      disabled={buying === num.phoneNumber}
                      sx={{ ml: 2, fontWeight: 700 }}
                    >
                      {buying === num.phoneNumber ? <CircularProgress size={20} color="inherit" /> : "Buy"}
                    </Button>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          {message && (
            <Alert
              severity="success"
              sx={{ my: 3 }}
              action={
                purchasedNumber && (
                  <Button
                    component={Link}
                    href={`/call?from=${encodeURIComponent(purchasedNumber)}`}
                    color="primary"
                    size="small"
                    variant="outlined"
                    sx={{ whiteSpace: "nowrap", fontWeight: 700 }}
                  >
                    Make a Call
                  </Button>
                )
              }
            >
              {message}
            </Alert>
          )}
          {error && <Alert severity="error" sx={{ my: 3 }}>{error}</Alert>}
        </Card>
      </Container>
    </Box>
  );
};

export default PurchasePage;
