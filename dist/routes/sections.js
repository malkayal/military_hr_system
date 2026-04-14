import { Router } from 'express';
import { getDatabase } from '../db.js';
const router = Router();
router.get('/', (req, res) => {
    try {
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM sections ORDER BY name');
        const sections = stmt.all();
        res.json(sections);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', (req, res) => {
    try {
        const { name, departmentId } = req.body;
        const db = getDatabase();
        const id = crypto.randomUUID();
        const stmt = db.prepare('INSERT INTO sections (id, name, departmentId) VALUES (?, ?, ?)');
        stmt.run(id, name, departmentId);
        res.status(201).json({ id, message: 'Section created' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, departmentId } = req.body;
        const db = getDatabase();
        const stmt = db.prepare('UPDATE sections SET name = ?, departmentId = ? WHERE id = ?');
        stmt.run(name, departmentId, id);
        res.json({ message: 'Section updated' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();
        const stmt = db.prepare('DELETE FROM sections WHERE id = ?');
        stmt.run(id);
        res.json({ message: 'Section deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
export { router as sectionRoutes };
