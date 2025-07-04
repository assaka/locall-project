"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

export default function ClientSwitcher({ agencyId, onSwitch }) {
  const [clients, setClients] = useState([]);
  useEffect(() => {
    if (!agencyId) return;
    fetch(`/api/clients?agencyId=${agencyId}`)
      .then(res => res.json())
      .then(data => setClients(data.clients || []));
  }, [agencyId]);
  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>Switch Client</Typography>
        <FormControl fullWidth size="small">
          <InputLabel id="client-switcher-label">Select client</InputLabel>
          <Select
            labelId="client-switcher-label"
            value=""
            label="Select client"
            onChange={e => onSwitch(e.target.value)}
          >
            <MenuItem value="">Select client</MenuItem>
            {clients.map(c => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </CardContent>
    </Card>
  );
}
