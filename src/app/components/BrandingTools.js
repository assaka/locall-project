"use client";

import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

export default function BrandingTools({ branding, onChange }) {
  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>Branding Customization</Typography>
        <form className="flex flex-col gap-3">
          <TextField name="name" label="Agency Name" value={branding.name || ''} onChange={onChange} variant="outlined" size="small" />
          <TextField name="logo_url" label="Logo URL" value={branding.logo_url || ''} onChange={onChange} variant="outlined" size="small" />
          <TextField name="colors" label="Colors (comma separated)" value={branding.colors || ''} onChange={onChange} variant="outlined" size="small" />
        </form>
      </CardContent>
    </Card>
  );
}
