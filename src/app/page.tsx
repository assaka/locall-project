"use client";
import React from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Link from "next/link";
import StarIcon from "@mui/icons-material/Star";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";
import BoltIcon from "@mui/icons-material/Bolt";
import FeatureCall from "./components/FeatureCall";
import FeatureForm from "./components/FeatureForm";
import FeaturePurchase from "./components/FeaturePurchase";
import HowItWorks from "./components/HowItWorks";
import Integrations from "./components/Integrations";
import UseCases from "./components/UseCases";
import Pricing from "./components/Pricing";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import FeatureCloudCallCenter from "./components/FeatureCloudCallCenter";
import FeatureAdIntelligence from "./components/FeatureAdIntelligence";

export default function Home() {
  return (
    <>
      {/* Custom Navbar */}
      <Box sx={{ width: "100%", bgcolor: "white", borderBottom: "1px solid #eee", py: 3, px: { xs: 2, md: 4 }, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ width: "100%", maxWidth: "85%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          {/* Logo */}
          <Typography variant="h5" fontWeight={700} color="primary" sx={{ display: "flex", alignItems: "center", minWidth: 120 }}>
            LoCall
          </Typography>
          {/* Menu */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 4, mx: "auto" }}>
            <Button component={Link} href="#features" color="inherit" sx={{ fontWeight: 400, fontSize: 18, px: 1, textTransform: "none" }}>Features</Button>
            <Button component={Link} href="#usecases" color="inherit" sx={{ fontWeight: 400, fontSize: 18, px: 1, textTransform: "none" }}>Use Cases</Button>
            <Button component={Link} href="#pricing" color="inherit" sx={{ fontWeight: 400, fontSize: 18, px: 1, textTransform: "none" }}>Pricing</Button>
            <Button component={Link} href="#integrations" color="inherit" sx={{ fontWeight: 400, fontSize: 18, px: 1, textTransform: "none" }}>Integrations</Button>
            <Button component={Link} href="#resources" color="inherit" sx={{ fontWeight: 400, fontSize: 18, px: 1, textTransform: "none" }}>Resources</Button>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 180, justifyContent: "flex-end" }}>
            <Button component={Link} href="#" color="inherit" sx={{ fontWeight: 400, fontSize: 18, px: 1, textTransform: "none" }}>Login</Button>
            <Button component={Link} href="#demo" variant="contained" color="primary" endIcon={<ArrowRightAltIcon />} sx={{ fontWeight: 700, px: 4, py: 1.5, borderRadius: 2, boxShadow: 2, textTransform: "none", fontSize: 18 }}>
              Get Demo
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Hero Section */}
      <Box sx={{ position: "relative", bgcolor: "primary.main", color: "#fff", py: { xs: 8, md: 16 }, overflow: "hidden" }}>
        <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, position: "relative", zIndex: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={8} alignItems="center" justifyContent="space-between">
            <Box flex={1}>
              <Typography variant="h2" fontWeight={700} mb={3}>
                The Complete <Box component="span" color="success.main">Customer Intelligence</Box> Platform
              </Typography>
              <Typography variant="h5" mb={4} sx={{ opacity: 0.9, maxWidth: 500 }}>
                Combine call tracking, form analytics, CRM, and marketing automation in one powerful platform. Optimize every customer interaction.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={5}>
                <Button href="#trial" variant="contained" color="inherit" sx={{ color: "primary.main", fontWeight: 500, px: 4, py: 1.5, boxShadow: 3 }} startIcon={<BoltIcon />}>
                  Start 14-Day Free Trial
                </Button>
                <Button href="#demo" variant="outlined" color="inherit" sx={{ color: "#fff", borderColor: "#fff", fontWeight: 500, px: 4, py: 1.5 }} startIcon={<PlayCircleFilledWhiteIcon />}>
                  Watch Demo
                </Button>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Stack direction="row" spacing={-1}>
                  <Box component="img" src="https://randomuser.me/api/portraits/women/12.jpg" alt="" sx={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid #fff" }} />
                  <Box component="img" src="https://randomuser.me/api/portraits/men/32.jpg" alt="" sx={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid #fff" }} />
                  <Box component="img" src="https://randomuser.me/api/portraits/women/45.jpg" alt="" sx={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid #fff" }} />
                </Stack>
                <Box>
                  <Stack direction="row" spacing={0.5} mb={0.5} color="#FFD600">
                    {[...Array(5)].map((_, i) => <StarIcon key={i} fontSize="small" />)}
                  </Stack>
                  <Typography variant="body2">Trusted by 8,000+ businesses</Typography>
                </Box>
              </Stack>
            </Box>
            <Box flex={1} mt={{ xs: 8, md: 0 }}>
              <Box sx={{ position: "relative", borderRadius: 6, overflow: "hidden", boxShadow: 6, border: "1px solid #fff3" }}>
                <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 40, bgcolor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", px: 2 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "red", mr: 1 }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "yellow", mr: 1 }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "green" }} />
                </Box>
                <Box component="img" src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" alt="LoCall Dashboard" sx={{ width: "100%", height: "auto", mt: 5, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }} />
              </Box>
            </Box>
          </Stack>
        </Box>
        {/* Decorative gradient at the bottom */}
        <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 64, background: "linear-gradient(to top, #fff, transparent)" }} />
      </Box>

      {/* Logo Cloud */}
      <Box sx={{ py: 6, bgcolor: "white" }}>
        <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
          <Typography align="center" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: 2, mb: 3, fontSize: 14 }}>
            Trusted by Industry Leaders
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(6, 1fr)" },
              gap: 4,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box component="img" src="https://logo.clearbit.com/hubspot.com" alt="HubSpot" sx={{ height: 32, opacity: 0.6, mx: "auto", transition: "opacity 0.3s", '&:hover': { opacity: 1 } }} />
            <Box component="img" src="https://logo.clearbit.com/salesforce.com" alt="Salesforce" sx={{ height: 32, opacity: 0.6, mx: "auto", transition: "opacity 0.3s", '&:hover': { opacity: 1 } }} />
            <Box component="img" src="https://logo.clearbit.com/google.com" alt="Google" sx={{ height: 32, opacity: 0.6, mx: "auto", transition: "opacity 0.3s", '&:hover': { opacity: 1 } }} />
            <Box component="img" src="https://logo.clearbit.com/meta.com" alt="Meta" sx={{ height: 32, opacity: 0.6, mx: "auto", transition: "opacity 0.3s", '&:hover': { opacity: 1 } }} />
            <Box component="img" src="https://logo.clearbit.com/zapier.com" alt="Zapier" sx={{ height: 32, opacity: 0.6, mx: "auto", transition: "opacity 0.3s", '&:hover': { opacity: 1 } }} />
            <Box component="img" src="https://logo.clearbit.com/shopify.com" alt="Shopify" sx={{ height: 32, opacity: 0.6, mx: "auto", transition: "opacity 0.3s", '&:hover': { opacity: 1 } }} />
          </Box>
        </Box>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: { xs: 8, md: 10 }, bgcolor: "grey.50" }}>
        <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
          <Box textAlign="center" mb={6}>
            <Box component="span" sx={{ display: "inline-block", px: 2, py: 0.5, fontSize: 14, fontWeight: 600, color: "success.main", bgcolor: "success.light", borderRadius: 2, mb: 2 }}>
              All-in-One Platform
            </Box>
            <Typography variant="h4" fontWeight={700} mb={2}>
              Everything You Need to <Box component="span" color="primary.main">Understand Customers</Box>
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
              Combining the best features of leading solutions with seamless integration
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 4, mb: 4 }}>
            <FeatureCall />
            <FeatureForm />
            <FeaturePurchase />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 4 }}>
            <FeatureCloudCallCenter />
            <FeatureAdIntelligence />
          </Box>
        </Box>
      </Box>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Integrations Section */}
      <Integrations />

      {/* Use Cases Section */}
      <UseCases />

      {/* Pricing Section */}
      <Pricing />

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
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

      {/* FAQ Section */}
      <FAQ />

      {/* Footer Section */}
      <Footer />

      {/* Features, How It Works, Integrations, Use Cases, Pricing, Testimonials, FAQ, Footer */}
      {/* ... (For brevity, the rest of the sections from your HTML will be converted in the same way) ... */}
    </>
  );
}
