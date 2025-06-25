import { supabase } from "@/app/utils/supabaseClient";

export async function ensurePersonalWorkspace(user: { id: string; email?: string; name?: string }) {
  const { data: owned, error: ownedError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id);
  if (ownedError) throw ownedError;
  if (owned && owned.length > 0) return;

  const { data: memberships, error } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("user_id", user.id);
  if (error) throw error;
  if (memberships && memberships.length > 0) return;

  const workspaceName = user.name ? `${user.name}'s Workspace` : user.email ? `${user.email.split("@")[0]}'s Workspace` : "Personal Workspace";
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert([{ name: workspaceName, owner_id: user.id }])
    .select()
    .single();
  if (wsError) throw wsError;

  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert([{ user_id: user.id, workspace_id: workspace.id, role: "user" }]);
  if (memberError) throw memberError;
}
