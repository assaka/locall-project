import React from "react";
import { Box, Typography, Stack, Button } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";

const CTASection = () => (
  <Box sx={{ bgcolor: "#2156d9", color: "#fff", py: { xs: 10, md: 14 }, textAlign: "center", position: "relative" }}>
    <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
      <Typography variant="h3" fontWeight={700} mb={3}>
        Ready to Transform Your{' '}
        <Box
          component="span"
          sx={{
            background: "linear-gradient(90deg, #2196f3 30%, #00c853 70%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 700,
          }}
        >
          Customer Intelligence
        </Box>
        ?
      </Typography>
      <Typography variant="h6" mb={5} sx={{ opacity: 0.95 }}>
        Join thousands of businesses using LoCall to optimize their marketing and grow revenue.
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} justifyContent="center" mb={2}>
        <Button
          variant="contained"
          color="inherit"
          size="large"
          sx={{ color: "#2156d9", fontWeight: 600, fontSize: 20, px: 5, py: 2, borderRadius: 2, boxShadow: 2 }}
          startIcon={<BoltIcon />}
        >
          Start Free 14-Day Trial
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          size="large"
          sx={{ color: "#fff", borderColor: "#fff", fontWeight: 600, fontSize: 20, px: 5, py: 2, borderRadius: 2 }}
          startIcon={<Box component="span" sx={{ display: 'flex', alignItems: 'center' }}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/><path stroke="currentColor" strokeWidth="2" d="M16 2v4M8 2v4M3 10h18"/><circle cx="8.5" cy="14.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="14.5" r="1.5" fill="currentColor"/></svg></Box>}
        >
          Schedule a Demo
        </Button>
      </Stack>
      <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
        No credit card required • Cancel anytime
      </Typography>
    </Box>
  </Box>
);

export default CTASection;
