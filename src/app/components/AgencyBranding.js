"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

export default function AgencyBranding({ agencyId }) {
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBranding() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/agency?agencyId=${agencyId}`);
        if (!res.ok) throw new Error('Failed to fetch branding');
        const data = await res.json();
        setBranding(data.branding);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBranding();
  }, [agencyId]);

  if (loading) return <div className="flex items-center gap-2"><CircularProgress size={20} /> <span>Loading branding...</span></div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!branding) return <div>No branding found.</div>;

  return (
    <Card className="mb-4" style={{ background: (branding.colors && branding.colors.background) || '#fff', color: (branding.colors && branding.colors.text) || '#000' }}>
      <CardContent>
        {branding.logo_url && <img src={branding.logo_url} alt="Logo" style={{ maxWidth: 120, marginBottom: 16 }} />}
        <Typography variant="h6" gutterBottom>{branding.name}</Typography>
        <pre className="text-xs mt-2">{branding.colors ? JSON.stringify(branding.colors, null, 2) : null}</pre>
      </CardContent>
    </Card>
  );
}
