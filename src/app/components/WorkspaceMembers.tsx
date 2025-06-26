"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

interface WorkspaceMember {
  user_id: string;
  users?: { email?: string };
  role: string;
}

export default function WorkspaceMembers({ workspaceId, open, setOpen }: { workspaceId: string, open: boolean, setOpen: (open: boolean) => void }) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('workspace_members')
      .select('id, role, user_id, users(email)')
      .eq('workspace_id', workspaceId);
    setMembers(data as WorkspaceMember[]);
    setLoading(false);
  };

  useEffect(() => {
    async function fetchUserRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: member } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .single();
        setCurrentUserRole(member?.role || null);
      }
    }
    if (open) fetchUserRole();
  }, [open, workspaceId]);

  const handleInvite = async () => {
    setInviteStatus(null);
    const { error } = await supabase.from('invitations').insert({ email: inviteEmail, workspace_id: workspaceId });
    if (error) {
      setInviteStatus('Failed to send invite.');
    } else {
      const { data: ws } = await supabase.from('workspaces').select('name').eq('id', workspaceId).single();
      const inviteLink = `${window.location.origin}/auth`;
      console.log("inviteLink", inviteLink);
      console.log("email", inviteEmail);
      console.log("workspaceName", ws?.name);
      await fetch('/api/send-invite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          workspaceName: ws?.name || 'LoCall',
          inviteLink,
        }),
      });
      setInviteStatus('Invitation sent!');
      setInviteEmail("");
      fetchMembers();
    }
  };

  const handleRemove = async (userId: string) => {
    await supabase.from('workspace_members').delete().eq('workspace_id', workspaceId).eq('user_id', userId);
    fetchMembers();
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    await supabase.from('workspace_members').update({ role: newRole }).eq('workspace_id', workspaceId).eq('user_id', userId);
    fetchMembers();
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Workspace Members</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <List>
            {members.length === 0 ? (
              <Typography color="text.secondary">No members found.</Typography>
            ) : (
              members.map((m) => {
                const isSelf = m.user_id === currentUserId;
                const isOnlyAdmin = m.role === 'admin' && members.filter(mem => mem.role === 'admin').length === 1;
                return (
                  <ListItem key={m.user_id} secondaryAction={
                    currentUserRole === 'admin' && !isSelf ? (
                      <>
                        <IconButton edge="end" aria-label="change-role" onClick={() => handleChangeRole(m.user_id, m.role)}>
                          <SwapHorizIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="remove" onClick={() => handleRemove(m.user_id)} disabled={isOnlyAdmin}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    ) : null
                  }>
                    <ListItemText primary={m.users?.email} />
                    <Chip label={m.role} color={m.role === 'admin' ? 'primary' : 'default'} size="small" />
                  </ListItem>
                );
              })
            )}
          </List>
        )}
        {currentUserRole === 'admin' && (
          <form onSubmit={e => { e.preventDefault(); handleInvite(); }} style={{ marginTop: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
            <TextField
              size="small"
              label="Invite by Email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              type="email"
              required
            />
            <Button type="submit" variant="contained" color="primary">Invite</Button>
            {inviteStatus && <Typography color="success.main" fontSize={14}>{inviteStatus}</Typography>}
          </form>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 