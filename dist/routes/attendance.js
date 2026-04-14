import { Router } from 'express';
import { getDatabase } from '../db.js';
const router = Router();
router.get('/', (req, res) => {
    try {
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM attendance ORDER BY date DESC');
        const attendance = stmt.all();
        res.json(attendance);
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
        const stmt = db.prepare('INSERT OR REPLACE INTO attendance (id, personnelId, date, status, checkIn, checkOut, notes, recordedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        stmt.run(id, data.personnelId, data.date, data.status, data.checkIn, data.checkOut, data.notes, data.recordedBy);
        res.status(201).json({ id, message: 'Attendance recorded' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();
        const stmt = db.prepare('DELETE FROM attendance WHERE id = ?');
        stmt.run(id);
        res.json({ message: 'Attendance deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
export { router as attendanceRoutes };
