import { Router } from 'express';
import { getDatabase } from '../db.js';
const router = Router();
router.get('/summary', (req, res) => {
    try {
        const db = getDatabase();
        const stats = {};
        stats.totalPersonnel = db.prepare('SELECT COUNT(*) as count FROM personnel').get();
        const activeResult = db.prepare('SELECT COUNT(*) as count FROM personnel WHERE status = ?').get(['active']);
        stats.activePersonnel = { count: activeResult.count };
        stats.totalDepartments = db.prepare('SELECT COUNT(*) as count FROM departments').get();
        stats.totalSections = db.prepare('SELECT COUNT(*) as count FROM sections').get();
        stats.totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
        const pendingResult = db.prepare('SELECT COUNT(*) as count FROM leaves WHERE status = ?').get(['pending']);
        stats.pendingLeaves = { count: pendingResult.count };
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
export { router as reportRoutes };
