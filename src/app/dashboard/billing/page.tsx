'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  LinearProgress,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface BillingData {
  currentBalance: number;
  monthlyUsage: number;
  monthlyLimit: number;
  lastPayment: {
    amount: number;
    date: string;
    method: string;
  };
  nextBilling: string;
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    downloadUrl?: string;
  }>;
}

export default function BillingPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch billing data
    setTimeout(() => {
      setBillingData({
        currentBalance: 125.50,
        monthlyUsage: 875.25,
        monthlyLimit: 1000.00,
        lastPayment: {
          amount: 199.99,
          date: '2025-06-15',
          method: 'Credit Card ending in 4242'
        },
        nextBilling: '2025-07-15',
        invoices: [
          {
            id: 'INV-2025-001',
            date: '2025-06-15',
            amount: 199.99,
            status: 'paid',
            downloadUrl: '#'
          },
          {
            id: 'INV-2025-002',
            date: '2025-05-15',
            amount: 189.99,
            status: 'paid',
            downloadUrl: '#'
          },
          {
            id: 'INV-2025-003',
            date: '2025-04-15',
            amount: 179.99,
            status: 'paid',
            downloadUrl: '#'
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  if (!billingData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load billing information</Alert>
      </Container>
    );
  }

  const usagePercentage = (billingData.monthlyUsage / billingData.monthlyLimit) * 100;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Billing & Usage
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your billing information and view usage statistics
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Account Balance */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceWalletIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Account Balance</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                ${billingData.currentBalance.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available credits
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Usage */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Monthly Usage</Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                ${billingData.monthlyUsage.toFixed(2)}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={usagePercentage} 
                  color={usagePercentage > 80 ? 'warning' : 'primary'}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {usagePercentage.toFixed(1)}% of ${billingData.monthlyLimit.toFixed(2)} limit
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Last Payment */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CreditCardIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Last Payment</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                ${billingData.lastPayment.amount.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(billingData.lastPayment.date).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {billingData.lastPayment.method}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Next Billing */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReceiptIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Next Billing</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {new Date(billingData.nextBilling).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Billing date
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Usage Alert */}
      {usagePercentage > 80 && (
        <Alert severity="warning" sx={{ my: 3 }}>
          You've used {usagePercentage.toFixed(1)}% of your monthly limit. Consider upgrading your plan to avoid service interruption.
        </Alert>
      )}

      {/* Action Buttons */}
      <Box sx={{ my: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" color="primary" startIcon={<CreditCardIcon />}>
          Add Payment Method
        </Button>
        <Button variant="outlined" color="primary">
          Upgrade Plan
        </Button>
        <Button variant="outlined" color="secondary">
          Download Statement
        </Button>
      </Box>

      {/* Invoice History */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Invoice History
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {billingData.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.id}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell align="right">${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={invoice.status.toUpperCase()}
                        color={
                          invoice.status === 'paid' ? 'success' :
                          invoice.status === 'pending' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {invoice.downloadUrl && (
                        <Button size="small" variant="outlined">
                          Download
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
}
