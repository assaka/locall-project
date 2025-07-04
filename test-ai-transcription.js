// Test script for the AI transcription service
async function testAITranscription() {
  console.log('Testing AI Transcription Service...');
  
  // Test data - a simple call transcript
  const testTranscript = `
Customer: Hi, I'm calling about my recent order. I placed it last week but haven't received it yet.

Agent: I'm sorry to hear about the delay. Let me look that up for you. Can you provide your order number?

Customer: Yes, it's order number 12345.

Agent: Thank you. I see your order here. Unfortunately, there was a delay with our shipping partner, but I can see it was dispatched yesterday and should arrive by tomorrow. 

Customer: Oh that's great news! I was getting worried. Will I get tracking information?

Agent: Absolutely! I'll send the tracking details to your email right now. Is there anything else I can help you with today?

Customer: No, that's perfect. Thank you so much for your help!

Agent: You're welcome! Have a great day.
  `.trim();

  try {
    // Test the transcription API endpoint
    const response = await fetch('http://localhost:3002/api/transcripts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        callId: 'test-call-001',
        transcriptText: testTranscript,
        forceReprocess: true
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ AI Transcription test successful!');
      console.log('Sentiment Analysis:', result.sentimentAnalysis);
      console.log('Call Insights:', result.callInsights);
    } else {
      console.log('❌ Test failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

// Run the test
testAITranscription();
