import type { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const client = twilio(accountSid, authToken);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { search, buy } = req.body;
  try {
    if (search) {
      const numbers = await client.availablePhoneNumbers('US').local.list({ areaCode: search, limit: 5 });
      return res.status(200).json({ numbers });
    }
    if (buy) {
      const purchased = await client.incomingPhoneNumbers.create({ phoneNumber: buy });
      return res.status(200).json({ purchased });
    }
    return res.status(400).json({ error: 'Missing search or buy parameter' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
} 