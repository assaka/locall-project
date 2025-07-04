"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

export default function AttributionReporting({ agencyId }) {
  const [attribution, setAttribution] = useState([]);
  useEffect(() => {
    if (!agencyId) return;
    fetch(`/api/attribution?agencyId=${agencyId}`)
      .then(res => res.json())
      .then(data => setAttribution(data.attribution || []));
  }, [agencyId]);
  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>Call Attribution Reporting</Typography>
        <List>
          {attribution.map((a, i) => (
            <ListItem key={i} divider>
              <ListItemText
                primary={`Campaign: ${a.utm_campaign}`}
                secondary={`Source: ${a.utm_source}, Cost: $${a.cost_per_click}`}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
