import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

const ONEMAP_BASE = 'https://www.onemap.gov.sg';

// Health & Config endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const hasServerToken = Boolean(process.env.ONEMAP_API_TOKEN);
  const hasServerCreds = Boolean(process.env.ONEMAP_EMAIL && process.env.ONEMAP_PASSWORD);

  res.json({
    status: 'ok',
    hasServerToken,
    hasServerCreds,
    configuredEmail: process.env.ONEMAP_EMAIL ? `${process.env.ONEMAP_EMAIL.slice(0, 3)}***` : null,
  });
});

// Proxy for OneMap Token Generation
app.post('/api/onemap/token', async (req: Request, res: Response) => {
  try {
    const email = req.body?.email || process.env.ONEMAP_EMAIL;
    const password = req.body?.password || process.env.ONEMAP_PASSWORD;

    if (!email || !password) {
      res.status(400).json({
        error: 'Missing email or password. Provide in request body or configure ONEMAP_EMAIL and ONEMAP_PASSWORD environment variables.',
      });
      return;
    }

    const response = await fetch(`${ONEMAP_BASE}/api/auth/post/getToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      res.status(response.status || 400).json(data);
      return;
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error proxying token generation:', error);
    res.status(500).json({ error: error?.message || 'Failed to authenticate with OneMap' });
  }
});

// Proxy for Elastic Search Autocomplete
app.get('/api/onemap/search', async (req: Request, res: Response) => {
  try {
    const searchVal = req.query.searchVal as string;
    const pageNum = (req.query.pageNum as string) || '1';

    if (!searchVal) {
      res.status(400).json({ error: 'searchVal query parameter is required' });
      return;
    }

    const clientToken = req.headers.authorization;
    const effectiveToken = clientToken || process.env.ONEMAP_API_TOKEN;

    const url = `${ONEMAP_BASE}/api/common/elastic/search?searchVal=${encodeURIComponent(
      searchVal
    )}&returnGeom=Y&getAddrDetails=Y&pageNum=${encodeURIComponent(pageNum)}`;

    const headers: Record<string, string> = {};
    if (effectiveToken) {
      headers['Authorization'] = effectiveToken;
    }

    const response = await fetch(url, { headers });
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Error proxying search:', error);
    res.status(500).json({ error: error?.message || 'Search request failed' });
  }
});

// Proxy for Route Generation
app.get('/api/onemap/route', async (req: Request, res: Response) => {
  try {
    const start = req.query.start as string;
    const end = req.query.end as string;
    const routeType = (req.query.routeType as string) || 'walk';

    if (!start || !end) {
      res.status(400).json({ error: 'start and end query parameters are required' });
      return;
    }

    const clientToken = req.headers.authorization;
    const effectiveToken = clientToken || process.env.ONEMAP_API_TOKEN;

    const url = `${ONEMAP_BASE}/api/public/routingsvc/route?start=${encodeURIComponent(
      start
    )}&end=${encodeURIComponent(end)}&routeType=${encodeURIComponent(routeType)}`;

    const headers: Record<string, string> = {};
    if (effectiveToken) {
      headers['Authorization'] = effectiveToken;
    }

    const response = await fetch(url, { headers });
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Error proxying route:', error);
    res.status(500).json({ error: error?.message || 'Route generation failed' });
  }
});

// Vite Middleware integration for Fullstack Dev & Static in Prod
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SG RunRoute server is listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
