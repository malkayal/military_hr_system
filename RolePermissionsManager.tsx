import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'personnel' | 'attendance' | 'leaves' | 'reports' | 'admin' | 'settings';
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // IDs of permissions
  level: 'admin' | 'supervisor' | 'user';
  createdAt: string;
}

interface RolePermissionsManagerProps {
  onRolesUpdate: (roles: Role[]) => void;
}

// الصلاحيات المتاحة (نقلت خارج المكون لتجنب إعادة تهيئتها ولتحسين الأداء)
const availablePermissions: Permission[] = [
  // صلاحيات إدارة الأفراد
  { id: 'view_personnel', name: 'عرض الأفراد', description: 'عرض قائمة الأفراد', category: 'personnel' },
  { id: 'add_personnel', name: 'إضافة أفراد', description: 'إضافة أفراد جدد', category: 'personnel' },
  { id: 'edit_personnel', name: 'تعديل الأفراد', description: 'تعديل بيانات الأفراد', category: 'personnel' },
  { id: 'delete_personnel', name: 'حذف الأفراد', description: 'حذف الأفراد من النظام', category: 'personnel' },
  { id: 'export_personnel', name: 'تصدير الأفراد', description: 'تصدير بيانات الأفراد', category: 'personnel' },

  // صلاحيات الحضور
  { id: 'view_attendance', name: 'عرض الحضور', description: 'عرض سجلات الحضور', category: 'attendance' },
  { id: 'record_attendance', name: 'تسجيل الحضور', description: 'تسجيل الحضور والغياب', category: 'attendance' },
  { id: 'edit_attendance', name: 'تعديل الحضور', description: 'تعديل سجلات الحضور', category: 'attendance' },
  { id: 'delete_attendance', name: 'حذف الحضور', description: 'حذف سجلات الحضور', category: 'attendance' },

  // صلاحيات الإجازات
  { id: 'view_leaves', name: 'عرض الإجازات', description: 'عرض طلبات الإجازات', category: 'leaves' },
  { id: 'approve_leaves', name: 'الموافقة على الإجازات', description: 'الموافقة على طلبات الإجازات', category: 'leaves' },
  { id: 'reject_leaves', name: 'رفض الإجازات', description: 'رفض طلبات الإجازات', category: 'leaves' },
  { id: 'request_leave', name: 'طلب إجازة', description: 'طلب إجازة جديدة', category: 'leaves' },

  // صلاحيات التقارير
  { id: 'view_reports', name: 'عرض التقارير', description: 'عرض التقارير المختلفة', category: 'reports' },
  { id: 'generate_reports', name: 'توليد التقارير', description: 'توليد تقارير جديدة', category: 'reports' },
  { id: 'export_reports', name: 'تصدير التقارير', description: 'تصدير التقارير', category: 'reports' },

  // صلاحيات الإدارة
  { id: 'manage_departments', name: 'إدارة الإدارات', description: 'إضافة وتعديل الإدارات', category: 'admin' },
  { id: 'manage_users', name: 'إدارة المستخدمين', description: 'إضافة وتعديل المستخدمين', category: 'admin' },
  { id: 'manage_schedules', name: 'إدارة الجداول', description: 'إدارة جداول العمل', category: 'admin' },
  { id: 'view_audit_log', name: 'عرض سجل التدقيق', description: 'عرض سجل التعديلات', category: 'admin' },

  // صلاحيات الإعدادات
  { id: 'manage_settings', name: 'إدارة الإعدادات', description: 'تغيير إعدادات النظام', category: 'settings' },
  { id: 'manage_roles', name: 'إدارة الأدوار', description: 'إضافة وتعديل الأدوار والصلاحيات', category: 'settings' },
];

