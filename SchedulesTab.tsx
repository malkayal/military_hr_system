
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, PlusCircle, Calendar, Edit2, Trash2, X, Sun, Moon 
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { WorkSchedule, ScheduleType, Department, Section } from '../../types';

interface SchedulesTabProps {
  workSchedules: WorkSchedule[];
  departments: Department[];
  sections: Section[];
  onSchedulesUpdate: () => void;
}

const SchedulesTab: React.FC<SchedulesTabProps> = ({ 
  workSchedules, 
  departments, 
  sections, 
  onSchedulesUpdate 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [formData, setFormData] = useState<Partial<WorkSchedule>>({
    name: '',
    type: 'daily',
    departmentId: '',
    sectionId: '',
    startTime: '08:00',
    endTime: '14:00',
    description: '',
    color: '#3b82f6',
    daysOfWeek: [0, 1, 2, 3, 4],
    workDaysCount: 1,
    restDaysCount: 4,
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleOpenModal = (s?: WorkSchedule) => {
    if (s) {
      setEditingSchedule(s);
      setFormData(s);
    } else {
      setEditingSchedule(null);
      setFormData({
        name: '',
        type: 'daily',
        departmentId: '',
        sectionId: '',
        startTime: '08:00',
        endTime: '14:00',
        description: '',
        color: '#3b82f6',
        daysOfWeek: [0, 1, 2, 3, 4],
        workDaysCount: 1,
        restDaysCount: 4,
        startDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type) return;

    const schedules = storage.getWorkSchedules();
    let updated: WorkSchedule[];
    
    if (editingSchedule) {
      updated = schedules.map(s => s.id === editingSchedule.id ? { ...s, ...formData } as WorkSchedule : s);
    } else {
      const newSchedule: WorkSchedule = {
        id: crypto.randomUUID(),
        name: formData.name!,
        type: formData.type as ScheduleType,
        daysOfWeek: formData.daysOfWeek,
        workDaysCount: formData.workDaysCount,
        restDaysCount: formData.restDaysCount,
        startDate: formData.startDate,
        departmentId: formData.departmentId,
        sectionId: formData.sectionId,
        startTime: formData.startTime,
        endTime: formData.endTime,
        description: formData.description,
        color: formData.color,
        createdAt: new Date().toISOString()
      };
      updated = [...schedules, newSchedule];
    }

    storage.setWorkSchedules(updated);
    onSchedulesUpdate();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف نظام الدوام هذا؟')) {
      const schedules = storage.getWorkSchedules();
      const updated = schedules.filter(s => s.id !== id);
      storage.setWorkSchedules(updated);
      onSchedulesUpdate();
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/40 text-center space-y-3">
        <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
          <Timer size={32} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">إدارة أنظمة قيام العمل</p>
          <h4 className="text-3xl font-black text-blue-700">{workSchedules.length} نظام نشط</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workSchedules.map(s => (
          <div key={s.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                 <div className="p-3 rounded-2xl" style={{ backgroundColor: `${s.color}20`, color: s.color }}>
                   {s.type === 'overnight' ? <Moon size={20}/> : <Sun size={20}/>}
                 </div>
                 <div>
                    <h5 className="font-black text-sm dark:text-white">{s.name}</h5>
                    <p className="text-[10px] font-bold text-slate-400 capitalize">{s.type === 'daily' ? 'يومي' : s.type === 'rotation' ? 'تبادلي' : s.type === 'overnight' ? 'مبيت' : 'أيام ثابتة'}</p>
                 </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => handleOpenModal(s)} className="p-2 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg"><Edit2 size={14}/></button>
                 <button onClick={() => handleDelete(s.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"><Trash2 size={14}/></button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
               <div className="flex items-center gap-1"><Calendar size={12}/> {s.startTime} - {s.endTime}</div>
               <div className="flex items-center gap-1"><Building2 size={12} className="w-3 h-3"/> {departments.find(d=>d.id===s.departmentId)?.name || 'عام'}</div>
            </div>
          </div>
        ))}

        <button 
          onClick={() => handleOpenModal()}
          className="bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-accent hover:bg-white transition-all group"
        >
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:text-accent group-hover:scale-110 transition-all shadow-sm">
            <PlusCircle size={32} />
          </div>
          <p className="text-sm font-black text-slate-400 group-hover:text-accent">إضافة نظام دوام جديد</p>
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border dark:border-slate-800 max-h-[90vh] flex flex-col"
            >
              <div className="p-8 md:p-10 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/30">
                <h3 className="text-xl md:text-2xl font-black flex items-center gap-4 dark:text-white">
                  <Timer className="text-accent" size={24}/> {editingSchedule ? 'تعديل نظام قيام' : 'إضافة نظام قيام جديد'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all text-slate-400"><X /></button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-500 mr-2 uppercase tracking-widest">اسم النظام</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent p-4 rounded-2xl font-bold transition-all outline-none dark:text-white"
                        placeholder="مثال: دوام الفنيين 1/4"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-500 mr-2 uppercase tracking-widest">نوع الدوام</label>
                      <select 
                        required
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value as ScheduleType })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent p-4 rounded-2xl font-bold transition-all outline-none dark:text-white"
                      >
                        <option value="daily">يومي (كل يوم)</option>
                        <option value="fixed_days">أيام محددة في الأسبوع</option>
                        <option value="rotation">تبادلي (عمل / راحة)</option>
                        <option value="overnight">مبيت (24 ساعة)</option>
                      </select>
                    </div>
                  </div>

                  {formData.type === 'daily' && (
                    <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                      <label className="text-xs font-black text-slate-500 block mb-2">تحديد أيام العمل</label>
                      <div className="flex flex-wrap gap-2">
                        {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const current = formData.daysOfWeek || [0, 1, 2, 3, 4];
                              const next = current.includes(idx) ? current.filter(d => d !== idx) : [...current, idx];
                              setFormData({ ...formData, daysOfWeek: next });
                            }}
                            className={`px-4 py-2 rounded-xl font-black text-[10px] transition-all border-2 ${
                              (formData.daysOfWeek || [0, 1, 2, 3, 4]).includes(idx)
                                ? 'bg-accent border-accent text-white shadow-lg'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 mr-2 uppercase tracking-widest">وقت الحضور</label>
                        <input type="time" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white border-2 border-transparent focus:border-accent outline-none" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })}/>
                     </div>
                     <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 mr-2 uppercase tracking-widest">وقت الانصراف</label>
                        <input type="time" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white border-2 border-transparent focus:border-accent outline-none" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })}/>
                     </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 mr-2 uppercase tracking-widest">التشكيل الإداري القائم</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <select className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white outline-none border-2 border-transparent focus:border-accent" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value, sectionId: ''})}>
                          <option value="">كافة التشكيلات (عام)</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                       </select>
                       <select className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white outline-none border-2 border-transparent focus:border-accent disabled:opacity-30" value={formData.sectionId} onChange={e => setFormData({...formData, sectionId: e.target.value})} disabled={!formData.departmentId}>
                          <option value="">كافة الأقسام الداخلية</option>
                          {sections.filter(s => s.departmentId === formData.departmentId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                    </div>
                  </div>
              </form>

              <div className="p-8 md:p-10 border-t dark:border-slate-800 flex justify-end gap-4 bg-gray-50/50 dark:bg-slate-800/30">
                 <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-500 font-black text-sm">إلغاء</button>
                 <button onClick={handleSave} className="px-12 py-3 bg-accent text-white rounded-2xl font-black text-sm shadow-xl shadow-accent/20">حفظ الإعدادات</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Building2 = ({ size, className }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/></svg>
);

export default SchedulesTab;
