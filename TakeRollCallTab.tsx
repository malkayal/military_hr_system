
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UsersRound, Workflow, Undo2, UserCheck, 
  CalendarSearch, Play, CheckCircle2, Search,
  CalendarRange, Building2, Calendar, Timer as TimerIcon,
  PlusCircle, FilePlus2, Save, X, ChevronRight, User as UserIcon,
  TrendingUp, CheckCircle, XCircle, Briefcase, Clock
} from 'lucide-react';
import { Personnel, Department, Section, AttendanceStatus, AttendanceRecord, User, WorkSchedule } from '../../types';

interface TakeRollCallTabProps {
  personnel: Personnel[];
  departments: Department[];
  sections: Section[];
  workSchedules: WorkSchedule[];
  attendanceHistory: AttendanceRecord[];
  takeDate: string;
  setTakeDate: (date: string) => void;
  selectedDeptId: string;
  setSelectedDeptId: (id: string) => void;
  selectedSectionId: string;
  setSelectedSectionId: (id: string) => void;
  rollCallMode: 'all' | 'scheduled';
  setRollCallMode: (mode: 'all' | 'scheduled') => void;
  isTakingMode: boolean;
  setIsTakingMode: (mode: boolean) => void;
  tempStatuses: Record<string, AttendanceStatus>;
  setTempStatuses: React.Dispatch<React.SetStateAction<Record<string, AttendanceStatus>>>;
  lastAction: { id: string; status: AttendanceStatus } | null;
  setLastAction: (action: { id: string; status: AttendanceStatus } | null) => void;
  viewMode: 'queue' | 'grid';
  setViewMode: (mode: 'queue' | 'grid') => void;
  currentUser: User;
  onSave: () => void;
  isScheduledOnDate: (person: Personnel, date: string) => boolean;
  getPersonnelScheduleInfo: (person: Personnel) => { name: string; type: string };
  settings: any;
}

