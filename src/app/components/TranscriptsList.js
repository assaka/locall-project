"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

export default function TranscriptsList({ callId }) {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTranscript() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/transcripts?callId=${callId}`);
        if (!res.ok) throw new Error('Failed to fetch transcript');
        const data = await res.json();
        setTranscript(data.transcript);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (callId) fetchTranscript();
  }, [callId]);

  if (loading) return <div className="flex items-center gap-2"><CircularProgress size={20} /> <span>Loading transcript...</span></div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!transcript) return <div>No transcript found.</div>;

  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>Transcript</Typography>
        <pre className="whitespace-pre-wrap text-sm mb-2">{transcript.transcript}</pre>
        {transcript.sentiment_score !== undefined && (
          <Chip label={`Sentiment Score: ${transcript.sentiment_score}`} color="primary" size="small" />
        )}
      </CardContent>
    </Card>
  );
}
