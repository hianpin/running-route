import type { Request, Response } from 'express';
import { applyCorsHeaders, getAccountKey } from './_helper';

export default async function handler(req: Request, res: Response) {
  if (applyCorsHeaders(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    return;
  }

  const email = req.body?.email || process.env.ONEMAP_EMAIL;
  const password = req.body?.password || process.env.ONEMAP_PASSWORD;
  const accountKey = getAccountKey(req);

  if (!email || !password) {
    res.status(400).json({
      error:
        'Missing email or password. Provide JSON body {"email":"...","password":"..."} or configure ONEMAP_EMAIL and ONEMAP_PASSWORD in environment.',
    });
    return;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accountKey) {
      headers['AccountKey'] = accountKey;
    }

    const response = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      res.status(response.status || 400).json(data);
      return;
    }

    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error minting OneMap token:', error);
    res.status(500).json({
      error: 'Failed to mint OneMap token',
      message: error?.message || 'Network error',
    });
  }
}
