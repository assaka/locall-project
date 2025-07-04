"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

export default function WhiteLabelConfig({ agencyId }) {
  const [branding, setBranding] = useState({});
  useEffect(() => {
    if (!agencyId) return;
    fetch(`/api/agency?agencyId=${agencyId}`)
      .then(res => res.json())
      .then(data => setBranding(data.branding));
  }, [agencyId]);
  const handleChange = (e) => {
    setBranding({ ...branding, [e.target.name]: e.target.value });
  };
  const handleSave = async () => {
    await fetch(`/api/agency?agencyId=${agencyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branding)
    });
    alert('Branding updated!');
  };
  if (!branding) return <div className="flex items-center gap-2"><CircularProgress size={20} /> <span>Loading branding...</span></div>;
  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>White-label Branding</Typography>
        <form className="flex flex-col gap-3">
          <TextField name="name" label="Agency Name" value={branding.name || ''} onChange={handleChange} variant="outlined" size="small" />
          <TextField name="logo_url" label="Logo URL" value={branding.logo_url || ''} onChange={handleChange} variant="outlined" size="small" />
          <TextField name="colors" label="Colors (comma separated)" value={branding.colors || ''} onChange={handleChange} variant="outlined" size="small" />
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </form>
      </CardContent>
    </Card>
  );
}
