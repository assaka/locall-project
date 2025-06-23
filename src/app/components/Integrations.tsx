import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const integrations = [
  { src: "https://logo.clearbit.com/google.com", alt: "Google" },
  { src: "https://logo.clearbit.com/facebook.com", alt: "Facebook" },
  { src: "https://logo.clearbit.com/hubspot.com", alt: "HubSpot" },
  { src: "https://logo.clearbit.com/salesforce.com", alt: "Salesforce" },
  { src: "https://logo.clearbit.com/zapier.com", alt: "Zapier" },
  { src: "https://logo.clearbit.com/mailchimp.com", alt: "Mailchimp" },
  { src: "https://logo.clearbit.com/wordpress.com", alt: "WordPress" },
  { src: "https://logo.clearbit.com/shopify.com", alt: "Shopify" },
  { src: "https://logo.clearbit.com/zoho.com", alt: "Zoho" },
  { src: "https://logo.clearbit.com/activecampaign.com", alt: "ActiveCampaign" },
  { src: "https://logo.clearbit.com/klaviyo.com", alt: "Klaviyo" },
  { src: "https://logo.clearbit.com/calendly.com", alt: "Calendly" },
];

export default function Integrations() {
  return (
    <Box id="integrations" sx={{ py: { xs: 8, md: 10 }, bgcolor: "grey.50" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
        <Box textAlign="center" mb={6}>
          <Box component="span" sx={{ display: "inline-block", px: 2, py: 0.5, fontSize: 14, fontWeight: 600, color: "success.main", bgcolor: "success.light", borderRadius: 2, mb: 2 }}>
            Connect Everything
          </Box>
          <Typography variant="h4" fontWeight={700} mb={2}>
            Seamless <Box component="span" color="primary.main">Integrations</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
            Connect with your favorite tools to create a complete marketing stack
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(6, 1fr)" },
            gap: 4,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {integrations.map((item) => (
            <Box key={item.alt} component="img" src={item.src} alt={item.alt} sx={{ height: 32, mx: "auto", opacity: 0.7, transition: "opacity 0.3s", '&:hover': { opacity: 1 } }} />
          ))}
        </Box>
        <Box textAlign="center" mt={6}>
          <Box component="a" href="#integrations" sx={{ display: "inline-flex", alignItems: "center", px: 4, py: 2, bgcolor: "grey.900", color: "#fff", borderRadius: 2, fontWeight: 500, fontSize: 16, textDecoration: "none", boxShadow: 1, transition: "background 0.3s", '&:hover': { bgcolor: "grey.800" } }}>
            View All 100+ Integrations
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 