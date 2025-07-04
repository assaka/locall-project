"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

export default function AttributionInfo({ callId }) {
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAttribution() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/attribution?callId=${callId}`);
        if (!res.ok) throw new Error('Failed to fetch attribution');
        const data = await res.json();
        setCall(data.call);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (callId) fetchAttribution();
  }, [callId]);

  if (loading) return <div className="flex items-center gap-2"><CircularProgress size={20} /> <span>Loading attribution...</span></div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!call) return <div>No attribution found.</div>;

  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>Attribution</Typography>
        <div className="mb-2">UTM Source: <span className="font-mono">{call.utm_source}</span></div>
        <div className="mb-2">UTM Medium: <span className="font-mono">{call.utm_medium}</span></div>
        <div className="mb-2">UTM Campaign: <span className="font-mono">{call.utm_campaign}</span></div>
        <div className="mb-2">Cost Per Click: <span className="font-mono">{call.cost_per_click}</span></div>
        <div className="mb-2">Attribution Data: <pre className="text-xs bg-gray-100 p-2 rounded mt-1">{JSON.stringify(call.attribution_data, null, 2)}</pre></div>
      </CardContent>
    </Card>
  );
}
