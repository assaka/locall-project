// lib/whisper-transcription-service.ts
// Dedicated Whisper API service for speech-to-text transcription

export interface WhisperTranscriptionResult {
  text: string;
  language: string;
  duration: number;
  confidence: number;
  segments: WhisperSegment[];
}

export interface WhisperSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface WhisperProvider {
  name: string;
  transcribe: (audioBlob: Blob) => Promise<WhisperTranscriptionResult>;
}

export class WhisperTranscriptionService {
  private static providers: WhisperProvider[] = [
    {
      name: 'OpenAI Whisper',
      transcribe: (audioBlob: Blob) => this.transcribeWithOpenAI(audioBlob)
    },
    {
      name: 'Replicate Whisper',
      transcribe: (audioBlob: Blob) => this.transcribeWithReplicate(audioBlob)
    },
    {
      name: 'Local Whisper',
      transcribe: (audioBlob: Blob) => this.transcribeWithLocal(audioBlob)
    }
  ];

  /**
   * Main transcription method - tries providers in order of reliability
   */
  static async transcribeAudio(audioUrl: string): Promise<WhisperTranscriptionResult> {
    try {
      console.log('Starting Whisper transcription for audio:', audioUrl);
      
      // Download audio file
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
      }

      const audioBlob = await audioResponse.blob();
      console.log('Audio downloaded, size:', audioBlob.size, 'bytes');

      // Try each Whisper provider
      for (const provider of this.providers) {
        try {
          console.log(`Attempting transcription with ${provider.name}...`);
          const result = await provider.transcribe(audioBlob);
          console.log(`✅ Transcription successful with ${provider.name}`);
          return result;
        } catch (error) {
          console.warn(`❌ ${provider.name} failed:`, error.message);
          continue;
        }
      }

      throw new Error('All Whisper providers failed');

    } catch (error) {
      console.error('Transcription failed:', error);
      
      // Fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock transcription for development');
        return this.generateMockTranscription();
      }
      
      throw error;
    }
  }

  /**
   * OpenAI Whisper API - Primary choice
   */
  private static async transcribeWithOpenAI(audioBlob: Blob): Promise<WhisperTranscriptionResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');
    formData.append('temperature', '0.0');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI Whisper API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return {
      text: result.text || '',
      language: result.language || 'en',
      duration: result.duration || 0,
      confidence: this.calculateSegmentConfidence(result.segments || []),
      segments: result.segments?.map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
        confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : 0.8
      })) || []
    };
  }

  /**
   * Replicate Whisper API - Alternative
   */
  private static async transcribeWithReplicate(audioBlob: Blob): Promise<WhisperTranscriptionResult> {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token not configured');
    }

    const base64Audio = await this.blobToBase64(audioBlob);

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2',
        input: {
          audio: base64Audio,
          model: 'large-v3',
          language: 'en',
          transcription: 'verbose_json',
          temperature: 0.0
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.statusText}`);
    }

    const prediction = await response.json();
    const result = await this.pollReplicatePrediction(prediction.id);

    return {
      text: result.output?.text || '',
      language: result.output?.language || 'en',
      duration: result.output?.duration || 0,
      confidence: 0.85,
      segments: result.output?.segments?.map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
        confidence: Math.exp(seg.avg_logprob || -1)
      })) || []
    };
  }

  /**
   * Local Whisper installation
   */
  private static async transcribeWithLocal(audioBlob: Blob): Promise<WhisperTranscriptionResult> {
    if (!process.env.LOCAL_WHISPER_API_URL) {
      throw new Error('Local Whisper API URL not configured');
    }

    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'audio.mp3');
    formData.append('task', 'transcribe');
    formData.append('language', 'en');
    formData.append('output', 'json');

    const response = await fetch(`${process.env.LOCAL_WHISPER_API_URL}/asr`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Local Whisper API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      text: result.text || '',
      language: result.language || 'en',
      duration: result.duration || 0,
      confidence: result.confidence || 0.8,
      segments: result.segments || []
    };
  }

  // Helper methods
  private static calculateSegmentConfidence(segments: any[]): number {
    if (!segments || segments.length === 0) return 0.8;
    
    const avgLogProb = segments.reduce((sum, seg) => sum + (seg.avg_logprob || -1), 0) / segments.length;
    return Math.max(0.1, Math.min(1.0, Math.exp(avgLogProb)));
  }

  private static async blobToBase64(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:${blob.type};base64,${base64}`;
  }

  private static async pollReplicatePrediction(predictionId: string): Promise<any> {
    const maxAttempts = 60; // 5 minutes max
    const delay = 5000; // 5 second intervals

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        }
      });

      const result = await response.json();

      if (result.status === 'succeeded') {
        return result;
      } else if (result.status === 'failed') {
        throw new Error(`Replicate prediction failed: ${result.error}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    throw new Error('Replicate prediction timed out');
  }

  private static generateMockTranscription(): WhisperTranscriptionResult {
    return {
      text: "This is a mock transcription for development purposes. The customer called about their order and the agent helped resolve the issue.",
      language: 'en',
      duration: 120,
      confidence: 0.8,
      segments: [
        {
          start: 0,
          end: 30,
          text: "This is a mock transcription for development purposes.",
          confidence: 0.8
        },
        {
          start: 30,
          end: 60,
          text: "The customer called about their order.",
          confidence: 0.8
        },
        {
          start: 60,
          end: 120,
          text: "The agent helped resolve the issue.",
          confidence: 0.8
        }
      ]
    };
  }
}
