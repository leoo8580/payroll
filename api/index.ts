import { createExpressApp } from '../src/server/app';

const { app } = createExpressApp();

// Fallback 404 JSON handler for unmapped API routes
app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl || req.url}`,
    status: 404,
  });
});

export default function handler(req: any, res: any) {
  return app(req, res);
}
