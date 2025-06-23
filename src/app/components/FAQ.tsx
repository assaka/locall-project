import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const faqs = [
  {
    question: "How does the call tracking work?",
    answer:
      "LoCall provides unique tracking numbers that you place on your website, ads, or other marketing materials. When a customer calls, we capture detailed information including the caller's number, location, call duration, and which marketing source drove the call. You can also enable call recording and transcription for deeper insights.",
  },
  {
    question: "Can I use my existing phone numbers?",
    answer:
      "Yes! We offer number porting services so you can bring your existing local or toll-free numbers to LoCall. Alternatively, you can purchase new numbers directly through our platform in over 50 countries.",
  },
  {
    question: "How does form analytics help my business?",
    answer:
      "Our form analytics show you exactly where visitors hesitate or abandon your forms. You'll see field-by-field completion rates, time spent per field, and common drop-off points. This helps you identify and fix problematic form fields that may be costing you conversions.",
  },
  {
    question: "Is there a contract or long-term commitment?",
    answer:
      "No. All plans are month-to-month with no long-term contracts. You can cancel anytime. We do offer discounts for annual commitments if you prefer to save money by paying upfront.",
  },
];

export default function FAQ() {
  return (
    <Box id="faq" sx={{ py: { xs: 8, md: 10 }, bgcolor: "grey.50" }}>
      <Box sx={{ maxWidth: 900, mx: "auto", px: 2 }}>
        <Box textAlign="center" mb={6}>
          <Box component="span" sx={{ display: "inline-block", px: 2, py: 0.5, fontSize: 14, fontWeight: 600, color: "success.main", bgcolor: "success.light", borderRadius: 2, mb: 2 }}>
            Have Questions?
          </Box>
          <Typography variant="h4" fontWeight={700} mb={2}>
            Frequently Asked <Box component="span" color="primary.main">Questions</Box>
          </Typography>
        </Box>
        <Box mb={6}>
          {faqs.map((faq, idx) => (
            <Accordion key={idx} sx={{ mb: 2, borderRadius: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600}>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
        <Box textAlign="center">
          <Box component="a" href="#faq" sx={{ color: "primary.main", fontWeight: 500, fontSize: 16, textDecoration: "none", '&:hover': { textDecoration: "underline" } }}>
            View full FAQ
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 