import React, { useState, useMemo } from 'react';
import { storage } from '../utils/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, AlertCircle } from 'lucide-react';

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  required: boolean;
  options?: string[]; // للحقول من نوع select
  description?: string;
}

interface CustomFieldsManagerProps {
  onFieldsUpdate: (fields: CustomField[]) => void;
}

const CustomFieldsManager: React.FC<CustomFieldsManagerProps> = ({ onFieldsUpdate }) => {
  const [customFields, setCustomFields] = useState<CustomField[]>(() => {
    const stored = localStorage.getItem('customFields');
    return stored ? JSON.parse(stored) : [];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CustomField>>({
    name: '',
    type: 'text',
    required: false,
    options: []
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // حفظ الحقول المخصصة
  const saveCustomFields = (fields: CustomField[]) => {
    localStorage.setItem('customFields', JSON.stringify(fields));
    setCustomFields(fields);
    onFieldsUpdate(fields);
    setMessage({ type: 'success', text: 'تم حفظ الحقول بنجاح' });
    setTimeout(() => setMessage(null), 2000);
  };

  // إضافة حقل جديد
  const handleAddField = () => {
    if (!formData.name?.trim()) {
      setMessage({ type: 'error', text: 'يجب إدخال اسم الحقل' });
      return;
    }

    const newField: CustomField = {
      id: `field-${crypto.randomUUID()}`,
      name: formData.name,
      type: formData.type as CustomField['type'],
      required: formData.required || false,
      options: formData.type === 'select' ? formData.options || [] : undefined,
      description: formData.description
    };

    const updatedFields = [...customFields, newField];
    saveCustomFields(updatedFields);
    resetForm();
    setIsAdding(false);
  };

  // تحديث حقل موجود
  const handleUpdateField = () => {
    if (!editingId || !formData.name?.trim()) {
      setMessage({ type: 'error', text: 'يجب إدخال اسم الحقل' });
      return;
    }

    const updatedFields = customFields.map(field =>
      field.id === editingId
        ? {
            ...field,
            name: formData.name,
            type: formData.type as CustomField['type'],
            required: formData.required || false,
            options: formData.type === 'select' ? formData.options || [] : undefined,
            description: formData.description
          }
        : field
    );

    saveCustomFields(updatedFields);
    resetForm();
    setEditingId(null);
  };

  // حذف حقل
  const handleDeleteField = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الحقل؟')) {
      const updatedFields = customFields.filter(field => field.id !== id);
      saveCustomFields(updatedFields);
    }
  };

  // تحرير حقل
  const handleEditField = (field: CustomField) => {
    setFormData(field);
    setEditingId(field.id);
    setIsAdding(false);
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'text',
      required: false,
      options: []
    });
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
            <AlertCircle size={20} />
            <span className="font-bold">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* زر إضافة حقل جديد */}
      {!isAdding && !editingId && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full px-4 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} />
          إضافة حقل مخصص جديد
        </button>
      )}

      {/* نموذج إضافة/تعديل الحقل */}
      <AnimatePresence>
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 space-y-4"
          >
            <h3 className="font-black text-slate-800 dark:text-white">
              {editingId ? 'تعديل الحقل' : 'إضافة حقل جديد'}
            </h3>

            {/* اسم الحقل */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                اسم الحقل
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: سنوات الخدمة"
                className="w-full px-4 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-accent outline-none"
              />
            </div>

            {/* وصف الحقل */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                وصف الحقل (اختياري)
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="أدخل وصفاً للحقل"
                rows={2}
                className="w-full px-4 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-accent outline-none"
              />
            </div>

            {/* نوع الحقل */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                نوع الحقل
              </label>
              <select
                value={formData.type || 'text'}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CustomField['type'] }))}
                className="w-full px-4 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-accent outline-none"
              >
                <option value="text">نص</option>
                <option value="number">رقم</option>
                <option value="date">تاريخ</option>
                <option value="select">قائمة منسدلة</option>
                <option value="checkbox">اختيار</option>
              </select>
            </div>

            {/* خيارات القائمة المنسدلة */}
            {formData.type === 'select' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  الخيارات (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  value={formData.options?.join(', ') || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean)
                  }))}
                  placeholder="مثال: خيار 1, خيار 2, خيار 3"
                  className="w-full px-4 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-accent outline-none"
                />
              </div>
            )}

            {/* حقل مطلوب */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="required"
                checked={formData.required || false}
                onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                className="w-4 h-4 accent-accent rounded"
              />
              <label htmlFor="required" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                حقل مطلوب
              </label>
            </div>

            {/* أزرار الإجراء */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (editingId) {
                    handleUpdateField();
                  } else {
                    handleAddField();
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

      {/* قائمة الحقول المخصصة */}
      <div className="space-y-3">
        <h3 className="font-black text-slate-800 dark:text-white">الحقول المخصصة ({customFields.length})</h3>
        {customFields.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            لا توجد حقول مخصصة حالياً
          </div>
        ) : (
          <div className="space-y-2">
            {customFields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-slate-800 p-4 rounded-lg border dark:border-slate-700 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-white">{index + 1}. {field.name}</span>
                    {field.required && (
                      <span className="text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded">
                        مطلوب
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    النوع: {field.type === 'text' ? 'نص' : field.type === 'number' ? 'رقم' : field.type === 'date' ? 'تاريخ' : field.type === 'select' ? 'قائمة منسدلة' : 'اختيار'}
                    {field.description && ` - ${field.description}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditField(field)}
                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomFieldsManager;
