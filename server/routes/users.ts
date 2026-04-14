import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../db.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT id, username, name, role, permissions, isActive, lastLogin, createdAt FROM users');
    const users = stmt.all();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { username, password, name, role, permissions } = req.body;
    const db = getDatabase();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = crypto.randomUUID();
    const stmt = db.prepare('INSERT INTO users (id, username, password, name, role, permissions) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, username, hashedPassword, name, role, JSON.stringify(permissions));
    res.status(201).json({ id, message: 'User created' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, permissions, isActive } = req.body;
    const db = getDatabase();
    const stmt = db.prepare('UPDATE users SET name = ?, role = ?, permissions = ?, isActive = ? WHERE id = ?');
    stmt.run(name, role, JSON.stringify(permissions), isActive, id);
    res.json({ message: 'User updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'User deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as userRoutes };
