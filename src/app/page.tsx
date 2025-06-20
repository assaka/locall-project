"use client"

import Link from "next/link";
import { Box, Typography, Card, CardActionArea, Stack } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import CallIcon from '@mui/icons-material/Call';
import EditNoteIcon from '@mui/icons-material/EditNote';

const navItems = [
  {
    href: "/purchase",
    icon: <PhoneIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />,
    label: "Purchase a Twilio Number",
  },
  {
    href: "/call",
    icon: <CallIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />,
    label: "Initiate a Call",
  },
  {
    href: "/form",
    icon: <EditNoteIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />,
    label: "Submit a Form",
  },
];

export default function Home() {
  return (
    <Box textAlign="center">
      <Typography variant="h3" fontWeight={700} mb={5}>
        Welcome to Locall Demo
      </Typography>
      <Stack spacing={3} alignItems="center">
        {navItems.map((item) => (
          <Card key={item.href} sx={{ width: 400, borderRadius: 3, boxShadow: 3 }}>
            <CardActionArea component={Link} href={item.href} sx={{ display: 'flex', alignItems: 'center', px: 3, py: 2 }}>
              {item.icon}
              <Typography variant="h6" fontWeight={500} color="text.primary">
                {item.label}
              </Typography>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
