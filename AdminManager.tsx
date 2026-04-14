
import React, { useState, useMemo, useEffect } from 'react';
import { storage } from '../utils/storage';
import { Department, Section, User, AuditLog, Announcement } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, History, Trash, Megaphone, LayoutDashboard, 
  X, Edit2, Workflow, ShieldCheck, Clock, User as UserIcon,
  AlertCircle, AlertTriangle, Send, Bell
} from 'lucide-react';

interface AdminManagerProps {
  currentUser: User;
  onSettingsUpdate: () => void;
  forceTab?: 'depts' | 'announcements' | 'logs' | 'lists';
}

const AdminManager: React.FC<AdminManagerProps> = ({ currentUser, onSettingsUpdate, forceTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'depts' | 'announcements' | 'logs' | 'lists'>(forceTab || 'depts');
  const [departments, setDepartments] = useState<Department[]>(storage.getDepartments());
  const [sections, setSections] = useState<Section[]>(storage.getSections());
  const [logs, setLogs] = useState<AuditLog[]>(storage.getLogs());
  const personnel = useMemo(() => storage.getPersonnel(), []);
  const settings = useMemo(() => storage.getSettings(), []);
  
  const [deptSortMode, setDeptSortMode] = useState<'none' | 'alphabetical'>('none');
  
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptFormData, setDeptFormData] = useState({ name: '', managerId: '' });

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionFormData, setSectionFormData] = useState({ name: '', departmentId: '' });

  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementFormData, setAnnouncementFormData] = useState<Omit<Announcement, 'id' | 'date' | 'author'>>({
    title: '',
    content: '',
    priority: 'normal',
  });

  // تحديث السجلات عند فتح التبويب الخاص بها
  useEffect(() => {
    if (activeSubTab === 'logs') {
      setLogs(storage.getLogs());
    }
  }, [activeSubTab]);

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: Department[];
    const isNew = !editingDept;
    if (editingDept) {
      updated = departments.map(d => d.id === editingDept.id ? { ...d, name: deptFormData.name, managerId: deptFormData.managerId } : d);
    } else {
      updated = [...departments, { id: crypto.randomUUID(), name: deptFormData.name, managerId: deptFormData.managerId }];
    }
    setDepartments(updated);
    storage.setDepartments(updated);
    setIsDeptModalOpen(false);
    
    storage.addLog({
      userId: currentUser.id,
      username: currentUser.username,
      action: isNew ? 'إضافة وحدة' : 'تعديل وحدة',
      details: `تم ${isNew ? 'إضافة' : 'تعديل'} الوحدة: ${deptFormData.name}`
    });
    setLogs(storage.getLogs());
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: Section[];
    const isNew = !editingSection;
    if (editingSection) {
      updated = sections.map(s => s.id === editingSection.id ? { ...s, name: sectionFormData.name, departmentId: sectionFormData.departmentId } : s);
    } else {
      updated = [...sections, { id: crypto.randomUUID(), name: sectionFormData.name, departmentId: sectionFormData.departmentId }];
    }
    setSections(updated);
    storage.setSections(updated);
    setIsSectionModalOpen(false);

    storage.addLog({
      userId: currentUser.id,
      username: currentUser.username,
      action: isNew ? 'إضافة قسم' : 'تعديل قسم',
      details: `تم ${isNew ? 'إضافة' : 'تعديل'} القسم: ${sectionFormData.name}`
    });
    setLogs(storage.getLogs());
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const currentSettings = storage.getSettings();
    const newAnnouncement: Announcement = {
      ...announcementFormData,
      id: crypto.randomUUID(),
      author: currentUser.name,
      date: new Date().toISOString()
    };
    
    const updatedAnnouncements = [newAnnouncement, ...(currentSettings.announcements || [])];
    storage.setSettings({ ...currentSettings, announcements: updatedAnnouncements });
    
    setIsAnnouncementModalOpen(false);
    setAnnouncementFormData({ title: '', content: '', priority: 'normal' });
    onSettingsUpdate();
    
    storage.addLog({
      userId: currentUser.id,
      username: currentUser.username,
      action: 'إرسال تعميم',
      details: `تم نشر تعميم جديد بعنوان: ${newAnnouncement.title}`
    });
  };

  const deleteAnnouncement = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التعميم؟')) {
      const currentSettings = storage.getSettings();
      const next = (currentSettings.announcements || []).filter(a => a.id !== id);
      storage.setSettings({ ...currentSettings, announcements: next });
      onSettingsUpdate();
    }
  };

  const sortedDepartments = useMemo(() => {
    const list = [...departments];
    if (deptSortMode === 'alphabetical') return list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    return list;
  }, [departments, deptSortMode]);

  return (
    <div className="space-y-6">
      <div className="flex border-b dark:border-slate-800 overflow-x-auto bg-white dark:bg-slate-900 rounded-t-[2rem] px-4 no-print">
        {[
          { id: 'depts', label: 'الهيكل التنظيمي', icon: LayoutDashboard },
          { id: 'announcements', label: 'التعميمات', icon: Megaphone },
          { id: 'logs', label: 'أرشيف العمليات', icon: History }
        ].map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveSubTab(tab.id as any)} 
            className={`flex-shrink-0 flex items-center gap-3 px-8 py-5 border-b-4 transition-all relative ${
              activeSubTab === tab.id ? 'text-accent font-black' : 'border-transparent text-slate-400 font-bold'
            }`}
          >
            {activeSubTab === tab.id && (
              <motion.div layoutId="activeSubTab" className="absolute bottom-[-4px] left-0 right-0 h-1 bg-accent rounded-full" />
            )}
            <tab.icon size={20} className={activeSubTab === tab.id ? 'animate-pulse' : ''} />
            <span className="text-sm uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-b-[2.5rem] shadow-sm border dark:border-slate-800 min-h-[600px]">
        <AnimatePresence mode="wait">
          {activeSubTab === 'depts' && (
            <motion.div 
              key="depts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                 <div>
                    <h3 className="text-2xl font-black flex items-center gap-3"><Building2 className="text-accent" size={28}/> إدارة الوحدات والأقسام</h3>
                    <p className="text-sm text-slate-500 font-bold mt-1">تحديد الهيكل التنظيمي، تعيين الأقسام الداخلية وآمري الوحدات.</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border dark:border-slate-700">
                       <button onClick={() => setDeptSortMode('none')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${deptSortMode === 'none' ? 'bg-white dark:bg-slate-900 text-accent shadow-sm' : 'text-slate-400'}`}>الافتراضي</button>
                       <button onClick={() => setDeptSortMode('alphabetical')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${deptSortMode === 'alphabetical' ? 'bg-white dark:bg-slate-900 text-accent shadow-sm' : 'text-slate-400'}`}>أبجدي</button>
                    </div>
                    <div className="flex gap-3">
                       <button onClick={() => { setSectionFormData({ name: '', departmentId: '' }); setEditingSection(null); setIsSectionModalOpen(true); }} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all text-xs">+ قسم جديد</button>
                       <button onClick={() => { setEditingDept(null); setDeptFormData({ name: '', managerId: '' }); setIsDeptModalOpen(true); }} className="bg-accent text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-accent/20 hover:scale-105 transition-all text-xs">+ وحدة جديدة</button>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                 {sortedDepartments.map(d => {
                   const unitPersonnel = personnel.filter(p => p.departmentId === d.id);
                   const unitSections = sections.filter(s => s.departmentId === d.id);
                   
                   return (
                     <motion.div 
                       layout
                       key={d.id} 
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                       className="bg-gray-50 dark:bg-slate-800/40 rounded-[2.5rem] p-8 border-2 border-transparent hover:border-accent transition-all group shadow-sm hover:shadow-md"
                     >
                        <div className="flex justify-between items-center mb-8 border-b dark:border-slate-700 pb-4">
                           <div className="flex items-center gap-4">
                              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm text-accent"><Building2 size={32}/></div>
                              <div>
                                 <h4 className="text-2xl font-black dark:text-white">{d.name}</h4>
                                 <p className="text-xs font-bold text-slate-400">القوة الإجمالية: {unitPersonnel.length} فرد</p>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button onClick={() => { setEditingDept(d); setDeptFormData({ name: d.name, managerId: d.managerId || '' }); setIsDeptModalOpen(true); }} className="p-3 bg-white dark:bg-slate-800 rounded-xl text-blue-500 border dark:border-slate-700 shadow-sm hover:bg-blue-50 transition-colors"><Edit2 size={18}/></button>
                              <button onClick={() => { 
                                 if(unitPersonnel.length > 0) {
                                    alert(`لا يمكن حذف هذه الوحدة لوجود ${unitPersonnel.length} فرد منتسب إليها. يرجى نقل الأفراد أولاً.`);
                                    return;
                                 }
                                 if(unitSections.length > 0) {
                                    alert(`لا يمكن حذف هذه الوحدة لوجود ${unitSections.length} قسم تابع لها. يرجى حذف أو نقل الأقسام أولاً.`);
                                    return;
                                 }
                                 if(confirm('هل أنت متأكد من حذف الوحدة؟')) { 
                                    const updatedDepts = departments.filter(x => x.id !== d.id);
                                    setDepartments(updatedDepts); 
                                    storage.setDepartments(updatedDepts); 
                                    storage.addLog({
                                      userId: currentUser.id,
                                      username: currentUser.username,
                                      action: 'حذف وحدة',
                                      details: `تم حذف الوحدة: ${d.name}`
                                    });
                                 } 
                               }} className="p-3 bg-white dark:bg-slate-800 rounded-xl text-red-500 border dark:border-slate-700 shadow-sm hover:bg-red-50 transition-colors"><Trash size={18}/></button>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                           {unitSections.map(s => (
                              <div key={s.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-700 shadow-sm flex items-center justify-between group/sec">
                                 <div className="flex items-center gap-3">
                                    <Workflow className="text-emerald-500" size={18}/>
                                    <div className="overflow-hidden">
                                       <p className="font-black text-sm truncate">{s.name}</p>
                                       <p className="text-[10px] font-bold text-slate-400">{personnel.filter(p => p.sectionId === s.id).length} فرد</p>
                                    </div>
                                 </div>
                                 <div className="flex gap-1 opacity-0 group-hover/sec:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingSection(s); setSectionFormData({ name: s.name, departmentId: s.departmentId }); setIsSectionModalOpen(true); }} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg"><Edit2 size={14}/></button>
                                    <button onClick={() => { 
                                       const sectionPersonnel = personnel.filter(p => p.sectionId === s.id);
                                       if(sectionPersonnel.length > 0) {
                                          alert(`لا يمكن حذف هذا القسم لوجود ${sectionPersonnel.length} فرد منتسب إليه.`);
                                          return;
                                       }
                                       if(confirm('هل أنت متأكد من حذف القسم؟')) { 
                                          const next = sections.filter(x => x.id !== s.id); 
                                          setSections(next); 
                                          storage.setSections(next); 
                                          storage.addLog({
                                            userId: currentUser.id,
                                            username: currentUser.username,
                                            action: 'حذف قسم',
                                            details: `تم حذف القسم: ${s.name} من وحدة ${d.name}`
                                          });
                                       } 
                                    }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash size={14}/></button>
                                 </div>
                              </div>
                           ))}
                           {unitSections.length === 0 && (
                              <div className="col-span-full py-6 text-center text-slate-400 italic font-black bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200">
                                 لا توجد أقسام تابعة لهذه الوحدة حالياً.
                              </div>
                           )}
                        </div>
                     </motion.div>
                   );
                 })}
              </div>
            </motion.div>
          )}

          {activeSubTab === 'announcements' && (
            <motion.div 
              key="announcements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black flex items-center gap-3"><Megaphone className="text-orange-500" size={28}/> التعميمات والبلاغات</h3>
                    <p className="text-sm text-slate-500 font-bold mt-1">نشر الإعلانات الهامة والبلاغات العاجلة لكافة الوحدات الميدانية.</p>
                 </div>
                 <button onClick={() => setIsAnnouncementModalOpen(true)} className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-orange-500/20 hover:scale-105 transition-all text-xs flex items-center gap-2">
                    <Send size={16}/> نشر تعميم جديد
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {(settings.announcements || []).map(a => (
                    <div key={a.id} className={`p-6 rounded-[2rem] border-2 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group/ann ${
                       a.priority === 'urgent' ? 'border-red-200 bg-red-50/10' : 
                       a.priority === 'high' ? 'border-orange-200 bg-orange-50/10' : 'border-slate-100'
                    }`}>
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             <div className={`p-3 rounded-xl ${
                                a.priority === 'urgent' ? 'bg-red-100 text-red-600' : 
                                a.priority === 'high' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                             }`}>
                                <Bell size={20}/>
                             </div>
                             <div>
                                <h4 className="font-black text-lg">{a.title}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(a.date).toLocaleDateString('ar-EG')}</p>
                             </div>
                          </div>
                          <button onClick={() => deleteAnnouncement(a.id)} className="p-2 text-red-400 opacity-0 group-hover/ann:opacity-100 transition-opacity hover:bg-red-50 rounded-lg">
                             <Trash size={16}/>
                          </button>
                       </div>
                       <p className="text-sm text-slate-600 dark:text-slate-300 font-bold leading-relaxed">{a.content}</p>
                       <div className="mt-6 pt-4 border-t dark:border-slate-800 flex justify-between items-center">
                          <div className="flex items-center gap-2 text-slate-400">
                             <UserIcon size={14}/>
                             <span className="text-[11px] font-black italic">{a.author}</span>
                          </div>
                          <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                             a.priority === 'urgent' ? 'bg-red-500 text-white' : 
                             a.priority === 'high' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                             {a.priority === 'urgent' ? 'بلاغ عاجل' : a.priority === 'high' ? 'هام جداً' : 'عادي'}
                          </span>
                       </div>
                    </div>
                 ))}
                 {(!settings.announcements || settings.announcements.length === 0) && (
                    <div className="col-span-full py-20 text-center space-y-4 bg-slate-50 dark:bg-slate-800/20 rounded-[3rem] border-4 border-dashed border-slate-100">
                       <Bell size={48} className="mx-auto text-slate-200" />
                       <p className="text-slate-400 font-black italic">لا توجد تعميمات نشطة حالياً.</p>
                    </div>
                 )}
              </div>
            </motion.div>
          )}

          {activeSubTab === 'logs' && (
            <motion.div 
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black flex items-center gap-3"><History className="text-accent" size={28}/> أرشيف العمليات العسكري</h3>
                    <p className="text-sm text-slate-500 font-bold mt-1">مراقبة كافة الحركات المسجلة داخل المنظومة لضمان أعلى معايير الانضباط.</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 font-black text-xs">إجمالي السجلات: {logs.length}</span>
                 </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-inner">
                 <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                       <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-widest border-b dark:border-slate-700">
                          <tr>
                             <th className="px-8 py-5">المستخدم</th>
                             <th className="px-8 py-5">العملية</th>
                             <th className="px-8 py-5">التفاصيل</th>
                             <th className="px-8 py-5">الوقت والتاريخ</th>
                             <th className="px-8 py-5 text-center">الحالة</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y dark:divide-slate-800">
                          {logs.map((log) => (
                             <tr key={log.id} className="hover:bg-white dark:hover:bg-slate-800 transition-colors group">
                                <td className="px-8 py-5">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent"><UserIcon size={16}/></div>
                                      <span className="font-black text-xs">{log.username}</span>
                                   </div>
                                </td>
                                <td className="px-8 py-5">
                                   <span className="font-bold text-xs bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg text-slate-600 dark:text-slate-300">{log.action}</span>
                                </td>
                                <td className="px-8 py-5 font-bold text-xs text-slate-500 max-w-xs truncate">{log.details}</td>
                                <td className="px-8 py-5">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-slate-400 flex items-center gap-1"><Clock size={10}/> {new Date(log.timestamp).toLocaleTimeString('ar-EG')}</span>
                                      <span className="text-[11px] font-black">{new Date(log.timestamp).toLocaleDateString('ar-EG')}</span>
                                   </div>
                                </td>
                                <td className="px-8 py-5 text-center">
                                   <div className="flex items-center justify-center text-emerald-500"><ShieldCheck size={18}/></div>
                                </td>
                             </tr>
                          ))}
                          {logs.length === 0 && (
                            <tr>
                               <td colSpan={5} className="py-20 text-center text-slate-400 font-black italic">لا توجد عمليات مسجلة حتى الآن.</td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* نافذة وحدة جديدة */}
      <AnimatePresence>
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
             className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border dark:border-slate-800"
           >
              <div className="px-10 py-8 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/30">
                 <h2 className="text-2xl font-black">{editingDept ? 'تعديل الوحدة' : 'وحدة تنظيمية جديدة'}</h2>
                 <button onClick={() => setIsDeptModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all text-slate-400"><X /></button>
              </div>
              <form onSubmit={handleSaveDept} className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">اسم الوحدة / الإدارة</label>
                    <input required type="text" className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none font-bold shadow-inner" value={deptFormData.name} onChange={e => setDeptFormData({...deptFormData, name: e.target.value})} />
                 </div>
                 <div className="flex justify-end gap-3 pt-6">
                    <button type="button" onClick={() => setIsDeptModalOpen(false)} className="px-8 py-3 text-slate-400 font-bold">إلغاء</button>
                    <button type="submit" className="px-12 py-3 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20">حفظ الوحدة</button>
                 </div>
              </form>
           </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* نافذة قسم جديد */}
      <AnimatePresence>
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
             className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border dark:border-slate-800"
           >
              <div className="px-10 py-8 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/30">
                 <h2 className="text-2xl font-black">{editingSection ? 'تعديل القسم' : 'قسم داخلي جديد'}</h2>
                 <button onClick={() => setIsSectionModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all text-slate-400"><X /></button>
              </div>
              <form onSubmit={handleSaveSection} className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">اسم القسم الداخلي</label>
                    <input required type="text" className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none font-bold shadow-inner" value={sectionFormData.name} onChange={e => setSectionFormData({...sectionFormData, name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الوحدة الأم</label>
                    <select required className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none font-bold shadow-inner" value={sectionFormData.departmentId} onChange={e => setSectionFormData({...sectionFormData, departmentId: e.target.value})}>
                       <option value="">-- اختر الوحدة --</option>
                       {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                 </div>
                 <div className="flex justify-end gap-3 pt-6">
                    <button type="button" onClick={() => setIsSectionModalOpen(false)} className="px-8 py-3 text-slate-400 font-bold">إلغاء</button>
                    <button type="submit" className="px-12 py-3 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20">حفظ القسم</button>
                 </div>
              </form>
           </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* نافذة تعميم جديد */}
      <AnimatePresence>
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
             className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden border dark:border-slate-800"
           >
              <div className="px-10 py-8 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/30">
                 <h2 className="text-2xl font-black flex items-center gap-3"><Send className="text-orange-500" /> نشر تعميم جديد</h2>
                 <button onClick={() => setIsAnnouncementModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all text-slate-400"><X /></button>
              </div>
              <form onSubmit={handleSaveAnnouncement} className="p-10 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">العنوان</label>
                       <input required type="text" className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none font-bold shadow-inner" placeholder="عنوان التعميم..." value={announcementFormData.title} onChange={e => setAnnouncementFormData({...announcementFormData, title: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">خطر الأولوية</label>
                       <select required className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none font-bold shadow-inner" value={announcementFormData.priority} onChange={e => setAnnouncementFormData({...announcementFormData, priority: e.target.value as any})}>
                          <option value="normal">عادي</option>
                          <option value="high">هام جداً</option>
                          <option value="urgent">بلاغ عاجل</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">نص التعميم</label>
                    <textarea required rows={4} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none font-bold shadow-inner resize-none" placeholder="اكتب تفاصيل البلاغ هنا..." value={announcementFormData.content} onChange={e => setAnnouncementFormData({...announcementFormData, content: e.target.value})} />
                 </div>
                 
                 <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-4">
                    <AlertTriangle className="text-orange-500 shrink-0" size={24}/>
                    <p className="text-[10px] font-black text-orange-700 leading-relaxed italic">سيظهر هذا التعميم فوراً في لوحة التحكم الرئيسية لجميع المستخدمين حسب رتبهم وتصنيفاتهم الإدارية.</p>
                 </div>

                 <div className="flex justify-end gap-3 pt-6">
                    <button type="button" onClick={() => setIsAnnouncementModalOpen(false)} className="px-8 py-3 text-slate-400 font-bold">إلغاء</button>
                    <button type="submit" className="px-12 py-3 bg-orange-500 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20">نشر التعميم الآن</button>
                 </div>
              </form>
           </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};
export default AdminManager;
