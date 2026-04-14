
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '../utils/storage';
import { Leave, User, UserRole } from '../types';
import { LEAVE_TYPES } from '../constants';
import { useDebounce } from '../hooks/useDebounce';
import { 
  Calendar, Plus, CheckCircle, XCircle, Clock, Printer, 
  Timer, User as UserIcon, Search, X, 
  AlertTriangle, List, CalendarDays, CalendarCheck,
  ShieldCheck, BarChart3, PieChart as PieChartIcon,
  Activity, TrendingUp, History, UserCheck,
  QrCode as QrIcon, Fingerprint, ChevronRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';

interface LeavesManagerProps {
  currentUser: User;
}

const LeavesManager: React.FC<LeavesManagerProps> = ({ currentUser }) => {
  const [leaves, setLeaves] = useState<Leave[]>(storage.getLeaves());
  const personnel = storage.getPersonnel();
  const settings = storage.getSettings();
  const departments = storage.getDepartments();
  
  // Tabs State (Enhanced)
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'analytics' | 'balances'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);

  const canManageLeaves = currentUser.role === UserRole.SUPERVISOR || currentUser.permissions.canEdit;

  // --- Logic Extensions ---

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const person = personnel.find(p => p.id === l.personnelId);
      const matchesSearch = person?.name.includes(debouncedSearchQuery) || person?.militaryNumber.includes(debouncedSearchQuery);
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leaves, personnel, debouncedSearchQuery, statusFilter]);

  const handleStatusChange = (id: string, status: 'approved' | 'rejected', reason?: string) => {
    const updated = leaves.map(l => l.id === id ? { ...l, status, rejectionReason: reason } : l);
    setLeaves(updated);
    storage.setLeaves(updated);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* 1. Header Navigation Tabs */}
      <div className="flex flex-wrap md:flex-nowrap bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border dark:border-slate-800 w-full md:w-fit no-print mx-auto lg:mr-0 gap-1 md:gap-0">
         <button onClick={() => setActiveSubTab('list')} className={`flex-1 md:flex-none px-4 md:px-10 py-3 rounded-xl font-black text-[10px] md:text-xs flex items-center justify-center gap-2 transition-all ${activeSubTab === 'list' ? 'bg-accent text-white shadow-lg' : 'text-slate-400'}`}><List size={16}/> قائمة الطلبات</button>
         <button onClick={() => setActiveSubTab('analytics')} className={`flex-1 md:flex-none px-4 md:px-10 py-3 rounded-xl font-black text-[10px] md:text-xs flex items-center justify-center gap-2 transition-all ${activeSubTab === 'analytics' ? 'bg-accent text-white shadow-lg' : 'text-slate-400'}`}><BarChart3 size={16}/> الإحصائيات</button>
         <button onClick={() => setActiveSubTab('balances')} className={`flex-1 md:flex-none px-4 md:px-10 py-3 rounded-xl font-black text-[10px] md:text-xs flex items-center justify-center gap-2 transition-all ${activeSubTab === 'balances' ? 'bg-accent text-white shadow-lg' : 'text-slate-400'}`}><UserCheck size={16}/> الأرصدة</button>
      </div>

      {/* 2. Top Stats Bar (Active only on list) */}
      {activeSubTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-800 flex items-center justify-between group hover:border-amber-500 transition-all">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">بانتظار الموافقة</p>
                <p className="text-4xl font-black text-amber-500">{leaves.filter(l => l.status === 'pending').length}</p>
             </div>
             <div className="p-5 bg-amber-50 rounded-3xl text-amber-500 group-hover:scale-110 transition-transform"><Clock size={28}/></div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-800 flex items-center justify-between group hover:border-emerald-500 transition-all">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجازات نشطة حالياً</p>
                <p className="text-4xl font-black text-emerald-500">
                  {leaves.filter(l => l.status === 'approved' && new Date().toISOString().split('T')[0] >= l.startDate && new Date().toISOString().split('T')[0] <= l.endDate).length}
                </p>
             </div>
             <div className="p-5 bg-emerald-50 rounded-3xl text-emerald-500 group-hover:scale-110 transition-transform"><CalendarCheck size={28}/></div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-800 flex items-center justify-between group hover:border-purple-500 transition-all">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">أذونات خروج اليوم</p>
                <p className="text-4xl font-black text-purple-500">{leaves.filter(l => l.type === 'إذن خروج' && l.status === 'approved' && l.startDate === new Date().toISOString().split('T')[0]).length}</p>
             </div>
             <div className="p-5 bg-purple-50 rounded-3xl text-purple-500 group-hover:scale-110 transition-transform"><Timer size={28}/></div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border dark:border-slate-800 flex items-center justify-between group hover:border-accent transition-all">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي الحركات</p>
                <p className="text-4xl font-black dark:text-white">{leaves.length}</p>
             </div>
             <div className="p-5 bg-slate-50 rounded-3xl text-slate-400 group-hover:scale-110 transition-transform"><Activity size={28}/></div>
          </div>
        </div>
      )}

      {/* 3. Main Content Rendering */}
      
      {activeSubTab === 'list' && (
        <div className="space-y-6">
           {/* Filters Bar */}
           <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6 no-print">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:flex-1">
                 <div className="relative w-full sm:flex-1 max-w-md group">
                    <Search className="absolute right-4 top-3.5 text-slate-300 group-focus-within:text-accent transition-colors" size={18}/>
                    <input 
                      type="text" placeholder="البحث في سجل الإجازات..."
                      className="w-full pr-12 pl-4 py-3.5 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none font-bold text-sm focus:border-accent transition-all"
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    />
                 </div>
                 <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl border dark:border-slate-700">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                      <button 
                        key={f} onClick={() => setStatusFilter(f)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${statusFilter === f ? 'bg-white dark:bg-slate-700 shadow-sm text-accent' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {f === 'all' ? 'الكل' : f === 'pending' ? 'معلق' : f === 'approved' ? 'مقبول' : 'مرفوض'}
                      </button>
                    ))}
                 </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto px-8 py-3.5 bg-accent text-white rounded-2xl font-black text-sm shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18}/> طلب جديد
              </button>
           </div>

           {/* Leaves Table */}
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-right border-collapse">
                    <thead>
                       <tr className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الفرد</th>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">النوع</th>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الفترة</th>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الحالة</th>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الإجراءات</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                       {filteredLeaves.map(leave => {
                          const person = personnel.find(p => p.id === leave.personnelId);
                          return (
                             <tr key={leave.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="p-6">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                                         <UserIcon size={20}/>
                                      </div>
                                      <div>
                                         <p className="font-black text-sm dark:text-white">{person?.name || '---'}</p>
                                         <p className="text-[10px] font-bold text-slate-400">{person?.rank} | {person?.militaryNumber}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="p-6">
                                   <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-600 dark:text-slate-400">
                                      {leave.type}
                                   </span>
                                </td>
                                <td className="p-6">
                                   <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                      <Calendar size={14} className="text-slate-300"/>
                                      <span className="text-xs font-bold">{leave.startDate}</span>
                                      <ChevronRight size={12} className="text-slate-300"/>
                                      <span className="text-xs font-bold">{leave.endDate}</span>
                                   </div>
                                </td>
                                <td className="p-6">
                                   <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black ${
                                      leave.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                      leave.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                      'bg-amber-50 text-amber-600'
                                   }`}>
                                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                         leave.status === 'approved' ? 'bg-emerald-500' :
                                         leave.status === 'rejected' ? 'bg-red-500' :
                                         'bg-amber-500'
                                      }`}/>
                                      {leave.status === 'approved' ? 'مقبول' : leave.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                                   </div>
                                </td>
                                <td className="p-6">
                                   <div className="flex items-center gap-2">
                                      {leave.status === 'pending' && canManageLeaves && (
                                         <>
                                            <button onClick={() => handleStatusChange(leave.id, 'approved')} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><CheckCircle size={20}/></button>
                                            <button onClick={() => { handleStatusChange(leave.id, 'rejected'); }} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><XCircle size={20}/></button>
                                         </>
                                      )}
                                      <button onClick={() => { setSelectedLeave(leave); setIsPreviewOpen(true); }} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-200 transition-all shadow-sm"><Printer size={20}/></button>
                                   </div>
                                </td>
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* 4. Modals & Previews */}
      <AnimatePresence>
        {isPreviewOpen && selectedLeave && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm no-print"
          >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
             >
                {/* Modal Header */}
                <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/30">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 text-accent rounded-xl"><Printer size={20}/></div>
                      <h2 className="text-xl font-black dark:text-white">معاينة تصريح الإجازة</h2>
                   </div>
                   <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all text-slate-400"><X size={24}/></button>
                </div>

                {/* Print Content Area */}
                <div className="flex-1 overflow-y-auto p-12 space-y-10" id="leave-print-area">
                   {/* Official Header */}
                   <div className="flex justify-between items-start border-b-2 border-slate-900 dark:border-white pb-8">
                      <div className="space-y-1 text-[10px] font-black uppercase text-slate-500">
                         {settings.orgHierarchy.map((h, i) => <p key={i}>{h}</p>)}
                         <p className="pt-4 text-slate-900 dark:text-white text-xs">الرقم: {selectedLeave.id.split('-')[0].toUpperCase()}</p>
                         <p className="text-slate-900 dark:text-white text-xs">التاريخ: {new Date(selectedLeave.createdAt).toLocaleDateString('ar-EG')}</p>
                      </div>
                      <div className="text-center space-y-2">
                         <img src={settings.logo} className="w-20 h-20 mx-auto object-contain" />
                         <p className="text-sm font-black dark:text-white">تصريح {selectedLeave.type}</p>
                      </div>
                      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200">
                         <QrIcon size={64} className="text-slate-400 opacity-50" />
                      </div>
                   </div>

                   {/* Body */}
                   <div className="space-y-6">
                      <p className="text-sm font-bold leading-loose dark:text-slate-300">
                         يُصرح لـ {personnel.find(p=>p.id===selectedLeave.personnelId)?.rank} / <span className="font-black text-slate-900 dark:text-white">{personnel.find(p=>p.id===selectedLeave.personnelId)?.name}</span>، 
                         بالتمتع بـ <span className="font-black underline">{selectedLeave.type}</span>، 
                         وذلك اعتباراً من تاريخ <span className="font-black">{selectedLeave.startDate}</span> وحتى تاريخ <span className="font-black">{selectedLeave.endDate}</span>.
                      </p>
                      
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border dark:border-slate-700 space-y-4">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><History size={14}/> ملاحظات إضافية</h4>
                         <p className="text-xs font-bold text-slate-700 dark:text-slate-400">{selectedLeave.reason || 'لا توجد ملاحظات إضافية مسجلة.'}</p>
                      </div>
                   </div>

                   {/* Signatures */}
                   <div className="grid grid-cols-2 gap-20 pt-12">
                      {settings.signatureTitles.slice(0, 2).map((title, i) => (
                         <div key={i} className="text-center space-y-16">
                            <p className="text-xs font-black dark:text-white">{title}</p>
                            <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
                               <p className="text-[10px] text-slate-400 font-bold italic">التوقيع والختم الرسمي</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                {/* Modal Footer */}
                <div className="p-8 border-t dark:border-slate-800 flex justify-end gap-4 bg-gray-50/50 dark:bg-slate-800/30">
                   <button onClick={() => setIsPreviewOpen(false)} className="px-8 py-3 text-slate-500 font-black text-sm">إلغاء</button>
                   <button onClick={() => window.print()} className="px-10 py-3 bg-accent text-white rounded-2xl font-black text-sm shadow-xl shadow-accent/20 flex items-center gap-2">
                      <Printer size={18}/> طباعة التصريح
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeavesManager;
