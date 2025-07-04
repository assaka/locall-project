'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  SentimentSatisfied as SentimentIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface CallAnalyticsProps {
  callId?: string;
  recordingUrl?: string;
  onAnalysisComplete?: (analysis: any) => void;
}

interface TranscriptData {
  id: string;
  call_id: string;
  transcript_text: string;
  sentiment_score: number;
  confidence: number;
  language: string;
  duration: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
  sentiment_details?: {
    overall_sentiment: string;
    emotions: {
      joy: number;
      sadness: number;
      anger: number;
      fear: number;
      surprise: number;
      disgust: number;
    };
    key_phrases: string[];
    conversation_metrics: {
      speaker_sentiment: { [key: string]: number };
      tone_changes: number;
      escalation_points: Array<{ timestamp: number; reason: string }>;
      resolution_indicators: string[];
    };
  };
  call_insights?: {
    call_quality_score: number;
    customer_satisfaction_score: number;
    agent_performance_score: number;
    call_outcome: string;
    topics_discussed: string[];
    action_items: string[];
    next_steps: string[];
    compliance_flags: string[];
  };
  processing_status: string;
}

const EMOTION_COLORS = {
  joy: '#4caf50',
  sadness: '#2196f3',
  anger: '#f44336',
  fear: '#ff9800',
  surprise: '#9c27b0',
  disgust: '#795548'
};

const SENTIMENT_COLORS = {
  positive: '#4caf50',
  negative: '#f44336',
  neutral: '#757575'
};

