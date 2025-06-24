import { supabase } from "@/app/utils/supabaseClient";

export async function acceptPendingInvitations(user: { id: string; email: string }) {
  if (!user.email) return;
  // Find pending invitations for this email
  const { data: invites, error } = await supabase
    .from("invitations")
    .select("id, workspace_id, status")
    .eq("email", user.email)
    .eq("status", "pending");
  if (error) throw error;
  if (!invites || invites.length === 0) return;

  for (const invite of invites) {
    await supabase.from("workspace_members").insert({
      user_id: user.id,
      workspace_id: invite.workspace_id,
      role: "member"
    });
    await supabase.from("invitations").update({ status: "accepted" }).eq("id", invite.id);
  }
} 