import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { getVonagePrivateKey } from '@/app/utils/getVonagePrivateKey';

const VONAGE_APPLICATION_ID = process.env.VONAGE_APPLICATION_ID!;

function generateVonageJwt() {
  const privateKey = getVonagePrivateKey();
  const payload = {
    application_id: VONAGE_APPLICATION_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    jti: Math.random().toString(36).substring(2),
  };
  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const callId = body.uuid;
    const callStatus = body.status;
    const duration = body.duration;
    const recordingUrl = body.recording_url;
    let recordingLocalPath = null;

    if (!callId) {
      return NextResponse.json({ error: 'Missing call UUID' }, { status: 400 });
    }

    if (recordingUrl) {
      try {
        const token = generateVonageJwt();
        const response = await axios.get(recordingUrl, {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'arraybuffer',
        });
        const recordingsDir = path.resolve(process.cwd(), 'recordings');
        if (!fs.existsSync(recordingsDir)) {
          fs.mkdirSync(recordingsDir);
        }
        const fileName = `recording_${callId}_${Date.now()}.mp3`;
        const filePath = path.join(recordingsDir, fileName);
        fs.writeFileSync(filePath, response.data);
        recordingLocalPath = filePath;
      } catch (err) {
        console.error('Error downloading recording:', err);
      }
    }

    const { error } = await supabase
      .from('calls')
      .update({
        status: callStatus,
        duration: duration ? parseInt(duration) : null,
        recording_url: recordingUrl || null,
        recording_local_path: recordingLocalPath,
      })
      .eq('vonage_call_id', callId);

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new Response('OK', { status: 200 });
  } catch (err: unknown) {
    let message = 'Vonage webhook error';
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === 'object' && err && 'message' in err) {
      message = String((err as { message: unknown }).message);
    }
    console.error('Vonage webhook error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
