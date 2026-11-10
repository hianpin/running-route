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

import healthHandler from './api/health.ts';
import carparkHandler from './api/carparkavailability.ts';
import tokenHandler from './api/token.ts';
import searchHandler from './api/search.ts';
import revgeocodeHandler from './api/revgeocode.ts';
import routeHandler from './api/route.ts';

// Serverless API Endpoints in /api
app.all('/api/health', (req: Request, res: Response) => healthHandler(req, res));
app.all('/api/carparkavailability', (req: Request, res: Response) => carparkHandler(req, res));
app.all('/api/token', (req: Request, res: Response) => tokenHandler(req, res));
app.all('/api/search', (req: Request, res: Response) => searchHandler(req, res));
app.all('/api/revgeocode', (req: Request, res: Response) => revgeocodeHandler(req, res));
app.all('/api/route', (req: Request, res: Response) => routeHandler(req, res));

// Also mount alias routes for backward compatibility
app.all('/api/onemap/token', (req: Request, res: Response) => tokenHandler(req, res));
app.all('/api/onemap/search', (req: Request, res: Response) => searchHandler(req, res));
app.all('/api/onemap/route', (req: Request, res: Response) => routeHandler(req, res));
app.all('/api/onemap/revgeocode', (req: Request, res: Response) => revgeocodeHandler(req, res));

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
