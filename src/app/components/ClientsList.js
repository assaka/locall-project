"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';

export default function ClientsList({ agencyId }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/clients?agencyId=${agencyId}`);
        if (!res.ok) throw new Error('Failed to fetch clients');
        const data = await res.json();
        setClients(data.clients || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, [agencyId]);

  if (loading) return <div className="flex items-center gap-2"><CircularProgress size={20} /> <span>Loading clients...</span></div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!clients.length) return <div>No clients found.</div>;

  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>Clients</Typography>
        <List>
          {clients.map((client) => (
            <ListItem key={client.id} divider>
              <ListItemText primary={client.name} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
