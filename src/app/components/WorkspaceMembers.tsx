"use client";
import { useState, useEffect, useCallback } from "react";
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
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import React from "react";

interface WorkspaceMember {
  user_id: string;
  users?: { email?: string };
  role: string;
  invited_by?: string | null;
  inviter?: { email?: string };
}

export default function WorkspaceMembers({ workspaceId, open, setOpen }: { workspaceId: string, open: boolean, setOpen: (open: boolean) => void }) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const result = await supabase.from('workspace_members').select('id, role, user_id, users:users!workspace_members_user_id_fkey(name, email)').eq('workspace_id', workspaceId);
    setMembers((result.data ?? []) as WorkspaceMember[]);
    setLoading(false);
  }, [workspaceId]);

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

  useEffect(() => {
    if (open && workspaceId) {
      fetchMembers();
    }
  }, [open, workspaceId, fetchMembers]);

  const handleInvite = async () => {
    setInviteStatus(null);
    setLoading(true);
    setInviteStatus(null);
    try {
      const { data: ws } = await supabase.from('workspaces').select('name').eq('id', workspaceId).single();
      const { data: { user: inviter } } = await supabase.auth.getUser();
      const res = await fetch('/api/send-invite-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          workspaceName: ws?.name || 'LoCall',
          workspace_id: workspaceId,
          invited_by: inviter?.id,
        }),
      });
      if (!res.ok) {
        setInviteStatus('Failed to send invite.');
      } else {
        setInviteStatus('Invitation sent!');
        setInviteEmail("");
        fetchMembers();
      }
    } catch {
      setInviteStatus('error');
    }
    setLoading(false);
  };

  const handleRemove = async (userId: string) => {
    await supabase.from('workspace_members').delete().eq('workspace_id', workspaceId).eq('user_id', userId).eq('role', 'member');
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
              Array.from(new Map(members.map(m => [m.user_id, m])).values()).map((m, idx, arr) => {
                const isSelf = m.user_id === currentUserId;
                const isOnlyAdmin = m.role === 'admin' && arr.filter(mem => mem.role === 'admin').length === 1;
                return (
                  <React.Fragment key={m.user_id}>
                    <ListItem
                      alignItems="center"
                      sx={{ display: 'flex', gap: 2, py: 1 }}
                      secondaryAction={null}
                    >
                      <Typography fontWeight={600} sx={{ minWidth: 28 }}>{idx + 1}.</Typography>
                      <ListItemText
                        primary={<>
                          {m.users && 'name' in m.users && m.users.name ? (
                            <>{m.users.name} <Typography component="span" color="text.secondary" fontSize={13}>({m.users.email})</Typography></>
                          ) : (
                            m.users?.email || m.user_id
                          )}
                          {isSelf && <Typography component="span" color="primary.main" fontWeight={700} fontSize={13} sx={{ ml: 1 }}>(You)</Typography>}
                        </>}
                        secondary={m.inviter && m.inviter.email ? `Invited by: ${m.inviter.email}` : undefined}
                        sx={{ minWidth: 0, flex: 1 }}
                      />
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip label={m.role} color={m.role === 'admin' ? 'primary' : 'default'} size="small" sx={{ minWidth: 64, textTransform: 'capitalize' }} />
                        {currentUserRole === 'admin' && !isSelf && (
                          <Tooltip title={isOnlyAdmin ? 'Cannot remove the only admin' : 'Remove Member'}>
                            <span>
                              <IconButton edge="end" aria-label="remove" onClick={() => handleRemove(m.user_id)} disabled={isOnlyAdmin}>
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
                    </ListItem>
                    {idx < arr.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })
            )}
          </List>
        )}
        <Divider sx={{ my: 2 }} />
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
            <Button type="submit" variant="contained" color="primary" disabled={loading}>Invite</Button>
            {inviteStatus && <Typography color={inviteStatus.includes('Failed') ? 'error.main' : 'success.main'} fontSize={14}>{inviteStatus}</Typography>}
          </form>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 