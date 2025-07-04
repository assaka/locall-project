"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

export default function DomainManager({ agencyId }) {
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  useEffect(() => {
    if (!agencyId) return;
    fetch(`/api/agency/domains?agencyId=${agencyId}`)
      .then(res => res.json())
      .then(data => setDomains(data.domains || []));
  }, [agencyId]);
  const handleAdd = async () => {
    await fetch(`/api/agency/domains?agencyId=${agencyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: newDomain })
    });
    setDomains([...domains, { domain: newDomain }]);
    setNewDomain('');
  };
  const handleDelete = async (domain) => {
    await fetch(`/api/agency/domains?agencyId=${agencyId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain })
    });
    setDomains(domains.filter(d => d.domain !== domain));
  };
  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>Domain Management</Typography>
        <div className="flex gap-2 mb-4">
          <TextField value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="Add domain" size="small" />
          <Button onClick={handleAdd} variant="contained">Add</Button>
        </div>
        <List>
          {domains.map(d => (
            <ListItem key={d.domain} divider secondaryAction={
              <Button onClick={() => handleDelete(d.domain)} color="error" size="small">Delete</Button>
            }>
              <ListItemText primary={d.domain} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
