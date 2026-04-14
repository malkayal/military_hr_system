import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/dcmi_enterprise.db');

let db: Database.Database | null = null;

export const initDatabase = (): Database.Database => {
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(DB_PATH);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      permissions TEXT DEFAULT '{}',
      isActive BOOLEAN DEFAULT 1,
      lastLogin TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Departments table
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Sections table
    CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      departmentId TEXT NOT NULL,
      FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE CASCADE
    );

    -- Personnel table
    CREATE TABLE IF NOT EXISTS personnel (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rank TEXT,
      militaryNumber TEXT,
      nationalId TEXT,
      address TEXT,
      bloodType TEXT,
      departmentId TEXT,
      sectionId TEXT,
      entity TEXT,
      employmentType TEXT,
      placementLocation TEXT,
      salaryEntity TEXT,
      phone TEXT,
      emergencyPhone TEXT,
      uniformSize TEXT,
      shoeSize TEXT,
      type TEXT DEFAULT 'military',
      status TEXT DEFAULT 'active',
      attendanceStatus TEXT DEFAULT 'present',
      isManager BOOLEAN DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      lastPromotionDate TEXT,
      joinDate TEXT,
      promotionHistory TEXT DEFAULT '[]',
      movementHistory TEXT DEFAULT '[]',
      gear TEXT DEFAULT '[]',
      documents TEXT DEFAULT '[]',
      commendations TEXT DEFAULT '[]',
      disciplinaryRecords TEXT DEFAULT '[]',
      customData TEXT DEFAULT '{}',
      idType TEXT DEFAULT 'national',
      hasMilitaryNumber BOOLEAN DEFAULT 1,
      rankAuthority TEXT,
      financialStatus TEXT DEFAULT 'salary',
      connectionType TEXT DEFAULT 'دائم',
      directSupervisor TEXT DEFAULT 'commander',
      lastEditedBy TEXT,
      lastEditedAt TEXT,
      FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL,
      FOREIGN KEY (sectionId) REFERENCES sections(id) ON DELETE SET NULL
    );

    -- Leaves table
    CREATE TABLE IF NOT EXISTS leaves (
      id TEXT PRIMARY KEY,
      personnelId TEXT NOT NULL,
      type TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      approvedBy TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (personnelId) REFERENCES personnel(id) ON DELETE CASCADE
    );

    -- Attendance table
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      personnelId TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      checkIn TEXT,
      checkOut TEXT,
      notes TEXT,
      recordedBy TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (personnelId) REFERENCES personnel(id) ON DELETE CASCADE,
      UNIQUE(personnelId, date)
    );

    -- Audit logs table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      userId TEXT,
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId TEXT,
      details TEXT,
      ipAddress TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Work schedules table
    CREATE TABLE IF NOT EXISTS work_schedules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      days TEXT DEFAULT '[]',
      isActive BOOLEAN DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_personnel_department ON personnel(departmentId);
    CREATE INDEX IF NOT EXISTS idx_personnel_section ON personnel(sectionId);
    CREATE INDEX IF NOT EXISTS idx_personnel_status ON personnel(status);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
    CREATE INDEX IF NOT EXISTS idx_attendance_personnel ON attendance(personnelId);
    CREATE INDEX IF NOT EXISTS idx_leaves_personnel ON leaves(personnelId);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
  `);

  console.log('📊 Database tables created successfully');
  
  // Insert default admin user if not exists
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?');
  const result: any = stmt.get('admin');
  
  if (result.count === 0) {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = bcrypt.default.hashSync('123', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, name, role, permissions)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertUser.run(
      'u1',
      'admin',
      hashedPassword,
      'مدير النظام التنفيذي',
      'supervisor',
      JSON.stringify({
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canViewReports: true,
        canManageUsers: true
      })
    );
    
    console.log('✅ Default admin user created (username: admin, password: 123)');
  }

  return db;
};

export const getDatabase = (): Database.Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
    console.log('🔒 Database closed');
  }
};
