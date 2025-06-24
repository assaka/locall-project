"use client";
import { useState } from "react";
import { supabase } from "@/app/utils/supabaseClient";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState("");
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
    if (error) setError(error.message);
    else setSuccess("Registration successful! Check your email to confirm.");
  };

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
          {error && <Typography color="error.main">{error}</Typography>}
          {success && <Typography color="success.main">{success}</Typography>}
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
          {error && <Typography color="error.main">{error}</Typography>}
          {success && <Typography color="success.main">{success}</Typography>}
          <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ mt: 2 }}>
            Register
          </Button>
        </Box>
      )}
    </Container>
  );
}
