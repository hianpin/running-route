import type { Request, Response } from 'express';
import { applyCorsHeaders, getAccountKey, getAuthToken } from './_helper';

export default async function handler(req: Request, res: Response) {
  if (applyCorsHeaders(req, res)) return;

  const searchVal = (req.query.searchVal as string) || '';
  const pageNum = (req.query.pageNum as string) || '1';
  const returnGeom = (req.query.returnGeom as string) || 'Y';
  const getAddrDetails = (req.query.getAddrDetails as string) || 'Y';

  if (!searchVal.trim()) {
    res.status(400).json({ error: 'Query parameter searchVal is required' });
    return;
  }

  const token = getAuthToken(req);
  const accountKey = getAccountKey(req);

  try {
    const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
      searchVal
    )}&returnGeom=${encodeURIComponent(returnGeom)}&getAddrDetails=${encodeURIComponent(
      getAddrDetails
    )}&pageNum=${encodeURIComponent(pageNum)}`;

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
    console.error('Error in OneMap search endpoint:', error);
    res.status(500).json({
      error: 'OneMap elastic search request failed',
      message: error?.message || 'Network error',
    });
  }
}
