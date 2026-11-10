import type { Request, Response } from 'express';
import { applyCorsHeaders, getAccountKey, getAuthToken } from './_helper';

export default async function handler(req: Request, res: Response) {
  if (applyCorsHeaders(req, res)) return;

  const start = (req.query.start as string) || '';
  const end = (req.query.end as string) || '';
  const routeType = (req.query.routeType as string) || 'walk';

  if (!start || !end) {
    res.status(400).json({
      error: 'Query parameters start and end are required (e.g. start=1.320981,103.844150&end=1.326762,103.8559)',
    });
    return;
  }

  const validRouteTypes = ['walk', 'cycle', 'drive', 'pt'];
  if (!validRouteTypes.includes(routeType)) {
    res.status(400).json({
      error: `Invalid routeType "${routeType}". Must be one of: walk, cycle, drive, pt`,
    });
    return;
  }

  const token = getAuthToken(req);
  const accountKey = getAccountKey(req);

  try {
    const url = `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${encodeURIComponent(
      start
    )}&end=${encodeURIComponent(end)}&routeType=${encodeURIComponent(routeType)}`;

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
    console.error('Error in OneMap route endpoint:', error);
    res.status(500).json({
      error: 'OneMap routing service failed',
      message: error?.message || 'Network error',
    });
  }
}
