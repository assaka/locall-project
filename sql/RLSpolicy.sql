ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view workspaces they own or are a member of" ON workspaces
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert their own workspace" ON workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update their own workspace" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their workspace memberships" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert themselves as a member" ON workspace_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own membership" ON workspace_members
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own membership" ON workspace_members
  FOR DELETE USING (user_id = auth.uid());

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view invitations sent to them" ON invitations
  FOR SELECT USING (email = auth.email());
CREATE POLICY "Users can insert invitations for themselves" ON invitations
  FOR INSERT WITH CHECK (email = auth.email());
CREATE POLICY "Users can update their own invitations" ON invitations
  FOR UPDATE USING (email = auth.email());

ALTER TABLE numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view numbers in their workspace" ON numbers
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert numbers for their workspace" ON numbers
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update numbers in their workspace" ON numbers
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete numbers in their workspace" ON numbers
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view calls in their workspace" ON calls
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert calls for their workspace" ON calls
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update calls in their workspace" ON calls
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete calls in their workspace" ON calls
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Open access policies for calls table (for testing only)
CREATE POLICY "Allow all users to view calls" ON calls
  FOR SELECT USING (true);
CREATE POLICY "Allow all users to insert calls" ON calls
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to update calls" ON calls
  FOR UPDATE USING (true);
CREATE POLICY "Allow all users to delete calls" ON calls
  FOR DELETE USING (true);

ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view form submissions in their workspace" ON form_submissions
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert form submissions for their workspace" ON form_submissions
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update form submissions in their workspace" ON form_submissions
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete form submissions in their workspace" ON form_submissions
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Open access policies for form_submissions table (for testing only)
CREATE POLICY "Allow all users to view form_submissions" ON form_submissions
  FOR SELECT USING (true);
CREATE POLICY "Allow all users to insert form_submissions" ON form_submissions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to update form_submissions" ON form_submissions
  FOR UPDATE USING (true);
CREATE POLICY "Allow all users to delete form_submissions" ON form_submissions
  FOR DELETE USING (true);