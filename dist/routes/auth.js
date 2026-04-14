import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../db.js';
const router = Router();
// Login endpoint
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND isActive = 1');
        const user = stmt.get(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Update last login
        const updateStmt = db.prepare('UPDATE users SET lastLogin = ? WHERE id = ?');
        updateStmt.run(new Date().toISOString(), user.id);
        // Return user without password
        const { password: _, ...safeUser } = user;
        // Log audit
        const auditStmt = db.prepare(`
      INSERT INTO audit_logs (id, userId, action, entityType, details, ipAddress)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        auditStmt.run(crypto.randomUUID(), user.id, 'LOGIN', 'USER', 'User logged in successfully', req.ip);
        res.json({
            success: true,
            user: safeUser,
            message: 'Login successful'
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Logout endpoint
router.post('/logout', (req, res) => {
    try {
        const { userId } = req.body;
        if (userId) {
            const db = getDatabase();
            const auditStmt = db.prepare(`
        INSERT INTO audit_logs (id, userId, action, entityType, details, ipAddress)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
            auditStmt.run(crypto.randomUUID(), userId, 'LOGOUT', 'USER', 'User logged out', req.ip);
        }
        res.json({ success: true, message: 'Logout successful' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get current user
router.get('/me', (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM users WHERE id = ? AND isActive = 1');
        const user = stmt.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const { password: _, ...safeUser } = user;
        res.json({ user: safeUser });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Change password
router.post('/change-password', (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;
        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
        const user = stmt.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isValid = bcrypt.compareSync(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        const updateStmt = db.prepare('UPDATE users SET password = ?, updatedAt = ? WHERE id = ?');
        updateStmt.run(hashedPassword, new Date().toISOString(), userId);
        res.json({ success: true, message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export { router as authRoutes };
