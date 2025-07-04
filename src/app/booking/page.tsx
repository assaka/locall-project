"use client";
import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { supabase } from "@/app/utils/supabaseClient";
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';
import Link from "next/link";

export default function BookingPage() {
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string; booking_link?: string | null }[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [bookingLink, setBookingLink] = useState<string>("https://calendly.com/your-calendly-username/demo-meeting");

  useEffect(() => {
    const fetchData = async () => {
      const workspaceRes = await supabase.from('workspaces').select('id, name, booking_link');
      if (workspaceRes.data) setWorkspaces(workspaceRes.data);
      if (workspaceRes.data && workspaceRes.data.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(workspaceRes.data[0].id);
      }
    };
    fetchData();
  }, [selectedWorkspace]);

  useEffect(() => {
    const ws = workspaces.find(w => w.id === selectedWorkspace);
    if (ws && ws.booking_link) {
      setBookingLink(ws.booking_link);
    } else {
      setBookingLink("https://calendly.com/edwardp-dev2025/30min");
    }
  }, [selectedWorkspace, workspaces]);

  return (
    <Box sx={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: "white", py: { xs: 6, md: 10 } }}>
      <Box mb={3} alignSelf="flex-start" marginLeft={'15%'}>
        <Button
          component={Link}
          href="/"
          variant="outlined"
          startIcon={<HomeIcon />}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          Back to Home
        </Button>
      </Box>
      <Typography variant="h3" fontWeight={700} color="primary.main" mb={2}>
        Book a Demo or Meeting
      </Typography>
      <Typography variant="h6" color="text.secondary" mb={4} align="center" sx={{ maxWidth: 500 }}>
        Schedule a personalized walkthrough or strategy session with our team. Choose a time that works for you!
      </Typography>
      <Box display="flex" gap={2} mb={4}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="workspace-label">Workspace</InputLabel>
          <Select
            labelId="workspace-label"
            label="Workspace"
            value={selectedWorkspace}
            onChange={e => setSelectedWorkspace(e.target.value)}
          >
            {workspaces.map(ws => (
              <MenuItem key={ws.id} value={ws.id}>{ws.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: 350, sm: 500, md: 800, lg: 1400 },
          minHeight: 600,
          bgcolor: 'grey.50',
          borderRadius: 2,
          boxShadow: 2,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <iframe
          src={bookingLink}
          width="100%"
          height="800"
          style={{ border: 0 }}
          title="Book Appointment"
          allow="fullscreen"
        />
      </Box>
    </Box>
  );
}
