import { Router } from 'express';
import { getDatabase } from '../db.js';
const router = Router();
router.get('/', (req, res) => {
    try {
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM departments ORDER BY name');
        const departments = stmt.all();
        res.json(departments);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', (req, res) => {
    try {
        const { name } = req.body;
        const db = getDatabase();
        const id = crypto.randomUUID();
        const stmt = db.prepare('INSERT INTO departments (id, name) VALUES (?, ?)');
        stmt.run(id, name);
        res.status(201).json({ id, message: 'Department created' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const db = getDatabase();
        const stmt = db.prepare('UPDATE departments SET name = ? WHERE id = ?');
        stmt.run(name, id);
        res.json({ message: 'Department updated' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();
        const stmt = db.prepare('DELETE FROM departments WHERE id = ?');
        stmt.run(id);
        res.json({ message: 'Department deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
export { router as departmentRoutes };
