import type { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore
import { app } from '../artifacts/api-server/dist/index.mjs';

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel provides req and res objects compatible with Express
  // We just pass them through to the Express app
  return app(req, res);
}
