import { Router } from 'express';
import { getDatabase } from '../db.js';
const router = Router();
router.get('/', (req, res) => {
    try {
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM leaves ORDER BY createdAt DESC');
        const leaves = stmt.all();
        res.json(leaves);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', (req, res) => {
    try {
        const data = req.body;
        const db = getDatabase();
        const id = crypto.randomUUID();
        const stmt = db.prepare('INSERT INTO leaves (id, personnelId, type, startDate, endDate, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
        stmt.run(id, data.personnelId, data.type, data.startDate, data.endDate, data.reason, data.status || 'pending');
        res.status(201).json({ id, message: 'Leave created' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const db = getDatabase();
        const stmt = db.prepare('UPDATE leaves SET type = ?, startDate = ?, endDate = ?, reason = ?, status = ?, approvedBy = ? WHERE id = ?');
        stmt.run(data.type, data.startDate, data.endDate, data.reason, data.status, data.approvedBy, id);
        res.json({ message: 'Leave updated' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();
        const stmt = db.prepare('DELETE FROM leaves WHERE id = ?');
        stmt.run(id);
        res.json({ message: 'Leave deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
export { router as leaveRoutes };
