import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

const steps = [
  {
    number: 1,
    title: "Install Tracking",
    description: "Add our JavaScript snippet or forward calls to our numbers",
  },
  {
    number: 2,
    title: "Collect Data",
    description: "We capture calls, form fills, and complete customer journeys",
  },
  {
    number: 3,
    title: "Optimize & Grow",
    description: "Use insights to improve conversions and maximize ROI",
  },
];

export default function HowItWorks() {
  return (
    <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: "white" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
        <Box textAlign="center" mb={6}>
          <Box component="span" sx={{ display: "inline-block", px: 2, py: 0.5, fontSize: 14, fontWeight: 600, color: "success.main", bgcolor: "success.light", borderRadius: 2, mb: 2 }}>
            Simple Setup
          </Box>
          <Typography variant="h4" fontWeight={700} mb={2}>
            Get Set Up in <Box component="span" color="primary.main">Minutes</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
            Start collecting valuable customer insights today
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", md: "row" }} spacing={4} justifyContent="center" alignItems="stretch">
          {steps.map((step) => (
            <Card key={step.number} elevation={1} sx={{ flex: 1, borderRadius: 3, textAlign: "center", p: 3 }}>
              <CardContent>
                <Box sx={{ bgcolor: "primary.main", color: "#fff", width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3, fontSize: 32, fontWeight: 700, opacity: 0.1, transition: "background 0.3s" }}>
                  <Typography variant="h4" fontWeight={700} color="primary" sx={{ opacity: 1 }}>{step.number}</Typography>
                </Box>
                <Typography variant="h6" fontWeight={700} mb={1}>{step.title}</Typography>
                <Typography color="text.secondary">{step.description}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    </Box>
  );
} 