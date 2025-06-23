import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

const plans = [
  {
    title: "Starter",
    description: "Perfect for small businesses",
    price: "$99",
    period: "/month",
    cta: "Start Free Trial",
    features: [
      { text: "1,000 call minutes", included: true },
      { text: "Form analytics", included: true },
      { text: "Basic call tracking", included: true },
      { text: "Email support", included: true },
      { text: "No call recording", included: false },
      { text: "No automation", included: false },
    ],
    featured: false,
    link: "#trial",
  },
  {
    title: "Professional",
    description: "For growing businesses",
    price: "$299",
    period: "/month",
    cta: "Start Free Trial",
    features: [
      { text: "5,000 call minutes", included: true },
      { text: "Advanced form analytics", included: true },
      { text: "Call recording (100 hours)", included: true },
      { text: "Basic automation", included: true },
      { text: "Priority support", included: true },
      { text: "No team features", included: false },
    ],
    featured: true,
    link: "#trial",
  },
  {
    title: "Enterprise",
    description: "For agencies & large teams",
    price: "$899",
    period: "/month",
    cta: "Contact Sales",
    features: [
      { text: "Unlimited call minutes", included: true },
      { text: "Full conversation intelligence", included: true },
      { text: "Unlimited call recording", included: true },
      { text: "Advanced automation", included: true },
      { text: "Multi-user access", included: true },
      { text: "Dedicated account manager", included: true },
    ],
    featured: false,
    link: "#demo",
  },
];

export default function Pricing() {
  return (
    <Box id="pricing" sx={{ py: { xs: 8, md: 10 }, bgcolor: "grey.50" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
        <Box textAlign="center" mb={6}>
          <Box component="span" sx={{ display: "inline-block", px: 2, py: 0.5, fontSize: 14, fontWeight: 600, color: "success.main", bgcolor: "success.light", borderRadius: 2, mb: 2 }}>
            Transparent Pricing
          </Box>
          <Typography variant="h4" fontWeight={700} mb={2}>
            Simple, <Box component="span" color="primary.main">Predictable Pricing</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
            All plans include a 14-day free trial with no credit card required
          </Typography>
        </Box>
        <Stack direction="row" justifyContent="center" spacing={2} mb={6}>
          <Button variant="contained" color="primary" sx={{ borderRadius: 2 }}>Monthly</Button>
          <Button variant="outlined" color="primary" sx={{ borderRadius: 2 }}>Annual (Save 20%)</Button>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={4} justifyContent="center">
          {plans.map((plan, idx) => (
            <Card key={plan.title} elevation={plan.featured ? 6 : 2} sx={{ flex: 1, borderRadius: 4, border: plan.featured ? "2px solid" : undefined, borderColor: plan.featured ? "primary.main" : undefined, position: "relative", overflow: "hidden", boxShadow: plan.featured ? 6 : 2 }}>
              {plan.featured && (
                <Box sx={{ position: "absolute", top: 0, right: 0, bgcolor: "primary.main", color: "#fff", fontSize: 12, fontWeight: 700, px: 2, py: 0.5, borderBottomLeftRadius: 8 }}>
                  MOST POPULAR
                </Box>
              )}
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={1}>{plan.title}</Typography>
                <Typography color="text.secondary" mb={3}>{plan.description}</Typography>
                <Box mb={3}>
                  <Typography variant="h4" fontWeight={700} component="span">{plan.price}</Typography>
                  <Typography color="text.secondary" component="span" sx={{ ml: 1 }}>{plan.period}</Typography>
                </Box>
                <Button href={plan.link} variant={plan.featured ? "contained" : "outlined"} color={plan.featured ? "primary" : "inherit"} fullWidth sx={{ mb: 3, borderRadius: 2 }}>
                  {plan.cta}
                </Button>
                <List dense>
                  {plan.features.map((feature, i) => (
                    <ListItem key={i} disableGutters sx={{ color: feature.included ? "inherit" : "text.disabled" }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {feature.included ? <CheckIcon color="success" fontSize="small" /> : <CloseIcon color="disabled" fontSize="small" />}
                      </ListItemIcon>
                      <Typography variant="body2">{feature.text}</Typography>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          ))}
        </Stack>
        <Box sx={{ mt: 8, bgcolor: "white", borderRadius: 3, boxShadow: 1, p: 4, maxWidth: 700, mx: "auto" }}>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={700} mb={1}>Need Custom Pricing?</Typography>
            <Typography color="text.secondary" mb={2}>
              We offer volume discounts and custom plans for agencies and businesses with unique requirements.
            </Typography>
            <Button href="#contact" variant="contained" color="secondary" sx={{ borderRadius: 2, fontWeight: 500 }}>
              Talk to Sales
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
