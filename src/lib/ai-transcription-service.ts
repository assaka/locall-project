// lib/ai-transcription-service.ts
import { supabaseAdmin } from './supabase';
import { WhisperTranscriptionService, WhisperTranscriptionResult } from './whisper-transcription-service';

export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  confidence: number;
  segments?: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface SentimentAnalysis {
  overall_sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number; // -1 to 1
  confidence: number; // 0 to 1
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
    speaker_sentiment: { [speaker: string]: number };
    tone_changes: number;
    escalation_points: Array<{ timestamp: number; reason: string }>;
    resolution_indicators: string[];
  };
}

export interface CallInsights {
  call_quality_score: number; // 1-10
  customer_satisfaction_score: number; // 1-10
  agent_performance_score: number; // 1-10
  call_outcome: 'resolved' | 'unresolved' | 'follow_up_needed' | 'escalated';
  topics_discussed: string[];
  action_items: string[];
  next_steps: string[];
  compliance_flags: string[];
}

export class AITranscriptionService {
  
  /**
   * Transcribe audio using dedicated Whisper API service
   */
  static async transcribeAudio(audioUrl: string): Promise<TranscriptionResult> {
    try {
      console.log('Starting Whisper transcription for:', audioUrl);
      
      // Use dedicated Whisper service
      const whisperResult = await WhisperTranscriptionService.transcribeAudio(audioUrl);
      
      // Convert to our internal format
      return {
        text: whisperResult.text,
        language: whisperResult.language,
        duration: whisperResult.duration,
        confidence: whisperResult.confidence,
        segments: whisperResult.segments.map(seg => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
          confidence: seg.confidence
        }))
      };

    } catch (error) {
      console.error('Whisper transcription failed:', error);
      
      // Fallback to mock transcription for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock transcription for development');
        return this.generateMockTranscription();
      }
      
      throw error;
    }
  }

  /**
   * Try different Whisper API providers
   */
  private static async tryWhisperProviders(audioBlob: Blob): Promise<TranscriptionResult> {
    const providers = [
      // Prioritize dedicated Whisper APIs
      () => this.transcribeWithOpenAIWhisper(audioBlob),
      () => this.transcribeWithReplicateWhisper(audioBlob),
      () => this.transcribeWithHuggingFaceWhisper(audioBlob),
      () => this.transcribeWithLocalWhisper(audioBlob)
    ];

    for (const provider of providers) {
      try {
        return await provider();
      } catch (error) {
        console.warn('Whisper provider failed, trying next:', error.message);
        continue;
      }
    }

    throw new Error('All Whisper providers failed');
  }

  /**
   * Transcribe using OpenAI Whisper API (primary choice)
   */
  private static async transcribeWithOpenAIWhisper(audioBlob: Blob): Promise<TranscriptionResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Transcribing with OpenAI Whisper API...');

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.mp3');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
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
      throw new Error(`OpenAI Whisper API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();

    return {
      text: result.text,
      language: result.language || 'en',
      duration: result.duration || 0,
      confidence: this.calculateOverallConfidence(result.segments || []),
      segments: result.segments?.map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
        confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : 0.8
      })) || []
    };
  }

  /**
   * Transcribe using Hugging Face Whisper API (fallback)
   */
  private static async transcribeWithHuggingFaceWhisper(audioBlob: Blob): Promise<TranscriptionResult> {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('Hugging Face API key not configured');
    }

    // Convert blob to base64 for Hugging Face API
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    const response = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: base64Audio,
        parameters: {
          return_timestamps: true,
          language: 'en'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face Whisper API error: ${response.statusText}`);
    }

    const result = await response.json();

    // Parse Hugging Face response format
    if (result.error) {
      throw new Error(`Hugging Face API error: ${result.error}`);
    }

    return {
      text: result.text || '',
      language: 'en',
      duration: this.estimateDurationFromBlob(audioBlob),
      confidence: 0.9, // HF doesn't provide confidence scores
      segments: result.chunks?.map((chunk: any, index: number) => ({
        start: chunk.timestamp?.[0] || index * 10,
        end: chunk.timestamp?.[1] || (index + 1) * 10,
        text: chunk.text || '',
        confidence: 0.9
      })) || []
    };
  }

  /**
   * Transcribe using Replicate Whisper API
   */
  private static async transcribeWithReplicateWhisper(audioBlob: Blob): Promise<TranscriptionResult> {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token not configured');
    }

    // Convert blob to data URL
    const base64 = await this.blobToBase64(audioBlob);

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2',
        input: {
          audio: base64,
          model: 'large-v3',
          language: 'en',
          translate: false,
          temperature: 0.0,
          transcription: 'verbose_json',
          suppress_tokens: '-1',
          logprob_threshold: -1.0,
          no_speech_threshold: 0.6,
          condition_on_previous_text: true,
          compression_ratio_threshold: 2.4,
          temperature_increment_on_fallback: 0.2
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.statusText}`);
    }

    const prediction = await response.json();

    // Poll for completion
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
   * Transcribe using local Whisper installation
   */
  private static async transcribeWithLocalWhisper(audioBlob: Blob): Promise<TranscriptionResult> {
    if (!process.env.LOCAL_WHISPER_API_URL) {
      throw new Error('Local Whisper API URL not configured');
    }

    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.mp3');
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
      confidence: 0.9,
      segments: result.segments?.map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
        confidence: 0.9
      })) || []
    };
  }

  /**
   * Perform advanced sentiment analysis using multiple AI providers
   */
  static async analyzeSentiment(transcript: string, callDuration?: number): Promise<SentimentAnalysis> {
    try {
      // Try different AI providers for sentiment analysis
      return await this.trySentimentProviders(transcript, callDuration);
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      
      // Fallback to rule-based analysis
      return this.fallbackSentimentAnalysis(transcript);
    }
  }

  /**
   * Try different sentiment analysis providers
   */
  private static async trySentimentProviders(transcript: string, callDuration?: number): Promise<SentimentAnalysis> {
    const providers = [
      () => this.analyzeSentimentWithHuggingFace(transcript),
      () => this.analyzeSentimentWithOpenAI(transcript),
      () => this.analyzeSentimentWithCohere(transcript),
      () => this.analyzeSentimentWithAnthropic(transcript)
    ];

    for (const provider of providers) {
      try {
        return await provider();
      } catch (error) {
        console.warn('Sentiment provider failed, trying next:', error.message);
        continue;
      }
    }

    throw new Error('All sentiment analysis providers failed');
  }

  /**
   * Analyze sentiment using Hugging Face (primary choice)
   */
  private static async analyzeSentimentWithHuggingFace(transcript: string): Promise<SentimentAnalysis> {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('Hugging Face API key not configured');
    }

    // Use multiple HF models for comprehensive analysis
    const [sentimentResult, emotionResult] = await Promise.all([
      // Sentiment analysis
      fetch('https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: transcript })
      }),
      // Emotion analysis
      fetch('https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: transcript })
      })
    ]);

    const [sentimentData, emotionData] = await Promise.all([
      sentimentResult.json(),
      emotionResult.json()
    ]);

    // Process sentiment results
    const sentimentScore = this.processSentimentScore(sentimentData);
    const emotions = this.processEmotionScores(emotionData);
    
    return {
      overall_sentiment: sentimentScore > 0.1 ? 'positive' : sentimentScore < -0.1 ? 'negative' : 'neutral',
      sentiment_score: sentimentScore,
      confidence: Math.max(sentimentData[0]?.score || 0.7, emotionData[0]?.score || 0.7),
      emotions,
      key_phrases: this.extractKeyPhrases(transcript),
      conversation_metrics: this.analyzeConversationMetrics(transcript, sentimentScore)
    };
  }

  /**
   * Analyze sentiment using OpenAI (fallback)
   */
  private static async analyzeSentimentWithOpenAI(transcript: string): Promise<SentimentAnalysis> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Analyze the sentiment and emotions in this customer service call transcript. Provide a comprehensive analysis.

Transcript: "${transcript}"

Respond in JSON format:
{
  "overall_sentiment": "positive|negative|neutral",
  "sentiment_score": -1 to 1,
  "confidence": 0 to 1,
  "emotions": {"joy": 0-1, "sadness": 0-1, "anger": 0-1, "fear": 0-1, "surprise": 0-1, "disgust": 0-1},
  "key_phrases": ["phrase1", "phrase2"],
  "conversation_metrics": {
    "speaker_sentiment": {"customer": -1 to 1, "agent": -1 to 1},
    "tone_changes": number,
    "escalation_points": [{"timestamp": seconds, "reason": "explanation"}],
    "resolution_indicators": ["indicator1", "indicator2"]
  }
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use more cost-effective model
        messages: [
          { role: 'system', content: 'You are an expert at analyzing customer service call sentiments. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
  }

  /**
   * Analyze sentiment using Cohere
   */
  private static async analyzeSentimentWithCohere(transcript: string): Promise<SentimentAnalysis> {
    if (!process.env.COHERE_API_KEY) {
      throw new Error('Cohere API key not configured');
    }

    const response = await fetch('https://api.cohere.ai/v1/classify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [transcript],
        examples: [
          { text: "I love this service, it's amazing!", label: "positive" },
          { text: "This is terrible, I hate it", label: "negative" },
          { text: "It's okay, nothing special", label: "neutral" }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.statusText}`);
    }

    const result = await response.json();
    const classification = result.classifications[0];
    
    const sentimentScore = classification.prediction === 'positive' ? 0.7 : 
                          classification.prediction === 'negative' ? -0.7 : 0;

    return {
      overall_sentiment: classification.prediction,
      sentiment_score: sentimentScore,
      confidence: classification.confidence,
      emotions: this.estimateEmotionsFromSentiment(sentimentScore),
      key_phrases: this.extractKeyPhrases(transcript),
      conversation_metrics: this.analyzeConversationMetrics(transcript, sentimentScore)
    };
  }

  /**
   * Analyze sentiment using Anthropic Claude
   */
  private static async analyzeSentimentWithAnthropic(transcript: string): Promise<SentimentAnalysis> {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analyze the sentiment of this call transcript and return JSON only: "${transcript}"`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const result = await response.json();
    return JSON.parse(result.content[0].text);
  }

  /**
   * Generate call insights using AI
   */
  static async generateCallInsights(transcript: string, sentiment: SentimentAnalysis): Promise<CallInsights> {
    try {
      const prompt = `
Analyze this customer service call transcript and provide actionable insights:

Transcript: "${transcript}"

Sentiment Analysis: ${JSON.stringify(sentiment)}

Provide insights in JSON format:
{
  "call_quality_score": 1-10,
  "customer_satisfaction_score": 1-10,
  "agent_performance_score": 1-10,
  "call_outcome": "resolved|unresolved|follow_up_needed|escalated",
  "topics_discussed": ["topic1", "topic2"],
  "action_items": ["action1", "action2"],
  "next_steps": ["step1", "step2"],
  "compliance_flags": ["flag1", "flag2"]
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at analyzing customer service calls and providing actionable business insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      return JSON.parse(result.choices[0].message.content);

    } catch (error) {
      console.error('Call insights generation failed:', error);
      return this.generateFallbackInsights(sentiment);
    }
  }

  /**
   * Process complete call analysis
   */
  static async processCallAnalysis(callId: string, recordingUrl: string): Promise<void> {
    try {
      console.log(`Starting AI analysis for call ${callId}`);

      // Update status to processing
      await supabaseAdmin
        .from('call_transcripts')
        .upsert({
          call_id: callId,
          processing_status: 'processing',
          created_at: new Date().toISOString()
        });

      // Step 1: Transcribe audio
      const transcription = await this.transcribeAudio(recordingUrl);
      
      // Step 2: Analyze sentiment
      const sentiment = await this.analyzeSentiment(transcription.text, transcription.duration);
      
      // Step 3: Generate insights
      const insights = await this.generateCallInsights(transcription.text, sentiment);

      // Step 4: Store results
      await supabaseAdmin
        .from('call_transcripts')
        .update({
          transcript_text: transcription.text,
          language: transcription.language,
          duration: transcription.duration,
          confidence: transcription.confidence,
          segments: transcription.segments,
          sentiment_score: sentiment.sentiment_score,
          sentiment_confidence: sentiment.confidence,
          sentiment_details: {
            overall_sentiment: sentiment.overall_sentiment,
            emotions: sentiment.emotions,
            key_phrases: sentiment.key_phrases,
            conversation_metrics: sentiment.conversation_metrics
          },
          call_insights: insights,
          processing_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('call_id', callId);

      console.log(`AI analysis completed for call ${callId}`);

    } catch (error) {
      console.error(`AI analysis failed for call ${callId}:`, error);
      
      // Mark as failed
      await supabaseAdmin
        .from('call_transcripts')
        .update({
          processing_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('call_id', callId);
    }
  }

  // Helper methods
  private static calculateOverallConfidence(segments: any[]): number {
    if (!segments.length) return 0.8;
    const avgConfidence = segments.reduce((sum, seg) => 
      sum + (seg.avg_logprob ? Math.exp(seg.avg_logprob) : 0.8), 0) / segments.length;
    return Math.max(0, Math.min(1, avgConfidence));
  }

  private static estimateDurationFromBlob(audioBlob: Blob): number {
    // Rough estimation: 1MB ≈ 60 seconds for compressed audio
    const sizeInMB = audioBlob.size / (1024 * 1024);
    return Math.round(sizeInMB * 60);
  }

  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private static async pollReplicatePrediction(predictionId: string): Promise<any> {
    const maxAttempts = 30; // 5 minutes max
    const interval = 10000; // 10 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to poll prediction: ${response.statusText}`);
      }

      const prediction = await response.json();

      if (prediction.status === 'succeeded') {
        return prediction;
      } else if (prediction.status === 'failed') {
        throw new Error(`Prediction failed: ${prediction.error}`);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Prediction timed out');
  }

  private static processSentimentScore(sentimentData: any[]): number {
    if (!sentimentData || !Array.isArray(sentimentData) || sentimentData.length === 0) {
      return 0;
    }

    const sentiment = sentimentData[0];
    if (sentiment.label === 'LABEL_2' || sentiment.label === 'positive') return sentiment.score;
    if (sentiment.label === 'LABEL_0' || sentiment.label === 'negative') return -sentiment.score;
    return 0; // neutral
  }

  private static processEmotionScores(emotionData: any[]): SentimentAnalysis['emotions'] {
    const emotions = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0
    };

    if (!emotionData || !Array.isArray(emotionData)) {
      return emotions;
    }

    emotionData.forEach(emotion => {
      const label = emotion.label.toLowerCase();
      if (label in emotions) {
        emotions[label as keyof typeof emotions] = emotion.score;
      }
    });

    return emotions;
  }

  private static extractKeyPhrases(transcript: string): string[] {
    // Simple keyword extraction - in production, use NLP libraries
    const words = transcript.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Common important words in customer service
    const importantWords = words.filter(word => 
      ['problem', 'issue', 'help', 'support', 'service', 'order', 'payment', 
       'account', 'billing', 'refund', 'delivery', 'product', 'quality',
       'satisfied', 'disappointed', 'excellent', 'terrible', 'amazing'].includes(word)
    );

    return [...new Set(importantWords)].slice(0, 10);
  }

  private static analyzeConversationMetrics(transcript: string, sentimentScore: number): SentimentAnalysis['conversation_metrics'] {
    const lines = transcript.split('\n').filter(line => line.trim());
    const customerLines = lines.filter(line => line.toLowerCase().includes('customer:'));
    const agentLines = lines.filter(line => line.toLowerCase().includes('agent:'));

    return {
      speaker_sentiment: {
        customer: sentimentScore * 0.8, // Customer usually drives sentiment
        agent: Math.min(0.5, Math.abs(sentimentScore) * 0.6) // Agent should remain professional
      },
      tone_changes: Math.floor(lines.length / 4), // Estimate based on conversation length
      escalation_points: sentimentScore < -0.5 ? [{ timestamp: 60, reason: 'Negative sentiment detected' }] : [],
      resolution_indicators: sentimentScore > 0.3 ? ['positive outcome', 'customer satisfied'] : []
    };
  }

  private static estimateEmotionsFromSentiment(sentimentScore: number): SentimentAnalysis['emotions'] {
    if (sentimentScore > 0.3) {
      return { joy: 0.7, sadness: 0.1, anger: 0.1, fear: 0.1, surprise: 0.2, disgust: 0.1 };
    } else if (sentimentScore < -0.3) {
      return { joy: 0.1, sadness: 0.4, anger: 0.6, fear: 0.2, surprise: 0.1, disgust: 0.3 };
    } else {
      return { joy: 0.3, sadness: 0.2, anger: 0.2, fear: 0.2, surprise: 0.2, disgust: 0.1 };
    }
  }

  private static generateMockTranscription(): TranscriptionResult {
    return {
      text: "Hello, thank you for calling our support line. How can I assist you today? I'm having trouble with my account login. I see, let me help you with that. Can you provide me with your email address? Yes, it's john.doe@email.com. Thank you. I can see your account here. It looks like your password needs to be reset. I'll send you a reset link right now. Great, I received the email. Thank you so much for your help! You're welcome! Is there anything else I can help you with today? No, that's everything. Thank you again. Have a great day!",
      language: 'en',
      duration: 180,
      confidence: 0.95,
      segments: [
        { start: 0, end: 5, text: "Hello, thank you for calling our support line.", confidence: 0.98 },
        { start: 5, end: 8, text: "How can I assist you today?", confidence: 0.95 },
        { start: 8, end: 15, text: "I'm having trouble with my account login.", confidence: 0.92 }
      ]
    };
  }

  private static fallbackSentimentAnalysis(transcript: string): SentimentAnalysis {
    // Enhanced rule-based sentiment analysis
    const positiveWords = [
      'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'love', 
      'best', 'awesome', 'brilliant', 'outstanding', 'superb', 'helpful', 'friendly',
      'satisfied', 'happy', 'pleased', 'thank', 'thanks', 'appreciate', 'good', 'nice'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disgusting', 'poor',
      'disappointing', 'useless', 'frustrated', 'angry', 'upset', 'confused', 'problem',
      'issue', 'error', 'broken', 'failed', 'wrong', 'difficult', 'impossible'
    ];

    const words = transcript.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });

    const totalSentimentWords = positiveCount + negativeCount;
    let sentimentScore = 0;
    
    if (totalSentimentWords > 0) {
      sentimentScore = (positiveCount - negativeCount) / Math.max(totalSentimentWords, 5);
    }

    sentimentScore = Math.max(-1, Math.min(1, sentimentScore));
    
    const overallSentiment = sentimentScore > 0.1 ? 'positive' : 
                           sentimentScore < -0.1 ? 'negative' : 'neutral';

    return {
      overall_sentiment: overallSentiment,
      sentiment_score: sentimentScore,
      confidence: Math.min(totalSentimentWords / 10, 0.8),
      emotions: {
        joy: positiveCount > 0 ? Math.min(positiveCount / 10, 1) : 0,
        sadness: negativeCount > 0 ? Math.min(negativeCount / 15, 1) : 0,
        anger: words.some(w => ['angry', 'frustrated', 'mad'].includes(w)) ? 0.3 : 0,
        fear: words.some(w => ['worried', 'concerned', 'afraid'].includes(w)) ? 0.2 : 0,
        surprise: words.some(w => ['wow', 'amazing', 'surprised'].includes(w)) ? 0.2 : 0,
        disgust: words.some(w => ['disgusting', 'awful', 'terrible'].includes(w)) ? 0.1 : 0
      },
      key_phrases: [
        ...words.filter(w => positiveWords.includes(w)),
        ...words.filter(w => negativeWords.includes(w))
      ].slice(0, 10),
      conversation_metrics: {
        speaker_sentiment: {
          customer: sentimentScore * 0.8,
          agent: Math.abs(sentimentScore) * 0.6
        },
        tone_changes: Math.floor(Math.random() * 3),
        escalation_points: [],
        resolution_indicators: positiveCount > negativeCount ? ['issue resolved', 'customer satisfied'] : []
      }
    };
  }

  private static generateFallbackInsights(sentiment: SentimentAnalysis): CallInsights {
    const isPositive = sentiment.sentiment_score > 0;
    
    return {
      call_quality_score: isPositive ? 8 : 6,
      customer_satisfaction_score: Math.round((sentiment.sentiment_score + 1) * 5),
      agent_performance_score: isPositive ? 8 : 7,
      call_outcome: isPositive ? 'resolved' : 'follow_up_needed',
      topics_discussed: ['account support', 'technical assistance'],
      action_items: isPositive ? [] : ['follow up with customer', 'review process'],
      next_steps: isPositive ? ['case closed'] : ['schedule follow-up call'],
      compliance_flags: []
    };
  }
}
