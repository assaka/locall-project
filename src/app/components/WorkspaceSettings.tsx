"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SettingsIcon from '@mui/icons-material/Settings';

export default function WorkspaceSettings({ workspaceId, open, setOpen }: { workspaceId: string, open: boolean, setOpen: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [bookingLink, setBookingLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function fetchWorkspace() {
      const { data } = await supabase.from('workspaces').select('name, booking_link').eq('id', workspaceId).single();
      setName(data?.name || "");
      setBookingLink(data?.booking_link || "");
    }
    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .single();
        setIsAdmin(member?.role === 'admin');
      }
    }
    if (open) {
      fetchWorkspace();
      fetchRole();
    }
  }, [open, workspaceId]);

  const handleSave = async () => {
    setLoading(true);
    setStatus(null);
    const { error } = await supabase.from('workspaces').update({ name, booking_link: bookingLink }).eq('id', workspaceId);
    setLoading(false);
    if (error) {
      setStatus("Failed to update workspace.");
    } else {
      setStatus("Workspace updated!");
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Workspace Settings</DialogTitle>
      <DialogContent>
        <TextField
          label="Workspace Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          margin="normal"
          disabled={!isAdmin}
        />
        <TextField
          label="Booking Link"
          value={bookingLink}
          onChange={e => setBookingLink(e.target.value)}
          fullWidth
          margin="normal"
          disabled={!isAdmin}
        />
        {status && <Typography color={status.includes('updated') ? 'success.main' : 'error.main'}>{status}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Close</Button>
        {isAdmin && <Button onClick={handleSave} variant="contained" color="primary" disabled={loading}>Save</Button>}
      </DialogActions>
    </Dialog>
  );
} 