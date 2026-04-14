
import { Personnel, Department, Section, User, AuditLog, Leave, UserRole, SystemSettings, AttendanceRecord, PersonnelType, AppError, WorkSchedule } from '../types';
import { RANKS as DEFAULT_RANKS, BLOOD_TYPES } from '../constants';

const KEYS = {
  PERSONNEL: 'mil_hr_personnel',
  DEPARTMENTS: 'mil_hr_depts',
  SECTIONS: 'mil_hr_sections',
  USERS: 'mil_hr_users',
  LOGS: 'mil_hr_logs',
  LEAVES: 'mil_hr_leaves',
  ATTENDANCE: 'mil_hr_attendance',
  CURRENT_USER: 'mil_hr_curr_user',
  SETTINGS: 'mil_hr_settings',
  ERRORS: 'mil_hr_errors',
  SCHEDULES: 'mil_hr_schedules',
  SESSION: 'mil_hr_session'
};

/**
 * طبقة التخزين المؤقت (Cache) لتقليل عمليات القراءة من الـ localStorage وتجنب التمرير (Parsing) المتكرر
 */
const cache: Record<string, any> = {};

/**
 * مساعد استرجاع البيانات من التخزين المحلي مع الاعتماد على الـ Cache كخطوة أولى
 * @param key مفتاح التخزين
 * @param defaultValue القيمة الافتراضية في حال عدم وجود بيانات
 * @returns البيانات المستردة أو القيمة الافتراضية
 */
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (cache[key]) return cache[key];
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    const parsed = JSON.parse(data);
    cache[key] = parsed;
    return parsed;
  } catch {
    return defaultValue;
  }
};

/**
 * مساعد حفظ البيانات في التخزين المحلي وتحديث الـ Cache بالتزامن
 * @param key مفتاح التخزين
 * @param data البيانات المراد حفظها
 */
const setToStorage = <T>(key: string, data: T) => {
  cache[key] = data;
  localStorage.setItem(key, JSON.stringify(data));
};

const DEFAULT_PERMISSIONS = {
  canAdd: true,
  canEdit: true,
  canDelete: true,
  canViewReports: true,
  canManageUsers: true
};

const generateMockPersonnel = (depts: Department[], sections: Section[]): Personnel[] => {
  const arabicNames = [
    "محمد أحمد الفيتوري", "علي سالم الورفلي", "محمود جابر المصراتي", "عبدالرحمن خالد الزوي", "إبراهيم منصور الترهوني",
    "عمر يوسف القذافي", "سعد مسعود البرعصي", "صلاح الدين الأوجلي", "أنس فرج العبيدي", "ياسين عماد التاجوري",
    "وليد عبدالسلام غيث", "خليل إبراهيم الغرياني", "موسى عيسى الحراري", "طارق زياد الكاني", "حمزة عباس القماطي",
    "أسامة سالم بن لادن", "جمال عبدالناصر الحاسي", "خالد وليد بن غلبون", "صدام حسين التواتي", "ياسر عرفات المجبري"
  ];
  
  const ranks = DEFAULT_RANKS;
  
  return arabicNames.map((name, i) => {
    const dept = depts[i % depts.length];
    const deptSections = sections.filter(s => s.departmentId === dept.id);
    const section = deptSections[i % deptSections.length];

    return {
      id: `mock-p-${i}`,
      name,
      rank: ranks[i % (ranks.length - 2)] || 'بلا',
      militaryNumber: `${50000 + i}`,
      nationalId: `11980000${1000 + i}`,
      address: "ليبيا - طرابلس",
      bloodType: BLOOD_TYPES[i % BLOOD_TYPES.length],
      departmentId: dept.id,
      sectionId: section?.id,
      entity: "رئاسة الأركان العامة",
      employmentType: "تعيين دائم",
      placementLocation: "المقر الرئيسي",
      salaryEntity: "مصرف ليبيا المركزي",
      phone: `091${1000000 + i}`,
      emergencyPhone: `092${2000000 + i}`,
      uniformSize: "XL",
      shoeSize: "44",
      type: PersonnelType.MILITARY,
      status: 'active',
      attendanceStatus: 'present',
      isManager: i < 4,
      createdAt: new Date().toISOString(),
      lastPromotionDate: "2021-06-15",
      joinDate: "2010-01-01",
      promotionHistory: [],
      movementHistory: [],
      gear: [],
      documents: [],
      commendations: [],
      disciplinaryRecords: [],
      customData: {},
      idType: 'national',
      hasMilitaryNumber: true,
      rankAuthority: 'رئاسة الأركان',
      financialStatus: 'salary',
      connectionType: 'دائم',
      directSupervisor: 'commander',
      lastEditedBy: 'system',
      lastEditedAt: new Date().toISOString()
    };
  });
};

/**
 * كائن إدارة التخزين (Storage Manager)
 * يمثل واجهة برمجية (API) للتعامل مع التخزين المحلي كقاعدة بيانات
 */
