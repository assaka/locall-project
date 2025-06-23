import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const features = [
  "Built-in CRM with pipelines",
  "SMS/Email automation",
  "Workflow automation",
  "Calendar & appointment setting",
];

export default function FeaturePurchase() {
  return (
    <Card elevation={2} sx={{ p: 3, borderRadius: 3, height: "100%" }}>
      <CardContent>
        <Box color="primary.main" mb={2} fontSize={40} display="flex" alignItems="center">
          <AutoAwesomeIcon fontSize="inherit" />
        </Box>
        <Typography variant="h6" fontWeight={700} mb={1}>
          CRM & Marketing Automation
        </Typography>
        <Typography color="text.secondary" mb={2}>
          Nurture leads and automate follow-ups without leaving the platform
        </Typography>
        <List dense>
          {features.map((feature, idx) => (
            <ListItem key={idx} disableGutters sx={{ alignItems: "flex-start" }}>
              <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={feature} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
} 