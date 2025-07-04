"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

export default function PerformanceCharts({ agencyId }) {
  const [performance, setPerformance] = useState([]);
  useEffect(() => {
    if (!agencyId) return;
    fetch(`/api/analytics/performance?agencyId=${agencyId}`)
      .then(res => res.json())
      .then(data => setPerformance(data.performance || []));
  }, [agencyId]);
  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>Performance Comparison</Typography>
        <List>
          {performance.map((p, i) => (
            <ListItem key={i} divider>
              <ListItemText primary={p.label} secondary={p.value} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
