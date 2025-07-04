"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

export default function CallAnalyticsDashboard({ agencyId }) {
  const [analytics, setAnalytics] = useState(null);
  useEffect(() => {
    if (!agencyId) return;
    fetch(`/api/analytics?agencyId=${agencyId}`)
      .then(res => res.json())
      .then(data => setAnalytics(data.analytics));
  }, [agencyId]);
  if (!analytics) return <div className="flex items-center gap-2"><CircularProgress size={20} /> <span>Loading analytics...</span></div>;
  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>Call Analytics & Insights</Typography>
        <div className="mb-2">Total Calls: <span className="font-mono">{analytics.totalCalls}</span></div>
        <div className="mb-2">Avg Duration: <span className="font-mono">{analytics.avgDuration}</span> sec</div>
        <div className="mb-2">Positive Sentiment: <span className="font-mono">{analytics.positiveSentiment}</span>%</div>
        {/* Add more insights as needed */}
      </CardContent>
    </Card>
  );
}
