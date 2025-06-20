import Link from "next/link";
import "./globals.css";
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{
        fontFamily: 'Inter, Arial, sans-serif',
        background: '#f7f8fa',
        margin: 0,
        minHeight: '100vh',
      }}>
        <AppBar position="static" color="primary" sx={{ mb: 4 }}>
          <Toolbar sx={{ maxWidth: 900, width: '100%', mx: 'auto', display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h5" fontWeight={700} component="div">
              Locall Demo
            </Typography>
            <Box>
              <Button color="inherit" component={Link} href="/">Home</Button>
              <Button color="inherit" component={Link} href="/purchase">Purchase</Button>
              <Button color="inherit" component={Link} href="/call">Call</Button>
              <Button color="inherit" component={Link} href="/form">Form</Button>
            </Box>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 2, py: 4, minHeight: 400 }}>
          {children}
        </Container>
        <Box textAlign="center" color="#888" mt={6} mb={2} fontSize={14}>
          &copy; {new Date().getFullYear()} Locall Demo
        </Box>
      </body>
    </html>
  );
}
