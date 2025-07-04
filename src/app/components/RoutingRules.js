"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';

export default function RoutingRules({ agencyId }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRules() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/routing?agencyId=${agencyId}`);
        if (!res.ok) throw new Error('Failed to fetch routing rules');
        const data = await res.json();
        setRules(data.rules || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRules();
  }, [agencyId]);

  if (loading) return <div className="flex items-center gap-2"><CircularProgress size={20} /> <span>Loading routing rules...</span></div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!rules.length) return <div>No routing rules found.</div>;

  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>Routing Rules</Typography>
        <List>
          {rules.map((rule) => (
            <ListItem key={rule.id} divider>
              <ListItemText
                primary={rule.rule_type}
                secondary={rule.value}
              />
              <Chip label={rule.active ? 'Active' : 'Inactive'} color={rule.active ? 'success' : 'default'} size="small" />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
