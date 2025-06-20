"use client";
import React, { useState } from "react";
import { Box, Typography, Card, Button, TextField, List, ListItem, Alert, Stack, CircularProgress } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';

const PurchasePage: React.FC = () => {
  const [areaCode, setAreaCode] = useState("");
  const [numbers, setNumbers] = useState<any[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setNumbers([]);
    setLoading(true);
    const res = await fetch("/api/twilio-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ search: areaCode }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.numbers) setNumbers(data.numbers);
    else setError(data.error || "No numbers found");
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
    const data = await res.json();
    setBuying(null);
    if (data.purchased) setMessage(`Purchased: ${data.purchased.phoneNumber}`);
    else setError(data.error || "Purchase failed");
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Purchase a Twilio Number
      </Typography>
      <Card sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSearch}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Area Code (US)"
              value={areaCode}
              onChange={e => setAreaCode(e.target.value)}
              inputProps={{ maxLength: 3 }}
              required
              placeholder="e.g. 415"
              size="small"
              sx={{ width: 120 }}
            />
            <Button type="submit" variant="contained" startIcon={<PhoneIcon />} disabled={loading}>
              {loading ? <CircularProgress size={20} color="inherit" /> : "Search"}
            </Button>
          </Stack>
        </form>
      </Card>
      {numbers.length > 0 && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>Available Numbers:</Typography>
          <List>
            {numbers.map(num => (
              <ListItem key={num.phoneNumber} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography fontFamily="monospace" fontSize={18}>{num.phoneNumber}</Typography>
                <Button
                  variant="contained"
                  color={buying === num.phoneNumber ? "inherit" : "primary"}
                  onClick={() => handleBuy(num.phoneNumber)}
                  disabled={buying === num.phoneNumber}
                  sx={{ ml: 2 }}
                >
                  {buying === num.phoneNumber ? <CircularProgress size={20} color="inherit" /> : "Buy"}
                </Button>
              </ListItem>
            ))}
          </List>
        </Card>
      )}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    </Box>
  );
};

export default PurchasePage; 