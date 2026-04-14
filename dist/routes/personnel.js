import { Router } from 'express';
import { getDatabase } from '../db.js';
const router = Router();
// Get all personnel
router.get('/', (req, res) => {
    try {
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM personnel ORDER BY createdAt DESC');
        const personnel = stmt.all();
        res.json(personnel);
    }
    catch (error) {
        console.error('Get personnel error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get single personnel
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM personnel WHERE id = ?');
        const personnel = stmt.get(id);
        if (!personnel) {
            return res.status(404).json({ error: 'Personnel not found' });
        }
        res.json(personnel);
    }
    catch (error) {
        console.error('Get personnel error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create personnel
router.post('/', (req, res) => {
    try {
        const data = req.body;
        const db = getDatabase();
        const stmt = db.prepare(`
      INSERT INTO personnel (
        id, name, rank, militaryNumber, nationalId, address, bloodType,
        departmentId, sectionId, entity, employmentType, placementLocation,
        salaryEntity, phone, emergencyPhone, uniformSize, shoeSize, type,
        status, attendanceStatus, isManager, joinDate, lastPromotionDate,
        idType, hasMilitaryNumber, rankAuthority, financialStatus,
        connectionType, directSupervisor, lastEditedBy, lastEditedAt,
        promotionHistory, movementHistory, gear, documents, commendations,
        disciplinaryRecords, customData
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        stmt.run(id, data.name, data.rank || '', data.militaryNumber || '', data.nationalId || '', data.address || '', data.bloodType || '', data.departmentId || null, data.sectionId || null, data.entity || '', data.employmentType || '', data.placementLocation || '', data.salaryEntity || '', data.phone || '', data.emergencyPhone || '', data.uniformSize || '', data.shoeSize || '', data.type || 'military', data.status || 'active', data.attendanceStatus || 'present', data.isManager || false, data.joinDate || '', data.lastPromotionDate || '', data.idType || 'national', data.hasMilitaryNumber !== false, data.rankAuthority || '', data.financialStatus || 'salary', data.connectionType || 'دائم', data.directSupervisor || 'commander', data.lastEditedBy || '', now, JSON.stringify(data.promotionHistory || []), JSON.stringify(data.movementHistory || []), JSON.stringify(data.gear || []), JSON.stringify(data.documents || []), JSON.stringify(data.commendations || []), JSON.stringify(data.disciplinaryRecords || []), JSON.stringify(data.customData || {}));
        res.status(201).json({ id, message: 'Personnel created successfully' });
    }
    catch (error) {
        console.error('Create personnel error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update personnel
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const db = getDatabase();
        const stmt = db.prepare(`
      UPDATE personnel SET
        name = ?, rank = ?, militaryNumber = ?, nationalId = ?, address = ?,
        bloodType = ?, departmentId = ?, sectionId = ?, entity = ?,
        employmentType = ?, placementLocation = ?, salaryEntity = ?,
        phone = ?, emergencyPhone = ?, uniformSize = ?, shoeSize = ?,
        type = ?, status = ?, attendanceStatus = ?, isManager = ?,
        joinDate = ?, lastPromotionDate = ?, idType = ?, hasMilitaryNumber = ?,
        rankAuthority = ?, financialStatus = ?, connectionType = ?,
        directSupervisor = ?, lastEditedBy = ?, lastEditedAt = ?,
        promotionHistory = ?, movementHistory = ?, gear = ?, documents = ?,
        commendations = ?, disciplinaryRecords = ?, customData = ?
      WHERE id = ?
    `);
        const now = new Date().toISOString();
        stmt.run(data.name, data.rank || '', data.militaryNumber || '', data.nationalId || '', data.address || '', data.bloodType || '', data.departmentId || null, data.sectionId || null, data.entity || '', data.employmentType || '', data.placementLocation || '', data.salaryEntity || '', data.phone || '', data.emergencyPhone || '', data.uniformSize || '', data.shoeSize || '', data.type || 'military', data.status || 'active', data.attendanceStatus || 'present', data.isManager || false, data.joinDate || '', data.lastPromotionDate || '', data.idType || 'national', data.hasMilitaryNumber !== false, data.rankAuthority || '', data.financialStatus || 'salary', data.connectionType || 'دائم', data.directSupervisor || 'commander', data.lastEditedBy || '', now, JSON.stringify(data.promotionHistory || []), JSON.stringify(data.movementHistory || []), JSON.stringify(data.gear || []), JSON.stringify(data.documents || []), JSON.stringify(data.commendations || []), JSON.stringify(data.disciplinaryRecords || []), JSON.stringify(data.customData || {}), id);
        res.json({ message: 'Personnel updated successfully' });
    }
    catch (error) {
        console.error('Update personnel error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete personnel
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();
        const stmt = db.prepare('DELETE FROM personnel WHERE id = ?');
        stmt.run(id);
        res.json({ message: 'Personnel deleted successfully' });
    }
    catch (error) {
        console.error('Delete personnel error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export { router as personnelRoutes };
