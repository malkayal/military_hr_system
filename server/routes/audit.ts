import { Router, Request, Response } from 'express';
import { getDatabase } from '../db.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const limit = parseInt(req.query.limit as string) || 100;
    const stmt = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?');
    const logs = stmt.all(limit);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as auditRoutes };