const TakeRollCallTab: React.FC<TakeRollCallTabProps> = ({
  personnel, departments, sections, workSchedules, attendanceHistory,
  takeDate, setTakeDate, selectedDeptId, setSelectedDeptId,
  selectedSectionId, setSelectedSectionId, rollCallMode, setRollCallMode,
  isTakingMode, setIsTakingMode, tempStatuses, setTempStatuses,
  lastAction, setLastAction, viewMode, setViewMode, currentUser,
  onSave, isScheduledOnDate, getPersonnelScheduleInfo, settings
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const targetPersonnel = useMemo(() => {
    return personnel.filter(p => {
      const matchesDept = selectedDeptId === 'all' || p.departmentId === selectedDeptId;
      const matchesSection = selectedSectionId === 'all' || p.sectionId === selectedSectionId;
      const matchesSearch = p.name.includes(searchQuery) || (p.militaryNumber && p.militaryNumber.includes(searchQuery));
      const matchesSchedule = rollCallMode === 'all' || isScheduledOnDate(p, takeDate);
      return matchesDept && matchesSection && matchesSearch && p.status !== 'dropped' && matchesSchedule;
    }).sort((a, b) => {
       const idxA = settings.ranks.indexOf(a.rank);
       const idxB = settings.ranks.indexOf(b.rank);
       return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  }, [personnel, selectedDeptId, selectedSectionId, searchQuery, settings.ranks, rollCallMode, isScheduledOnDate, takeDate]);

  const archivedForce = useMemo(() => targetPersonnel.filter(p => tempStatuses[p.id]), [targetPersonnel, tempStatuses]);
  const remainingForce = useMemo(() => targetPersonnel.filter(p => !tempStatuses[p.id]), [targetPersonnel, tempStatuses]);

  const handleAction = useCallback((id: string, status: AttendanceStatus) => {
    setLastAction({ id, status: tempStatuses[id] || null as any });
    setTempStatuses(prev => ({ ...prev, [id]: status }));
  }, [tempStatuses, setTempStatuses, setLastAction]);

  const undoLastAction = useCallback(() => {
    if (!lastAction) return;
    const { id, status } = lastAction;
    setTempStatuses(prev => {
      const next = { ...prev };
      if (status === null) delete next[id];
      else next[id] = status;
      return next;
    });
    setLastAction(null);
  }, [lastAction, setTempStatuses, setLastAction]);

  const markAllRemainingAsPresent = () => {
    if (confirm('هل أنت متأكد من تسجيل جميع الأفراد المتبقين كحضور؟')) {
      const updates: Record<string, AttendanceStatus> = {};
      remainingForce.forEach(p => { updates[p.id] = 'present'; });
      setTempStatuses(prev => ({ ...prev, ...updates }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {!isTakingMode ? (
        /* Setup Phase UI */
        <div className="space-y-10">
          <div className="relative group no-print">
             <input 
               type="text" placeholder="ابحث بالاسم لفرز فرد محدد..." 
               className="w-full py-4 md:py-6 px-10 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl text-center font-black text-xl shadow-sm focus:border-accent outline-none transition-all"
               value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
             />
             <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] border dark:border-slate-800 shadow-2xl flex flex-col space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in zoom-in-95 duration-500 relative z-10">
                <div className="relative">
                   <div className="w-40 h-40 md:w-56 md:h-56 bg-white dark:bg-slate-800 rounded-[3rem] flex items-center justify-center text-accent border-4 border-slate-100 dark:border-slate-700 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                      <CalendarSearch size={64} className="md:w-28 md:h-28" />
                   </div>
                   {targetPersonnel.length > 0 && (
                     <div className="absolute -top-4 -right-4 bg-accent text-white w-20 h-20 rounded-full flex flex-col items-center justify-center font-black shadow-2xl border-4 border-white dark:border-slate-900 animate-bounce">
                        <span className="text-3xl leading-none">{targetPersonnel.length}</span>
                        <span className="text-[10px] uppercase tracking-tighter">فرد</span>
                     </div>
                   )}
                </div>

                <div className="space-y-10 px-4 w-full max-w-2xl mx-auto">
                    <div className="space-y-2">
                       <h3 className="text-3xl md:text-5xl font-black dark:text-white tracking-tighter">إعدادات جلسة التمام</h3>
                       <p className="text-slate-600 dark:text-slate-400 font-bold text-lg italic">قم بتحديد النطاق ونوع الفرز لبدء عملية الحصر</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-3 text-right">
                          <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mr-6">الإدارة / الوحدة</label>
                          <select className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-transparent focus:border-accent font-black text-lg outline-none transition-all shadow-inner appearance-none cursor-pointer" 
                            value={selectedDeptId} onChange={e => { setSelectedDeptId(e.target.value); setSelectedSectionId('all'); }}>
                             <option value="all">كافة التشكيلات العسكرية</option>
                             {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                       </div>
                       <div className="space-y-3 text-right">
                          <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] mr-6">القسم الداخلي</label>
                          <select className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-transparent focus:border-accent font-black text-lg outline-none transition-all shadow-inner appearance-none cursor-pointer disabled:opacity-30" 
                            value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)} disabled={selectedDeptId === 'all'}>
                             <option value="all">كافة الأقسام الداخلية</option>
                             {sections.filter(s => s.departmentId === selectedDeptId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       {[
                         { id: 'all', label: 'تمام كامل القوة', icon: UsersRound, sub: 'فرز جميع الأفراد المسجلين' },
                         { id: 'scheduled', label: 'حسب قيام العمل', icon: TimerIcon, sub: 'فرز المكلفين بالدوام اليوم' }
                       ].map(m => (
                          <button key={m.id} onClick={() => setRollCallMode(m.id as any)} className={`group relative p-8 rounded-[2.5rem] border-4 transition-all duration-500 flex flex-col items-center gap-4 ${rollCallMode === m.id ? 'bg-accent border-accent text-white shadow-2xl shadow-accent/40 scale-105' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-accent/30'}`}>
                             <m.icon size={48} className={rollCallMode === m.id ? 'text-white' : 'text-slate-300 group-hover:text-accent transition-colors'}/>
                             <div className="text-center">
                               <span className="font-black text-xl block mb-1">{m.label}</span>
                               <span className={`text-[10px] font-bold uppercase tracking-widest ${rollCallMode === m.id ? 'text-white/70' : 'text-slate-600 dark:text-slate-400'}`}>{m.sub}</span>
                             </div>
                             {rollCallMode === m.id && <div className="absolute -top-3 -right-3 bg-white text-accent p-2 rounded-full shadow-lg"><CheckCircle2 size={20}/></div>}
                          </button>
                       ))}
                    </div>

                    <button 
                      onClick={() => {
                        if (targetPersonnel.length === 0) return alert('لا يوجد أفراد للمطابقة في هذا الاختيار.');
                        
                        // تحقق من وجود نظام قيام عمل للأقسام المحددة (فقط عند اختيار إدارة محددة)
                        if (selectedDeptId !== 'all') {
                          const relevantSections = selectedSectionId === 'all' 
                            ? sections.filter(s => s.departmentId === selectedDeptId)
                            : sections.filter(s => s.id === selectedSectionId);

                          const missingSchedules = relevantSections.filter(section => 
                            !workSchedules.some(sched => sched.sectionId === section.id)
                          );

                          if (missingSchedules.length > 0) {
                            const sectionNames = missingSchedules.map(s => s.name).join('، ');
                            return alert(`عذراً، لا يمكن بدء التمام. الأقسام التالية تفتقر لنظام قيام عمل معرف: (${sectionNames}). يرجى إنشاء جداول قيام عمل لهذه الأقسام أولاً لتتمكن من المتابعة.`);
                          }
                        }

                        const alreadyArchived = attendanceHistory.some(r => r.date === takeDate);
                        if (alreadyArchived && !confirm(`تنبيه: يوجد تمام مؤرشف مسبقاً لهذا التاريخ. هل تريد البدء مجدداً؟`)) return;
                        setIsTakingMode(true);
                      }} 
                      className="bg-accent text-white px-14 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-accent/40 hover:scale-[1.02] active:scale-95 transition-all w-full flex items-center justify-center gap-4 group"
                    >
                       <Play size={26} className="group-hover:translate-x-1 transition-transform" />
                       ابدأ عملية الفرز الآن
                    </button>
                </div>
              </div>
          </div>
        </div>
      ) : (
        /* Active Roll Call UI */
        <div className="space-y-10 animate-in slide-in-from-bottom-8">
           <div className="flex items-center justify-between px-4 border-b dark:border-slate-800 pb-8">
              <div className="flex flex-col gap-4 flex-1">
                <h4 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-4">
                   <Workflow size={24} className="text-accent"/> القوة المتبقية للفرز <span className="bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full text-lg">{remainingForce.length}</span>
                </h4>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                   <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${(archivedForce.length / (targetPersonnel.length || 1)) * 100}%` }}></div>
                </div>
              </div>
              <div className="flex gap-3 mr-6">
                 <button onClick={() => setViewMode(viewMode === 'queue' ? 'grid' : 'queue')} className="flex items-center gap-3 px-6 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    {viewMode === 'queue' ? <UsersRound size={16}/> : <Workflow size={16}/>} {viewMode === 'queue' ? 'عرض الشبكة' : 'عرض الطابور'}
                 </button>
                 {lastAction && (
                   <button onClick={undoLastAction} className="flex items-center gap-3 px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 rounded-xl text-xs font-black hover:bg-accent hover:text-white transition-all">
                      <Undo2 size={16}/> تراجع
                   </button>
                 )}
                 <button onClick={markAllRemainingAsPresent} className="flex items-center gap-3 px-6 py-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl text-xs font-black hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                    <UserCheck size={16}/> تسجيل الكل حضور
                 </button>
              </div>
           </div>

           {remainingForce.length > 0 ? (
             viewMode === 'queue' ? (
                /* Interactive Queue (Swipe Card) */
                <div className="flex items-center justify-center py-10 relative overflow-hidden">
                   <AnimatePresence mode="popLayout">
                      {remainingForce.slice(0, 1).map(p => {
                         const schedule = getPersonnelScheduleInfo(p);
                         return (
                           <motion.div 
                             key={p.id}
                             initial={{ scale: 0.8, opacity: 0, x: -100 }}
                             animate={{ scale: 1, opacity: 1, x: 0 }}
                             exit={{ scale: 0.8, opacity: 0, x: 100 }}
                             drag="x"
                             dragConstraints={{ left: -200, right: 200 }}
                             onDragEnd={(_, info) => {
                               if (info.offset.x > 100) handleAction(p.id, 'present');
                               else if (info.offset.x < -100) handleAction(p.id, 'absent');
                             }}
                             className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[4rem] p-12 shadow-2xl border-2 dark:border-slate-800 cursor-grab active:cursor-grabbing relative overflow-hidden"
                           >
                              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16"></div>
                              <div className="flex flex-col items-center text-center space-y-8 relative z-10">
                                 <div className="w-40 h-40 rounded-[3rem] bg-slate-50 dark:bg-slate-800 overflow-hidden border-4 border-slate-100 dark:border-slate-700 shadow-xl flex items-center justify-center">
                                    {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover"/> : <UserIcon size={64} className="text-slate-300"/>}
                                 </div>
                                 <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-2">
                                       <span className="bg-accent/10 text-accent px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{p.rank}</span>
                                       <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">#{p.militaryNumber}</span>
                                    </div>
                                    <h3 className="text-3xl font-black dark:text-white">{p.name}</h3>
                                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                                       <div className={`p-1.5 rounded-lg ${schedule.type === 'overnight' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                          {schedule.type === 'overnight' ? <Moon size={14}/> : <Sun size={14}/>}
                                       </div>
                                       {schedule.name}
                                    </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-4 pt-4 w-full">
                                    <button onClick={() => handleAction(p.id, 'present')} className="py-4 bg-emerald-50 text-emerald-600 rounded-[2rem] font-black flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><CheckCircle size={18}/> حضور</button>
                                    <button onClick={() => handleAction(p.id, 'absent')} className="py-4 bg-red-50 text-red-600 rounded-[2rem] font-black flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-sm"><XCircle size={18}/> غياب</button>
                                    <button onClick={() => handleAction(p.id, 'permission')} className="py-4 bg-amber-50 text-amber-600 rounded-[2rem] font-black flex items-center justify-center gap-2 hover:bg-amber-600 hover:text-white transition-all shadow-sm"><Clock size={18}/> إذن</button>
                                    <button onClick={() => handleAction(p.id, 'mission')} className="py-4 bg-indigo-50 text-indigo-600 rounded-[2rem] font-black flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Briefcase size={18}/> مهمة</button>
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">اسحب البطاقة يميناً أو يساراً</p>
                              </div>
                           </motion.div>
                         );
                      })}
                   </AnimatePresence>
                </div>
             ) : (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                   {remainingForce.map(p => (
                      <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border dark:border-slate-800 shadow-sm flex flex-col items-center gap-4 hover:shadow-xl transition-all group">
                         <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800 overflow-hidden border-2 dark:border-slate-700 flex items-center justify-center">
                            {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover"/> : <UserIcon size={32} className="text-slate-300"/>}
                         </div>
                         <div className="text-center w-full">
                            <h5 className="font-black text-sm dark:text-white truncate">{p.name}</h5>
                            <p className="text-[10px] font-bold text-slate-400">{p.rank} | #{p.militaryNumber}</p>
                         </div>
                         <div className="grid grid-cols-2 w-full gap-2 mt-auto">
                            <button onClick={() => handleAction(p.id, 'present')} className="py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] hover:bg-emerald-600 hover:text-white transition-all">حضور</button>
                            <button onClick={() => handleAction(p.id, 'absent')} className="py-2.5 bg-red-50 text-red-600 rounded-xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all">غياب</button>
                            <button onClick={() => handleAction(p.id, 'permission')} className="py-2.5 bg-amber-50 text-amber-600 rounded-xl font-black text-[10px] hover:bg-amber-600 hover:text-white transition-all">إذن</button>
                            <button onClick={() => handleAction(p.id, 'mission')} className="py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] hover:bg-indigo-600 hover:text-white transition-all">مهمة</button>
                         </div>
                      </div>
                   ))}
                </div>
             )
           ) : (
             <div className="text-center py-20 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30">
                   <CheckCircle2 size={48} />
                </div>
                <h3 className="text-3xl font-black dark:text-white">اكتمل الفرز!</h3>
                <p className="text-slate-500 font-bold mt-2">تم حصر جميع القوة المستهدفة لهذا اليوم.</p>
                <button onClick={onSave} className="mt-8 px-12 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-emerald-700 transition-all">حفظ وترحيل التمام الآن</button>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

const Sun = ({ size, className }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
);

const Moon = ({ size, className }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);

export default TakeRollCallTab;
