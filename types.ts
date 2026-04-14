
/**
 * ملف التعريفات الأساسية (Types & Interfaces) - النسخة المطورة 5.0
 */

export enum UserRole {
  SUPERVISOR = 'supervisor',
  USER = 'user'
}

export enum PersonnelType {
  MILITARY = 'عسكري',
  CIVILIAN = 'موظف مدني'
}

export type AttendanceStatus = 'present' | 'absent' | 'disrupted' | 'assigned' | 'permission' | 'mission';

export interface UserPermissions {
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
  permissions: UserPermissions;
}

export interface Department {
  id: string;
  name: string;
  managerId?: string;
}

export interface Section {
  id: string;
  name: string;
  departmentId: string;
}

export interface Promotion {
  rank: string;
  date: string;
  orderNumber: string;
}

export interface MovementRecord {
  id: string;
  location: string;
  date: string;
  type: string;
}

export interface PersonnelAuditRecord {
  id: string;
  userId: string;
  username: string;
  action: string;
  changes: string;
  timestamp: string;
}

export interface Personnel {
  id: string;
  name: string;
  rank: string;
  militaryNumber: string;
  nationalId: string;
  address: string;
  bloodType: string;
  departmentId: string;
  sectionId?: string; // القسم التابع له داخل الإدارة
  entity: string;
  employmentType: string;
  placementLocation: string;
  salaryEntity: string;
  phone: string;
  emergencyPhone: string;
  uniformSize: string;
  shoeSize: string;
  type: PersonnelType;
  idType: 'national' | 'administrative';
  hasMilitaryNumber: boolean;
  rankAuthority: string;
  financialStatus: 'salary' | 'no_salary';
  connectionType: string;
  directSupervisor: 'commander' | 'head_dept' | 'head_section';
  photo?: string;
  promotionHistory: Promotion[];
  movementHistory: MovementRecord[];
  auditHistory?: PersonnelAuditRecord[];
  gear: GearItem[];
  documents: PersonnelDocument[];
  commendations: Commendation[];
  disciplinaryRecords: DisciplinaryRecord[];
  customData: Record<string, string>;
  lastPromotionDate: string;
  status: 'active' | 'retired' | 'mission' | 'resigned' | 'transferred_out' | 'dropped'; 
  attendanceStatus: AttendanceStatus;
  isManager: boolean; 
  createdAt: string;
  birthDate?: string;
  qualification?: string;
  specialization?: string;
  joinDate?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  personnelId: string;
  date: string;
  status: AttendanceStatus;
  recordedBy: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  date: string;
  author: string;
}

export interface ApiIntegrationConfig {
  enabled: boolean;
  externalEndpoint: string;
  apiKey: string;
  secretToken: string;
  authType: 'Bearer' | 'ApiKey' | 'Basic';
  webhooks: {
    id: string;
    event: 'on_personnel_add' | 'on_leave_request' | 'on_attendance_sync';
    url: string;
    enabled: boolean;
  }[];
}

export interface SystemSettings {
  orgName: string;
  orgHierarchy: string[];
  logo: string;
  theme: 'light' | 'dark';
  accentColor: string;
  customFields: CustomFieldDefinition[];
  announcements: Announcement[];
  version: string;
  ranks: string[];
  reportFooter: string;
  reportFont: string;
  autoLogoutTime: number;
  entities: string[];
  salaryEntities: string[];
  signatureTitles: string[];
  enableMaintenance: boolean;
  maintenanceMessage: string;
  pdfQuality: 'standard' | 'high';
  qrDetailLevel: 'basic' | 'full';
  enableAutoLogout: boolean;
  enableNotificationSounds: boolean;
  showWatermark: boolean;
  watermarkText: string;
  visibleWidgets: string[];
  enableErrorTracking: boolean;
  apiConfig: ApiIntegrationConfig;
  hiddenTabs: string[];
  hiddenWidgets: string[];
  numberFormat: 'arabic' | 'latin';
  logRetentionDays: number;
  copyrightText: string;
  defaultReportFontSize: number;
  devMode: boolean;
  absenceThreshold: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AppError {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  browser: string;
  url: string;
}

export interface AppNotification {
  id: string;
  type: 'info' | 'warning' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Leave {
  id: string;
  personnelId: string;
  type: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reason?: string;
  rejectionReason?: string;
}

export type ScheduleType = 'daily' | 'fixed_days' | 'rotation' | 'overnight';

export interface WorkSchedule {
  id: string;
  name: string;
  type: ScheduleType;
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday) for 'fixed_days'
  workDaysCount?: number; // for 'rotation' and 'overnight'
  restDaysCount?: number; // for 'rotation' and 'overnight'
  startDate?: string;     // Reference start date for 'rotation' and 'overnight'
  departmentId?: string;
  sectionId?: string;
  startTime?: string; // e.g., "08:00"
  endTime?: string;   // e.g., "14:00"
  description?: string;
  color?: string;     // Hex color for UI
  createdAt: string;
}

export interface GearItem {
  id: string;
  name: string;
  serialNumber?: string;
  receivedDate: string;
  status: 'new' | 'used' | 'damaged';
}

export interface PersonnelDocument {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  expiryDate?: string;
  uploadedAt: string;
}

export interface Commendation {
  id: string;
  title: string;
  authority: string;
  date: string;
  description?: string;
}

export interface DisciplinaryRecord {
  id: string;
  type: string;
  authority: string;
  date: string;
  penalty: string;
  reason: string;
}

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  required: boolean;
}
