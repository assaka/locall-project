import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import StarIcon from "@mui/icons-material/Star";
import StarHalfIcon from "@mui/icons-material/StarHalf";

const testimonials = [
  {
    name: "Sarah Johnson",
    title: "Marketing Director, HomeServices Inc.",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    quote:
      "LoCall helped us reduce wasted ad spend by 42% in the first 3 months. The call tracking combined with form analytics gives us complete visibility into our customer journey.",
    rating: 5,
    date: "2 months ago",
  },
  {
    name: "Michael Rodriguez",
    title: "CEO, Digital Growth Agency",
    avatar: "https://randomuser.me/api/portraits/men/54.jpg",
    quote:
      "We switched from using 4 different tools to LoCall and it's been a game-changer. Having call recording, form tracking, and automation in one platform saves us hours each week.",
    rating: 5,
    date: "1 month ago",
  },
  {
    name: "Jennifer Lee",
    title: "E-commerce Manager, StyleHub",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    quote:
      "The conversation intelligence features helped us identify common customer objections. We trained our team based on these insights and saw a 28% increase in conversion rates.",
    rating: 4.5,
    date: "3 weeks ago",
  },
];

export default function Testimonials() {
  return (
    <Box id="testimonials" sx={{ py: { xs: 8, md: 10 }, bgcolor: "white" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
        <Box textAlign="center" mb={6}>
          <Box component="span" sx={{ display: "inline-block", px: 2, py: 0.5, fontSize: 14, fontWeight: 600, color: "success.main", bgcolor: "success.light", borderRadius: 2, mb: 2 }}>
            Customer Love
          </Box>
          <Typography variant="h4" fontWeight={700} mb={2}>
            Trusted by <Box component="span" color="primary.main">8,000+ Businesses</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
            Don't just take our word for it - hear from our customers
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
          {testimonials.map((t, idx) => (
            <Card key={idx} elevation={1} sx={{ flex: 1, borderRadius: 3, p: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar src={t.avatar} alt={t.name} sx={{ width: 48, height: 48, mr: 2 }} />
                  <Box>
                    <Typography fontWeight={700}>{t.name}</Typography>
                    <Typography color="text.secondary" fontSize={14}>{t.title}</Typography>
                  </Box>
                </Box>
                <Typography color="text.secondary" fontStyle="italic" mb={2}>
                  "{t.quote}"
                </Typography>
                <Box display="flex" alignItems="center" mb={1}>
                  {[...Array(Math.floor(t.rating))].map((_, i) => (
                    <StarIcon key={i} fontSize="small" sx={{ color: "#FFD600" }} />
                  ))}
                  {t.rating % 1 !== 0 && <StarHalfIcon fontSize="small" sx={{ color: "#FFD600" }} />}
                  <Typography color="text.secondary" fontSize={14} ml={2}>{t.date}</Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
        <Box textAlign="center" mt={6}>
          <Box component="a" href="#reviews" sx={{ color: "primary.main", fontWeight: 500, fontSize: 16, textDecoration: "none", '&:hover': { textDecoration: "underline" } }}>
            Read more customer stories
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 