import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

const productLinks = [
  { label: "Dashboard", href: "/dashboard" },
  ...["Features", "Pricing", "Integrations", "Updates", "Roadmap"].map(l => ({ label: l, href: "#" }))
];
const resourceLinks = ["Blog", "Guides", "Help Center", "API Docs", "Webinars"];
const companyLinks = ["About Us", "Careers", "Contact", "Press", "Partners"];
const policyLinks = ["Privacy Policy", "Terms of Service", "Cookie Policy"];

export default function Footer() {
  return (
    <Box sx={{ bgcolor: "grey.900", color: "#fff", pt: 8, pb: 4, mt: 8 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={6} justifyContent="space-between" mb={6}>
          <Box flex={2}>
            <Typography variant="h6" fontWeight={700} mb={2} display="flex" alignItems="center">
              LoCall
            </Typography>
            <Typography color="grey.400" mb={2}>
              The all-in-one platform for call tracking, form analytics, and customer intelligence.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Box component="a" href="#" sx={{ color: "grey.400", '&:hover': { color: "#fff" } }}><i className="fab fa-facebook-f"></i></Box>
              <Box component="a" href="#" sx={{ color: "grey.400", '&:hover': { color: "#fff" } }}><i className="fab fa-twitter"></i></Box>
              <Box component="a" href="#" sx={{ color: "grey.400", '&:hover': { color: "#fff" } }}><i className="fab fa-linkedin-in"></i></Box>
              <Box component="a" href="#" sx={{ color: "grey.400", '&:hover': { color: "#fff" } }}><i className="fab fa-instagram"></i></Box>
            </Stack>
          </Box>
          <Box flex={1}>
            <Typography fontWeight={700} mb={2}>Product</Typography>
            <Stack spacing={1}>{productLinks.map((l) => <Box key={l.label} component="a" href={l.href} sx={{ color: "grey.400", fontSize: 15, '&:hover': { color: "#fff" } }}>{l.label}</Box>)}</Stack>
          </Box>
          <Box flex={1}>
            <Typography fontWeight={700} mb={2}>Resources</Typography>
            <Stack spacing={1}>{resourceLinks.map((l) => <Box key={l} component="a" href="#" sx={{ color: "grey.400", fontSize: 15, '&:hover': { color: "#fff" } }}>{l}</Box>)}</Stack>
          </Box>
          <Box flex={1}>
            <Typography fontWeight={700} mb={2}>Company</Typography>
            <Stack spacing={1}>{companyLinks.map((l) => <Box key={l} component="a" href="#" sx={{ color: "grey.400", fontSize: 15, '&:hover': { color: "#fff" } }}>{l}</Box>)}</Stack>
          </Box>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" spacing={2} pt={4} borderTop="1px solid #222">
          <Typography color="grey.400" fontSize={14}>
            &copy; {new Date().getFullYear()} LoCall. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={4}>
            {policyLinks.map((l) => <Box key={l} component="a" href="#" sx={{ color: "grey.400", fontSize: 14, '&:hover': { color: "#fff" } }}>{l}</Box>)}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
