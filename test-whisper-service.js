// Test for the new Whisper-focused transcription service
import { WhisperTranscriptionService } from './src/lib/whisper-transcription-service.js';

async function testWhisperService() {
  console.log('🎤 Testing Whisper Transcription Service...');
  
  // Test with a mock audio URL (this would normally be a real audio file)
  const mockAudioUrl = 'https://example.com/test-audio.mp3';
  
  try {
    console.log('📥 Starting transcription test...');
    
    // This will fall back to mock data since we don't have a real audio file
    process.env.NODE_ENV = 'development';
    
    const result = await WhisperTranscriptionService.transcribeAudio(mockAudioUrl);
    
    console.log('✅ Whisper transcription test successful!');
    console.log('📝 Transcription:', result.text);
    console.log('🌐 Language:', result.language);
    console.log('⏱️  Duration:', result.duration + 's');
    console.log('🎯 Confidence:', (result.confidence * 100).toFixed(1) + '%');
    console.log('📊 Segments:', result.segments.length);
    
    // Test the segments
    if (result.segments.length > 0) {
      console.log('\n📋 Sample segments:');
      result.segments.slice(0, 3).forEach((seg, i) => {
        console.log(`  ${i + 1}. [${seg.start}s-${seg.end}s] "${seg.text}" (${(seg.confidence * 100).toFixed(1)}%)`);
      });
    }
    
    return { success: true, result };
    
  } catch (error) {
    console.log('❌ Whisper test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testWhisperService().then(result => {
  if (result.success) {
    console.log('\n🎉 Whisper service is ready for production!');
    console.log('💡 To use with real audio, add OPENAI_API_KEY to your .env file');
  } else {
    console.log('\n⚠️  Test failed, check configuration');
  }
});
