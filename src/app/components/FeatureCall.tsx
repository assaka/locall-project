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
        <Button variant="contained" color="primary" sx={{ mt: 3, fontWeight: 700, px: 4 }} onClick={() => setOpen(true)}>
          Call Now
        </Button>
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>Make a Call</DialogTitle>
          <DialogContent>
            <TextField
              label="Phone Number (E.164 format)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              fullWidth
              margin="normal"
              placeholder="+1234567890"
              disabled={loading}
            />
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <Box mt={3} mb={1}>
              <Box sx={{ borderTop: '1px solid #e0e0e0', my: 2 }} />
              <Button
                href="/call"
                component="a"
                fullWidth
                variant="outlined"
                color="primary"
                startIcon={<SettingsIcon />}
                sx={{ borderRadius: 2, fontWeight: 600, py: 1.2, fontSize: 16 }}
              >
                Advanced: Specify From/To Number & More Options
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleCall} variant="contained" disabled={loading || !phone}>
              {loading ? <CircularProgress size={24} /> : "Call"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
