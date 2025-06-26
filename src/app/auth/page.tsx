"use client";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthPageWrapper() {
  return (
    <Suspense>
      <AuthPage />
    </Suspense>
  );
}

function AuthPage() {
  const searchParams = useSearchParams();
  const inviteEmail = searchParams.get("email") || "";
  const inviteWorkspaceId = searchParams.get("workspace_id") || "";
  const inviteId = searchParams.get("invite_id") || "";
  const [tab, setTab] = useState(inviteEmail || inviteWorkspaceId || inviteId ? 1 : 0);
  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else {
      setSuccess("Logged in! Redirecting...");
      setTimeout(() => router.push("/"), 1000);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);
    if (error) {
      const errMsg = typeof error.message === 'string' ? error.message : String(error.message);
      if (
        errMsg.toLowerCase().includes("already registered") ||
        errMsg.toLowerCase().includes("user already exists") ||
        errMsg.toLowerCase().includes("email address is already in use")
      ) {
        setError("This email is already registered. Please log in or use a different email address.");
      } else {
        setError(errMsg);
      }
    } else {
      setSuccess("If this email is not registered, you will receive a confirmation email. If you already have an account, please log in.");
      if (inviteId) {
        await supabase.from('invitations').update({ status: 'accepted' }).eq('id', inviteId);
      }
    }
  };

  useEffect(() => {
    const fetchIds = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('workspace_id')
          .eq('id', user.id)
          .single();
        if (!error && data) {
        }
      }
    };
    fetchIds();
  }, []);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          {tab === 0 ? "Login" : "Register"}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {tab === 0 ? "Access your dashboard, manage workspaces, and more." : "Create your account to get started."}
        </Typography>
      </Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 4 }}>
        <Tab label="Login" />
        <Tab label="Register" />
      </Tabs>
      {tab === 0 ? (
        <Box component="form" onSubmit={handleLogin} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            fullWidth
          />
          {error && <Typography color="error.main">{typeof error === 'string' ? error : String(error)}</Typography>}
          {success && <Typography color="success.main">{typeof success === 'string' ? success : String(success)}</Typography>}
          <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ mt: 2 }}>
            Login
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleRegister} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            fullWidth
          />
          {error && <Typography color="error.main">{typeof error === 'string' ? error : String(error)}</Typography>}
          {success && <Typography color="success.main">{typeof success === 'string' ? success : String(success)}</Typography>}
          <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ mt: 2 }}>
            Register
          </Button>
        </Box>
      )}
    </Container>
  );
}