const RolePermissionsManager: React.FC<RolePermissionsManagerProps> = ({ onRolesUpdate }) => {

  const [roles, setRoles] = useState<Role[]>(() => {
    const stored = localStorage.getItem('roles');
    return stored ? JSON.parse(stored) : [];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Role>>({
    name: '',
    description: '',
    permissions: [],
    level: 'user'
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // حفظ الأدوار
  const saveRoles = (updatedRoles: Role[]) => {
    localStorage.setItem('roles', JSON.stringify(updatedRoles));
    setRoles(updatedRoles);
    onRolesUpdate(updatedRoles);
    setMessage({ type: 'success', text: 'تم حفظ الأدوار بنجاح' });
    setTimeout(() => setMessage(null), 2000);
  };

  // إضافة دور جديد
  const handleAddRole = () => {
    if (!formData.name?.trim()) {
      setMessage({ type: 'error', text: 'يجب إدخال اسم الدور' });
      return;
    }

    const newRole: Role = {
      id: `role-${crypto.randomUUID()}`,
      name: formData.name,
      description: formData.description || '',
      permissions: formData.permissions || [],
      level: formData.level as Role['level'],
      createdAt: new Date().toISOString()
    };

    const updatedRoles = [...roles, newRole];
    saveRoles(updatedRoles);
    resetForm();
    setIsAdding(false);
  };

  // تحديث دور موجود
  const handleUpdateRole = () => {
    if (!editingId || !formData.name?.trim()) {
      setMessage({ type: 'error', text: 'يجب إدخال اسم الدور' });
      return;
    }

    const updatedRoles = roles.map(role =>
      role.id === editingId
        ? {
            ...role,
            name: formData.name,
            description: formData.description || '',
            permissions: formData.permissions || [],
            level: formData.level as Role['level']
          }
        : role
    );

    saveRoles(updatedRoles);
    resetForm();
    setEditingId(null);
  };

  // حذف دور
  const handleDeleteRole = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الدور؟')) {
      const updatedRoles = roles.filter(role => role.id !== id);
      saveRoles(updatedRoles);
    }
  };

  // تحرير دور
  const handleEditRole = (role: Role) => {
    setFormData(role);
    setEditingId(role.id);
    setIsAdding(false);
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      level: 'user'
    });
  };

  // تجميع الصلاحيات حسب الفئة
  const permissionsByCategory = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    availablePermissions.forEach(perm => {
      if (!grouped[perm.category]) grouped[perm.category] = [];
      grouped[perm.category].push(perm);
    });
    return grouped;
  }, []);

  const categoryLabels: Record<string, string> = {
    personnel: 'إدارة الأفراد',
    attendance: 'الحضور والغياب',
    leaves: 'الإجازات والأذونات',
    reports: 'التقارير',
    admin: 'الإدارة',
    settings: 'الإعدادات'
  };

  return (
    <div className="space-y-6">
      {/* رسالة التنبيه */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="font-bold">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* زر إضافة دور جديد */}
      {!isAdding && !editingId && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full px-4 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} />
          إضافة دور جديد
        </button>
      )}

      {/* نموذج إضافة/تعديل الدور */}
      <AnimatePresence>
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 space-y-4"
          >
            <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Lock size={20} />
              {editingId ? 'تعديل الدور' : 'إضافة دور جديد'}
            </h3>

            {/* اسم الدور */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                اسم الدور
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: مشرف الحضور"
                className="w-full px-4 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-accent outline-none"
              />
            </div>

            {/* وصف الدور */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                وصف الدور
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="أدخل وصفاً للدور"
                rows={2}
                className="w-full px-4 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-accent outline-none"
              />
            </div>

            {/* مستوى الدور */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                مستوى الدور
              </label>
              <select
                value={formData.level || 'user'}
                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as Role['level'] }))}
                className="w-full px-4 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-accent outline-none"
              >
                <option value="admin">مسؤول</option>
                <option value="supervisor">مشرف</option>
                <option value="user">مستخدم عادي</option>
              </select>
            </div>

            {/* الصلاحيات */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                الصلاحيات
              </label>
              <div className="space-y-4">
                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                  <div key={category} className="border dark:border-slate-600 rounded-lg p-3">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">
                      {categoryLabels[category]}
                    </h4>
                    <div className="space-y-2">
                      {perms.map(perm => (
                        <div key={perm.id} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id={`perm-${perm.id}`}
                            checked={(formData.permissions || []).includes(perm.id)}
                            onChange={(e) => {
                              const permissions = formData.permissions || [];
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  permissions: [...permissions, perm.id]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  permissions: permissions.filter(p => p !== perm.id)
                                }));
                              }
                            }}
                            className="w-4 h-4 accent-accent rounded mt-1"
                          />
                          <label htmlFor={`perm-${perm.id}`} className="text-sm text-slate-700 dark:text-slate-300">
                            <div className="font-bold">{perm.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{perm.description}</div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* أزرار الإجراء */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (editingId) {
                    handleUpdateRole();
                  } else {
                    handleAddRole();
                  }
                }}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Save size={18} />
                {editingId ? 'تحديث' : 'إضافة'}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <X size={18} />
                إلغاء
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* قائمة الأدوار */}
      <div className="space-y-3">
        <h3 className="font-black text-slate-800 dark:text-white">الأدوار المعرفة ({roles.length})</h3>
        {roles.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            لا توجد أدوار معرفة حالياً
          </div>
        ) : (
          <div className="space-y-2">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-slate-800 p-4 rounded-lg border dark:border-slate-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-white">{index + 1}. {role.name}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        role.level === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        role.level === 'supervisor' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {role.level === 'admin' ? 'مسؤول' : role.level === 'supervisor' ? 'مشرف' : 'مستخدم'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{role.description}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      الصلاحيات: {role.permissions.length}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditRole(role)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RolePermissionsManager;
