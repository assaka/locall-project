"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';

export default function RecordingManagement({ agencyId }) {
  const [recordings, setRecordings] = useState([]);
  useEffect(() => {
    if (!agencyId) return;
    fetch(`/api/recordings?agencyId=${agencyId}`)
      .then(res => res.json())
      .then(data => setRecordings(data.recordings || []));
  }, [agencyId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recording?')) return;
    await fetch(`/api/recordings/delete-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: id })
    });
    setRecordings(recordings.filter(r => r.id !== id));
  };

  if (!agencyId) return null;
  if (!recordings) return <div className="flex items-center gap-2"><CircularProgress size={20} /> <span>Loading recordings...</span></div>;

  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>Recordings</Typography>
        <List>
          {recordings.map(r => (
            <ListItem key={r.id} divider secondaryAction={
              <>
                <Button size="small" variant="outlined" onClick={() => window.open(r.url, '_blank')}>Download</Button>
                <Button size="small" color="error" variant="text" onClick={() => handleDelete(r.id)} sx={{ ml: 1 }}>Delete</Button>
              </>
            }>
              <ListItemText primary={r.url} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