export const storage = {
  getPersonnel: (): Personnel[] => {
    const cached = cache[KEYS.PERSONNEL];
    if (cached && cached.length > 0) return cached;
    
    const data = localStorage.getItem(KEYS.PERSONNEL);
    if (!data || JSON.parse(data).length === 0) {
      const settings = storage.getSettings();
      if (settings.devMode) {
        const depts = storage.getDepartments();
        const sections = storage.getSections();
        const mock = generateMockPersonnel(depts, sections);
        setToStorage(KEYS.PERSONNEL, mock);
        return mock;
      }
      return [];
    }
    const parsed = JSON.parse(data);
    cache[KEYS.PERSONNEL] = parsed;
    return parsed;
  },
  setPersonnel: (data: Personnel[]) => setToStorage(KEYS.PERSONNEL, data),
  
  getDepartments: (): Department[] => {
    const cached = cache[KEYS.DEPARTMENTS];
    if (cached) return cached;

    const data = localStorage.getItem(KEYS.DEPARTMENTS);
    if (!data) {
      const initial = [
        { id: 'd1', name: 'الشؤون الإدارية والمالية' },
        { id: 'd2', name: 'العمليات والتدريب' },
        { id: 'd3', name: 'التسليح والذخيرة' },
        { id: 'd4', name: 'الإشارة وتقنية المعلومات' }
      ];
      setToStorage(KEYS.DEPARTMENTS, initial);
      return initial;
    }
    const parsed = JSON.parse(data);
    cache[KEYS.DEPARTMENTS] = parsed;
    return parsed;
  },
  setDepartments: (data: Department[]) => setToStorage(KEYS.DEPARTMENTS, data),

  getSections: (): Section[] => {
    const cached = cache[KEYS.SECTIONS];
    if (cached) return cached;

    const data = localStorage.getItem(KEYS.SECTIONS);
    if (!data) {
      const initial: Section[] = [
        { id: 's1', name: 'قسم الأفراد', departmentId: 'd1' },
        { id: 's2', name: 'قسم الحسابات', departmentId: 'd1' },
        { id: 's3', name: 'قسم التدريب القتالي', departmentId: 'd2' },
        { id: 's4', name: 'قسم الخطط', departmentId: 'd2' },
        { id: 's5', name: 'قسم الصيانة', departmentId: 'd3' },
        { id: 's6', name: 'قسم الدعم الفني', departmentId: 'd4' },
      ];
      setToStorage(KEYS.SECTIONS, initial);
      return initial;
    }
    const parsed = JSON.parse(data);
    cache[KEYS.SECTIONS] = parsed;
    return parsed;
  },
  setSections: (data: Section[]) => setToStorage(KEYS.SECTIONS, data),

  getUsers: (): User[] => {
    const cached = cache[KEYS.USERS];
    if (cached) return cached;

    const data = localStorage.getItem(KEYS.USERS);
    if (!data) {
      const initial: User[] = [{ 
        id: 'u1', 
        username: 'admin', 
        // كلمة المرور المشفرة لـ '123' باستخدام bcryptjs
        password: '$2b$10$7SdA3kT3mwqKqEXFlt1/het.bXRYYq.A4Lf6Yq9PFxOAkVH39DZjO', 
        role: UserRole.SUPERVISOR, 
        name: 'مدير النظام التنفيذي',
        permissions: DEFAULT_PERMISSIONS
      }];
      setToStorage(KEYS.USERS, initial);
      // تنظيف الـ cache لضمان تحميل البيانات الجديدة
      delete cache[KEYS.USERS];
      return initial;
    }
    const parsed = JSON.parse(data);
    cache[KEYS.USERS] = parsed;
    return parsed;
  },
  setUsers: (data: User[]) => setToStorage(KEYS.USERS, data),

  getLogs: (): AuditLog[] => getFromStorage(KEYS.LOGS, []),
  addLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const logs = storage.getLogs();
    const newLog: AuditLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    setToStorage(KEYS.LOGS, [newLog, ...logs].slice(0, 1000));
  },

  getLeaves: (): Leave[] => getFromStorage(KEYS.LEAVES, []),
  setLeaves: (data: Leave[]) => setToStorage(KEYS.LEAVES, data),

  getAttendance: (): AttendanceRecord[] => getFromStorage(KEYS.ATTENDANCE, []),
  setAttendance: (data: AttendanceRecord[]) => setToStorage(KEYS.ATTENDANCE, data),
  addAttendanceRecords: (newRecords: AttendanceRecord[]) => {
    const records = storage.getAttendance();
    const dates = new Set(newRecords.map(r => r.date));
    const pIds = new Set(newRecords.map(r => r.personnelId));
    const filtered = records.filter(r => !(dates.has(r.date) && pIds.has(r.personnelId)));
    storage.setAttendance([...newRecords, ...filtered]);
  },
  
  getCurrentUser: (): User | null => getFromStorage(KEYS.CURRENT_USER, null),
  setCurrentUser: (user: User | null) => {
    if (user) {
      const { password: _, ...safeUser } = user;
      setToStorage(KEYS.CURRENT_USER, safeUser);
    } else {
      setToStorage(KEYS.CURRENT_USER, null);
    }
  },
  clearSession: () => {
    delete cache[KEYS.CURRENT_USER];
    delete cache[KEYS.SESSION];
    localStorage.removeItem(KEYS.CURRENT_USER);
    localStorage.removeItem(KEYS.SESSION);
  },

  getSettings: (): SystemSettings => {
    const cached = cache[KEYS.SETTINGS];
    const defaults: SystemSettings = { 
      orgName: 'DCMI ENTERPRISE - منظومة إدارة شئون الأفراد', 
      orgHierarchy: ['وزارة الدفاع', 'القوات المسلحة', 'إدارة القوى البشرية'],
      logo: 'https://cdn-icons-png.flaticon.com/512/3663/3663434.png',
      theme: 'light',
      accentColor: '#4f46e5',
      customFields: [],
      announcements: [],
      version: '5.1.0',
      ranks: DEFAULT_RANKS,
      reportFooter: 'هذه الوثيقة رسمية ومعتمدة من قبل إدارة القوى البشرية.',
      reportFont: 'IBM Plex Sans Arabic',
      autoLogoutTime: 30,
      entities: ['وزارة الدفاع', 'وزارة الداخلية'],
      salaryEntities: ['مصرف ليبيا المركزي', 'مصرف الجمهورية', 'مصرف التجاري الوطني'],
      signatureTitles: ['الموظف المختص', 'رئيس القسم الإداري', 'آمر الوحدة'],
      enableMaintenance: false,
      maintenanceMessage: 'النظام في وضع الصيانة الدورية.',
      pdfQuality: 'high',
      qrDetailLevel: 'full',
      enableAutoLogout: true,
      enableNotificationSounds: true,
      showWatermark: true,
      watermarkText: 'DCMI SECURE',
      visibleWidgets: ['stats', 'readiness', 'logs', 'chart'],
      enableErrorTracking: true,
      apiConfig: {
        enabled: false,
        externalEndpoint: '',
        apiKey: '',
        secretToken: '',
        authType: 'Bearer',
        webhooks: []
      },
      hiddenTabs: [],
      hiddenWidgets: [],
      numberFormat: 'latin',
      logRetentionDays: 180,
      copyrightText: 'DCMI ENTERPRISE © 2024 - جميع الحقوق محفوظة',
      defaultReportFontSize: 10,
      devMode: false,
      absenceThreshold: 3
    };
    if (cached) return { ...defaults, ...cached };
    
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (!data) return defaults;
    const parsed = JSON.parse(data);
    cache[KEYS.SETTINGS] = parsed;
    return { ...defaults, ...parsed };
  },
  setSettings: (settings: SystemSettings) => setToStorage(KEYS.SETTINGS, settings),

  getErrors: (): AppError[] => getFromStorage(KEYS.ERRORS, []),
  addError: (error: Omit<AppError, 'id' | 'timestamp' | 'browser' | 'url'>) => {
    const errors = storage.getErrors();
    const newError: AppError = {
      ...error,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent,
      url: window.location.href
    };
    setToStorage(KEYS.ERRORS, [newError, ...errors].slice(0, 50));
  },
  clearErrors: () => {
    delete cache[KEYS.ERRORS];
    localStorage.removeItem(KEYS.ERRORS);
  },

  getWorkSchedules: (): WorkSchedule[] => getFromStorage(KEYS.SCHEDULES, []),
  setWorkSchedules: (data: WorkSchedule[]) => setToStorage(KEYS.SCHEDULES, data),

  getSession: () => getFromStorage(KEYS.SESSION, null),
  setSession: (session: any) => setToStorage(KEYS.SESSION, session),

  exportBackup: (): string => {
    const personnel = storage.getPersonnel().map(p => {
      const { ...rest } = p;
      return rest;
    });
    const users = storage.getUsers().map(u => {
      const { password: _, ...safeUser } = u;
      return safeUser;
    });
    const allData = {
      personnel,
      departments: storage.getDepartments(),
      sections: storage.getSections(),
      users,
      leaves: storage.getLeaves(),
      attendance: storage.getAttendance(),
      settings: storage.getSettings(),
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(allData, null, 2);
  },

  importBackup: (jsonStr: string): void => {
    const data = JSON.parse(jsonStr);
    if (data.personnel) storage.setPersonnel(data.personnel);
    if (data.departments) storage.setDepartments(data.departments);
    if (data.sections) storage.setSections(data.sections);
    if (data.users) storage.setUsers(data.users);
    if (data.leaves) storage.setLeaves(data.leaves);
    if (data.attendance) storage.setAttendance(data.attendance);
    if (data.settings) storage.setSettings(data.settings);
    // Clear all cache entries to force re-read
    Object.keys(cache).forEach(k => delete cache[k]);
  },

  getSystemSnapshot: () => {
    const personnel = storage.getPersonnel();
    const depts = storage.getDepartments();
    const sections = storage.getSections();
    return {
      totalPersonnel: personnel.length,
      departments: depts.length,
      sections: sections.length,
      readinessRate: personnel.length > 0 ? (personnel.filter(p => p.attendanceStatus === 'present' || p.attendanceStatus === 'assigned').length / personnel.length * 100).toFixed(1) + '%' : '0%'
    };
  }
};
