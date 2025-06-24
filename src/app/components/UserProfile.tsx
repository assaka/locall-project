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
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function UserProfile({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        setName(user.user_metadata?.name || "");
      }
    }
    if (open) fetchUser();
  }, [open]);

  const handleSave = async () => {
    setLoading(true);
    setStatus(null);
    // Update Supabase Auth user metadata
    const { error: authError } = await supabase.auth.updateUser({ data: { name } });
    // Update users table as well
    const { data: { user } } = await supabase.auth.getUser();
    let dbError = null;
    if (user) {
      const { error } = await supabase.from('users').update({ name }).eq('id', user.id);
      dbError = error;
    }
    setLoading(false);
    if (authError || dbError) {
      setStatus("Failed to update profile.");
    } else {
      setStatus("Profile updated!");
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Email"
          value={email}
          fullWidth
          margin="normal"
          disabled
        />
        {status && <Typography color={status.includes('updated') ? 'success.main' : 'error.main'}>{status}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Close</Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={loading}>Save</Button>
      </DialogActions>
    </Dialog>
  );
} 