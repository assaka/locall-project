"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';

export default function AnalyticsDashboard({ agencyId, clientId }) {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        let url = `/api/analytics?agencyId=${agencyId}`;
        if (clientId) url += `&clientId=${clientId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setAnalytics(data.analytics || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [agencyId, clientId]);

  if (loading) return <div className="flex items-center gap-2"><CircularProgress size={20} /> <span>Loading analytics...</span></div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!analytics.length) return <div>No analytics found.</div>;

  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>Analytics</Typography>
        <List>
          {analytics.map((item) => (
            <ListItem key={item.id} divider>
              <ListItemText primary={item.metric} secondary={item.value} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
