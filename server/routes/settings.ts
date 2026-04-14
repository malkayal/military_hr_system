import { Router, Request, Response } from 'express';
import { getDatabase } from '../db.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM settings');
    const settings = stmt.all();
    const config: any = {};
    settings.forEach((s: any) => {
      config[s.key] = JSON.parse(s.value);
    });
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:key', (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const value = req.body;
    const db = getDatabase();
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)');
    stmt.run(key, JSON.stringify(value), new Date().toISOString());
    res.json({ message: 'Settings updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as settingsRoutes };
