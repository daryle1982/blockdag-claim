import axios from 'axios';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Address is required' });

    // Get wallet data (same functions as before)
    const walletData = await getWalletData(address);
    const message = formatWalletMessage(address, walletData);
    
    // Send to Telegram via HTTP API (no bot polling)
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TELEGRAM_CHANNEL_ID,
      text: message,
      parse_mode: 'HTML'
    });
    
    res.json({ success: true, message: 'Sent to Telegram' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Your existing functions (getWalletData, formatWalletMessage, etc.)