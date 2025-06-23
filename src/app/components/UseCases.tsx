import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BuildIcon from "@mui/icons-material/Build";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";

const useCases = [
  {
    icon: <BuildIcon fontSize="large" color="primary" />,
    title: "Home Services",
    description: "Plumbers, electricians, and contractors use LoCall to:",
    features: [
      "Track which ads drive the most calls",
      "Automate lead follow-up via SMS",
      "Route calls to available technicians",
    ],
    link: "#casestudy-home",
    linkText: "Read case study",
  },
  {
    icon: <ShoppingBagIcon fontSize="large" color="primary" />,
    title: "E-commerce",
    description: "Online stores use LoCall to:",
    features: [
      "Reduce cart abandonment with form analytics",
      "Track phone orders to ad campaigns",
      "Automate post-purchase follow-ups",
    ],
    link: "#casestudy-ecom",
    linkText: "Read case study",
  },
  {
    icon: <TrackChangesIcon fontSize="large" color="primary" />,
    title: "Marketing Agencies",
    description: "Agencies use LoCall to:",
    features: [
      "Prove ROI to clients with call tracking",
      "Manage multiple clients in one dashboard",
      "Automate lead nurturing workflows",
    ],
    link: "#casestudy-agency",
    linkText: "Read case study",
  },
];

export default function UseCases() {
  return (
    <Box id="usecases" sx={{ py: { xs: 8, md: 10 }, bgcolor: "white" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
        <Box textAlign="center" mb={6}>
          <Box component="span" sx={{ display: "inline-block", px: 2, py: 0.5, fontSize: 14, fontWeight: 600, color: "success.main", bgcolor: "success.light", borderRadius: 2, mb: 2 }}>
            Success Stories
          </Box>
          <Typography variant="h4" fontWeight={700} mb={2}>
            Powering Businesses <Box component="span" color="primary.main">Across Industries</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
            See how different businesses leverage LoCall
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
          {useCases.map((uc, idx) => (
            <Card key={idx} elevation={1} sx={{ flex: 1, borderRadius: 3, overflow: "hidden" }}>
              <CardContent>
                <Box mb={2} display="flex" alignItems="center" justifyContent="center">
                  {uc.icon}
                </Box>
                <Typography variant="h6" fontWeight={700} mb={1}>{uc.title}</Typography>
                <Typography color="text.secondary" mb={2}>{uc.description}</Typography>
                <List dense>
                  {uc.features.map((feature, i) => (
                    <ListItem key={i} disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <Typography variant="body2">{feature}</Typography>
                    </ListItem>
                  ))}
                </List>
                <Box mt={2}>
                  <Box component="a" href={uc.link} sx={{ color: "primary.main", fontWeight: 500, fontSize: 14, textDecoration: "none", '&:hover': { textDecoration: "underline" } }}>
                    {uc.linkText}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
        <Box textAlign="center" mt={8}>
          <Box component="a" href="#casestudies" sx={{ display: "inline-flex", alignItems: "center", px: 4, py: 2, bgcolor: "grey.900", color: "#fff", borderRadius: 2, fontWeight: 500, fontSize: 16, textDecoration: "none", boxShadow: 1, transition: "background 0.3s", '&:hover': { bgcolor: "grey.800" } }}>
            View All Case Studies
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 