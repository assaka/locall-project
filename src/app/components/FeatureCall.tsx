import React, { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import CallIcon from "@mui/icons-material/Call";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import SettingsIcon from '@mui/icons-material/Settings';
import Snackbar from '@mui/material/Snackbar';

const features = [
  "Place and receive calls",
  "Call recording & AI transcription",
  "Real-time call analytics",
  "Conversation intelligence",
];

export default function FeatureCall() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [alert, setAlert] = useState(false);

  const handleCall = async () => {
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch("/api/twilio-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Call initiated successfully!");
        setPhone("");
      } else {
        setError(data.error || "Failed to initiate call.");
      }
    } catch (e) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCallNow = async () => {
    const res = await fetch('/api/twilio-numbers');
    const data = await res.json();
    if (!data.numbers || data.numbers.length === 0) {
      setAlert(true);
      return;
    }
    window.location.href = '/call';
  };

  return (
    <Card elevation={3} sx={{ borderRadius: 4, p: 0, bgcolor: "#f7faff", height: "100%", boxShadow: 6 }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 4 }}>
        <Box sx={{ bgcolor: "primary.main", color: "#fff", width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, mb: 3, boxShadow: 2 }}>
          <CallIcon fontSize="inherit" />
        </Box>
        <Typography variant="h6" fontWeight={800} mb={1} sx={{ fontSize: 22, textAlign: "center" }}>
          Make & Track Calls
        </Typography>
        <Typography color="text.secondary" mb={3} sx={{ textAlign: "center", fontWeight: 500 }}>
          Place, receive, and analyze calls with advanced tracking and insights
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
        <Button variant="contained" color="primary" sx={{ mt: 3, fontWeight: 700, px: 4 }} onClick={handleCallNow}>
          Call Now
        </Button>
        <Snackbar
          open={alert}
          autoHideDuration={4000}
          onClose={() => setAlert(false)}
          message="Please purchase a phone number first."
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        />
      </CardContent>
    </Card>
  );
}
