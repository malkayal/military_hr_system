import { Router } from 'express';
import { getDatabase } from '../db.js';
const router = Router();
router.get('/', (req, res) => {
    try {
        const db = getDatabase();
        const limit = parseInt(req.query.limit) || 100;
        const stmt = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?');
        const logs = stmt.all(limit);
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
export { router as auditRoutes };
