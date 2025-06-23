import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const features = [
  "VoIP calling with local numbers",
  "Call queuing & routing",
  "Real-time call monitoring",
  "Team performance analytics",
];

export default function FeatureCloudCallCenter() {
  return (
    <Card elevation={2} sx={{ p: 3, borderRadius: 3, height: "100%" }}>
      <CardContent>
        <Box mb={2}>
          <Box sx={{ bgcolor: "#2563eb", color: "#fff", width: 48, height: 48, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
            <HeadsetMicIcon fontSize="medium" />
          </Box>
        </Box>
        <Typography variant="h6" fontWeight={700} mb={1}>
          Cloud Call Center
        </Typography>
        <Typography color="text.secondary" mb={2}>
          Complete VoIP solution with advanced call management
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