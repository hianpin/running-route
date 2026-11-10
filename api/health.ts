import type { Request, Response } from 'express';
import { applyCorsHeaders, getAccountKey, getAuthToken } from './_helper';

export default async function handler(req: Request, res: Response) {
  if (applyCorsHeaders(req, res)) return;

  const accountKey = getAccountKey(req);
  const token = getAuthToken(req);

  res.status(200).json({
    status: 'healthy',
    service: 'SG RunRoute OneMap Serverless API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    configuration: {
      accountKeyConfigured: Boolean(accountKey),
      accountKeySource: process.env.ACCOUNT_KEY
        ? 'env:ACCOUNT_KEY'
        : process.env.ONEMAP_ACCOUNT_KEY
        ? 'env:ONEMAP_ACCOUNT_KEY'
        : req.headers['accountkey']
        ? 'header:AccountKey'
        : 'none',
      tokenConfigured: Boolean(token),
      credentialsConfigured: Boolean(process.env.ONEMAP_EMAIL && process.env.ONEMAP_PASSWORD),
    },
    endpoints: [
      { method: 'POST', path: '/api/token', desc: 'Mint OneMap 3-day JWT access token' },
      { method: 'GET', path: '/api/search', desc: 'Geocode / Elastic search address or landmark' },
      { method: 'GET', path: '/api/revgeocode', desc: 'Reverse geocode coordinates to address' },
      { method: 'GET', path: '/api/route', desc: 'Routing path for walk, cycle, drive, pt' },
      { method: 'GET', path: '/api/carparkavailability', desc: 'Live carpark lots availability in Singapore' },
    ],
  });
}
