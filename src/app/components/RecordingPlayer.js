"use client";

import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

export default function RecordingPlayer({ recordingId }) {
  const [recording, setRecording] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [sentiment, setSentiment] = useState(null);

  useEffect(() => {
    if (!recordingId) return;
    fetch(`/api/recordings?recordingId=${recordingId}`)
      .then(res => res.json())
      .then(data => setRecording(data.recording));
    fetch(`/api/transcripts?callId=${recordingId}`)
      .then(res => res.json())
      .then(data => setTranscript(data.transcript));
    fetch(`/api/transcripts/sentiment?callId=${recordingId}`)
      .then(res => res.json())
      .then(data => setSentiment(data.sentiment_score));
  }, [recordingId]);

  if (!recording) return <div className="flex items-center gap-2"><CircularProgress size={20} /> <span>Loading recording...</span></div>;
  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" gutterBottom>Recording</Typography>
        <audio controls src={recording.url} className="w-full my-2" />
        {transcript && (
          <div className="bg-gray-100 p-3 rounded mt-2">
            <strong>Transcript:</strong>
            <div className="text-sm mt-1">{transcript.transcript}</div>
          </div>
        )}
        {sentiment !== null && (
          <div className="mt-2">
            <Chip label={`Sentiment: ${sentiment}`} color={sentiment > 0 ? 'success' : sentiment < 0 ? 'error' : 'default'} size="small" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