export default function CallAnalytics({ callId, recordingUrl, onAnalysisComplete }: CallAnalyticsProps) {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState<string>(callId || '');
  const [availableCalls, setAvailableCalls] = useState<Array<{ id: string; created_at: string; duration?: number }>>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  const fetchAvailableCalls = async () => {
    try {
      setLoadingCalls(true);
      const response = await fetch('/api/calls');
      const data = await response.json();
      
      if (response.ok) {
        setAvailableCalls(data.calls || []);
        // If no callId provided and calls available, select the first one
        if (!callId && data.calls && data.calls.length > 0) {
          setSelectedCallId(data.calls[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch calls:', err);
    } finally {
      setLoadingCalls(false);
    }
  };

  const fetchTranscript = async () => {
    if (!selectedCallId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/transcripts?callId=${selectedCallId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transcript');
      }
      
      setTranscript(data.transcript);
      
      if (onAnalysisComplete && data.transcript) {
        onAnalysisComplete(data.transcript);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transcript');
    } finally {
      setLoading(false);
    }
  };

  const triggerReanalysis = async () => {
    if (!transcript?.transcript_text || !selectedCallId) return;
    
    try {
      setReanalyzing(true);
      
      const response = await fetch('/api/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: selectedCallId,
          transcriptText: transcript.transcript_text,
          forceReprocess: true
        })
      });
      
      if (response.ok) {
        // Refresh transcript data
        await fetchTranscript();
      }
    } catch (err) {
      console.error('Reanalysis failed:', err);
    } finally {
      setReanalyzing(false);
    }
  };

  useEffect(() => {
    fetchAvailableCalls();
  }, []);

  useEffect(() => {
    if (selectedCallId) {
      fetchTranscript();
    }
  }, [selectedCallId]);

  const getSentimentColor = (score: number): string => {
    if (score > 0.1) return SENTIMENT_COLORS.positive;
    if (score < -0.1) return SENTIMENT_COLORS.negative;
    return SENTIMENT_COLORS.neutral;
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUpIcon sx={{ color: SENTIMENT_COLORS.positive }} />;
      case 'negative': return <TrendingDownIcon sx={{ color: SENTIMENT_COLORS.negative }} />;
      default: return <SentimentIcon sx={{ color: SENTIMENT_COLORS.neutral }} />;
    }
  };

  const getQualityScoreColor = (score: number): string => {
    if (score >= 8) return '#4caf50';
    if (score >= 6) return '#ff9800';
    return '#f44336';
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography>Analyzing call...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button size="small" onClick={fetchTranscript}>Retry</Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!transcript) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            No transcript available for this call.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const emotionsData = transcript.sentiment_details?.emotions ? 
    Object.entries(transcript.sentiment_details.emotions).map(([emotion, value]) => ({
      name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      value: Math.round(value * 100),
      color: EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS]
    })) : [];

  const sentimentTimelineData = transcript.segments?.map((segment, index) => ({
    time: formatDuration(segment.start),
    sentiment: Math.random() * 2 - 1, // Mock sentiment for each segment
    confidence: segment.confidence
  })) || [];

  return (
    <Box>
      {/* Call Selector (only when no callId prop provided) */}
      {!callId && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <FormControl fullWidth>
              <InputLabel id="call-select-label">Select Call to Analyze</InputLabel>
              <Select
                labelId="call-select-label"
                value={selectedCallId}
                label="Select Call to Analyze"
                onChange={(e) => setSelectedCallId(e.target.value)}
                disabled={loadingCalls}
              >
                {availableCalls.map((call) => (
                  <MenuItem key={call.id} value={call.id}>
                    {`Call ${call.id} - ${new Date(call.created_at).toLocaleDateString()} ${call.duration ? `(${Math.round(call.duration)}s)` : ''}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {loadingCalls && (
              <Box display="flex" justifyContent="center" mt={2}>
                <CircularProgress size={24} />
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Header with Key Metrics */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Call Analytics</Typography>
            <Box display="flex" gap={1}>
              <Tooltip title="Re-analyze call">
                <IconButton 
                  onClick={triggerReanalysis} 
                  disabled={reanalyzing}
                  size="small"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              {recordingUrl && (
                <Tooltip title="Play recording">
                  <IconButton 
                    onClick={() => window.open(recordingUrl, '_blank')}
                    size="small"
                  >
                    <PlayIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            {/* Overall Sentiment */}
            <Box sx={{ flex: 1 }}>
              <Box textAlign="center">
                <Avatar 
                  sx={{ 
                    mx: 'auto', 
                    mb: 1, 
                    bgcolor: getSentimentColor(transcript.sentiment_score),
                    width: 56, 
                    height: 56 
                  }}
                >
                  {getSentimentIcon(transcript.sentiment_details?.overall_sentiment || 'neutral')}
                </Avatar>
                <Typography variant="h4" color={getSentimentColor(transcript.sentiment_score)}>
                  {Math.round((transcript.sentiment_score + 1) * 50)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {transcript.sentiment_details?.overall_sentiment?.toUpperCase() || 'NEUTRAL'}
                </Typography>
                <Typography variant="caption" display="block">
                  Confidence: {Math.round((transcript.confidence || 0) * 100)}%
                </Typography>
              </Box>
            </Box>

            {/* Call Quality Scores */}
            {transcript.call_insights && (
              <>
                <Box sx={{ flex: 1 }}>
                  <Box textAlign="center">
                    <Typography variant="h4" color={getQualityScoreColor(transcript.call_insights.call_quality_score)}>
                      {transcript.call_insights.call_quality_score}/10
                    </Typography>
                    <Typography variant="body2">Call Quality</Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box textAlign="center">
                    <Typography variant="h4" color={getQualityScoreColor(transcript.call_insights.customer_satisfaction_score)}>
                      {transcript.call_insights.customer_satisfaction_score}/10
                    </Typography>
                    <Typography variant="body2">Customer Satisfaction</Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box textAlign="center">
                    <Typography variant="h4" color={getQualityScoreColor(transcript.call_insights.agent_performance_score)}>
                      {transcript.call_insights.agent_performance_score}/10
                    </Typography>
                    <Typography variant="body2">Agent Performance</Typography>
                  </Box>
                </Box>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
        {/* Transcript */}
        <Box sx={{ flex: 2 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Transcript</Typography>
              <Chip 
                label={`${transcript.duration ? formatDuration(transcript.duration) : 'Unknown duration'}`}
                size="small" 
                sx={{ ml: 2 }}
              />
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <Typography variant="body1" paragraph>
                  {showFullTranscript 
                    ? transcript.transcript_text
                    : `${transcript.transcript_text.substring(0, 300)}${transcript.transcript_text.length > 300 ? '...' : ''}`
                  }
                </Typography>
                {transcript.transcript_text.length > 300 && (
                  <Button 
                    size="small" 
                    onClick={() => setShowFullTranscript(!showFullTranscript)}
                  >
                    {showFullTranscript ? 'Show Less' : 'Show More'}
                  </Button>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* Emotions Breakdown */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PsychologyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Emotions Detected
              </Typography>
              <Box height={200}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emotionsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {emotionsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip formatter={(value) => [`${value}%`, 'Intensity']} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Additional Analysis */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
        {/* Key Phrases */}
        {transcript.sentiment_details?.key_phrases && (
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Key Phrases</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {transcript.sentiment_details.key_phrases.slice(0, 10).map((phrase, index) => (
                    <Chip 
                      key={index} 
                      label={phrase} 
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Call Insights */}
        {transcript.call_insights && (
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Call Insights</Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      {transcript.call_insights.call_outcome === 'resolved' ? 
                        <CheckCircleIcon color="success" /> : 
                        <WarningIcon color="warning" />
                      }
                    </ListItemIcon>
                    <ListItemText 
                      primary="Outcome" 
                      secondary={transcript.call_insights.call_outcome.replace('_', ' ').toUpperCase()}
                    />
                  </ListItem>
                  
                  {transcript.call_insights.topics_discussed.length > 0 && (
                    <ListItem>
                      <ListItemText 
                        primary="Topics Discussed" 
                        secondary={transcript.call_insights.topics_discussed.join(', ')}
                      />
                    </ListItem>
                  )}

                  {transcript.call_insights.action_items.length > 0 && (
                    <ListItem>
                      <ListItemText 
                        primary="Action Items" 
                        secondary={
                          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                            {transcript.call_insights.action_items.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </Box>
                        }
                      />
                    </ListItem>
                  )}

                  {transcript.call_insights.compliance_flags.length > 0 && (
                    <ListItem>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Compliance Flags" 
                        secondary={transcript.call_insights.compliance_flags.join(', ')}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Box>
        )}
      </Stack>

      {/* Sentiment Timeline */}
      {sentimentTimelineData.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Sentiment Timeline</Typography>
              <Box height={200}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sentimentTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[-1, 1]} />
                    <ChartTooltip 
                      formatter={(value: number) => [
                        `${value > 0 ? 'Positive' : value < 0 ? 'Negative' : 'Neutral'} (${Math.abs(value).toFixed(2)})`, 
                        'Sentiment'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sentiment" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Processing Status */}
      {transcript.processing_status === 'processing' && (
        <Box mt={2}>
          <Alert severity="info">
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={20} />
              AI analysis in progress...
            </Box>
          </Alert>
        </Box>
      )}

      {reanalyzing && (
        <Box mt={2}>
          <Alert severity="info">
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={20} />
              Re-analyzing call with latest AI models...
            </Box>
          </Alert>
        </Box>
      )}
    </Box>
  );
}
