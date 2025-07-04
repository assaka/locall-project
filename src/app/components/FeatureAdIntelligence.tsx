import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import AdUnitsIcon from "@mui/icons-material/AdUnits";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const features = [
  "Campaign attribution",
  "Google/FB ads integration",
  "Cost per lead tracking",
  "Automated bid adjustments",
];

export default function FeatureAdIntelligence() {
  return (
    <Card elevation={3} sx={{ borderRadius: 4, p: 0, bgcolor: "#f7faff", height: "100%", boxShadow: 6 }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 4 }}>
        <Box sx={{ bgcolor: "primary.main", color: "#fff", width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, mb: 3, boxShadow: 2 }}>
          <AdUnitsIcon fontSize="inherit" />
        </Box>
        <Typography variant="h6" fontWeight={800} mb={1} sx={{ fontSize: 22, textAlign: "center" }}>
          Ad Intelligence & ROI
        </Typography>
        <Typography color="text.secondary" mb={3} sx={{ textAlign: "center", fontWeight: 500 }}>
          Optimize your ad spend with precise attribution
        </Typography>
        <List dense sx={{ width: "100%", maxWidth: 320 }}>
          {features.map((feature, idx) => (
            <ListItem key={idx} disableGutters sx={{ alignItems: "flex-start", px: 0, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={<Typography variant="body1" sx={{ fontWeight: 500 }}>{feature}</Typography>} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
