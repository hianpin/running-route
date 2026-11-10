import type { Request, Response } from 'express';
import { applyCorsHeaders, getAccountKey, getAuthToken } from './_helper';

export default async function handler(req: Request, res: Response) {
  if (applyCorsHeaders(req, res)) return;

  // Accept location as "1.3,103.8" or separate "lat" and "lng"
  let location = (req.query.location as string) || '';
  if (!location && req.query.lat && req.query.lng) {
    location = `${req.query.lat},${req.query.lng}`;
  }

  if (!location) {
    res.status(400).json({
      error: 'Query parameter location is required in format "lat,lng" (e.g. location=1.3000,103.8500)',
    });
    return;
  }

  const buffer = (req.query.buffer as string) || '40';
  const addressType = (req.query.addressType as string) || 'All';
  const otherFeatures = (req.query.otherFeatures as string) || 'Y';

  const token = getAuthToken(req);
  const accountKey = getAccountKey(req);

  try {
    const url = `https://www.onemap.gov.sg/api/public/revgeocode?location=${encodeURIComponent(
      location
    )}&buffer=${encodeURIComponent(buffer)}&addressType=${encodeURIComponent(
      addressType
    )}&otherFeatures=${encodeURIComponent(otherFeatures)}`;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = token;
    }
    if (accountKey) {
      headers['AccountKey'] = accountKey;
    }

    const response = await fetch(url, { headers });
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Error in OneMap reverse geocode endpoint:', error);
    res.status(500).json({
      error: 'OneMap reverse geocoding failed',
      message: error?.message || 'Network error',
    });
  }
}
