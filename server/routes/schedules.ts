import { Router, Request, Response } from 'express';
import { getDatabase } from '../db.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM work_schedules ORDER BY name');
    const schedules = stmt.all();
    res.json(schedules);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const data = req.body;
    const db = getDatabase();
    const id = crypto.randomUUID();
    const stmt = db.prepare('INSERT INTO work_schedules (id, name, startTime, endTime, days, isActive) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, data.name, data.startTime, data.endTime, JSON.stringify(data.days), data.isActive !== false);
    res.status(201).json({ id, message: 'Schedule created' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const db = getDatabase();
    const stmt = db.prepare('UPDATE work_schedules SET name = ?, startTime = ?, endTime = ?, days = ?, isActive = ? WHERE id = ?');
    stmt.run(data.name, data.startTime, data.endTime, JSON.stringify(data.days), data.isActive, id);
    res.json({ message: 'Schedule updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM work_schedules WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Schedule deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as scheduleRoutes };
