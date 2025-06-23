import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const features = [
  "Dynamic number insertion",
  "Call recording & AI transcription",
  "Real-time call analytics",
  "Conversation intelligence",
];

export default function FeatureCall() {
  return (
    <Card elevation={2} sx={{ p: 3, borderRadius: 3, height: "100%" }}>
      <CardContent>
        <Box color="primary.main" mb={2} fontSize={40} display="flex" alignItems="center">
          <PhoneInTalkIcon fontSize="inherit" />
        </Box>
        <Typography variant="h6" fontWeight={700} mb={1}>
          Advanced Call Tracking
        </Typography>
        <Typography color="text.secondary" mb={2}>
          Track, record, and analyze every customer call with enterprise-grade features
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