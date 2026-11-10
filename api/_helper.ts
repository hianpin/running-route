import type { Request, Response } from 'express';

export interface ServerlessRequest extends Request {
  query: Record<string, any>;
  body: any;
  headers: Record<string, any>;
}

export interface ServerlessResponse extends Response {
  status: (code: number) => this;
  json: (data: any) => this;
  setHeader: (name: string, value: string) => this;
  send: (body: any) => this;
}

/**
 * Extract AccountKey from environment variables or incoming request headers
 */
export function getAccountKey(req: Request): string {
  return (
    process.env.ACCOUNT_KEY ||
    process.env.ONEMAP_ACCOUNT_KEY ||
    (req.headers['accountkey'] as string) ||
    (req.headers['account-key'] as string) ||
    (req.headers['x-account-key'] as string) ||
    ''
  );
}

/**
 * Extract Authorization Token from environment variables or incoming request headers
 */
export function getAuthToken(req: Request): string {
  const authHeader = req.headers['authorization'] as string;
  if (authHeader) {
    return authHeader.replace(/^Bearer\s+/i, '').trim();
  }
  return process.env.ONEMAP_API_TOKEN || '';
}

/**
 * Apply standard CORS and caching headers for serverless execution
 */
export function applyCorsHeaders(req: Request, res: Response): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, AccountKey, accountkey'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
