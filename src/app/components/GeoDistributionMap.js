"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

export default function GeoDistributionMap({ agencyId }) {
  const [geoData, setGeoData] = useState([]);
  useEffect(() => {
    if (!agencyId) return;
    fetch(`/api/analytics/geo?agencyId=${agencyId}`)
      .then(res => res.json())
      .then(data => setGeoData(data.geo || []));
  }, [agencyId]);
  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>Geographic Call Distribution</Typography>
        <List>
          {geoData.map((g, i) => (
            <ListItem key={i} divider>
              <ListItemText primary={g.region} secondary={`${g.count} calls`} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
