
import React, { useState, useMemo } from 'react';
import { 
  History, RotateCcw, AlertCircle, TrendingUp, Save, CheckCircle, XCircle, Clock, Briefcase, Search, User as UserIcon
} from 'lucide-react';
import { AttendanceStatus, Personnel } from '../../types';
import { storage } from '../../utils/storage';

interface ArchiveTabProps {
  tempStatuses: Record<string, AttendanceStatus>;
  sessionStartTime: string | null;
  onClearSession: () => void;
  onRefresh: () => void;
  onSave: () => void;
  onUpdateStatus: (id: string, status: AttendanceStatus) => void;
  personnel: Personnel[];
}

const ArchiveTab: React.FC<ArchiveTabProps> = ({
  tempStatuses,
  sessionStartTime,
  onClearSession,
  onRefresh,
  onSave,
  onUpdateStatus,
  personnel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const activeCount = Object.keys(tempStatuses).length;
  const presentCount = Object.values(tempStatuses).filter(s => s === 'present').length;
  const absentCount = Object.values(tempStatuses).filter(s => s === 'absent').length;
  const permissionCount = Object.values(tempStatuses).filter(s => s === 'permission').length;
  const missionCount = Object.values(tempStatuses).filter(s => s === 'mission').length;

  const filteredPersonnel = useMemo(() => {
    return Object.entries(tempStatuses)
      .map(([pid, status]) => ({ person: personnel.find(p => p.id === pid)!, status }))
      .filter(item => {
        if (!item.person) return false;
        const query = searchQuery.toLowerCase();
        return item.person.name.toLowerCase().includes(query) || 
               item.person.militaryNumber.includes(query);
      });
  }, [tempStatuses, personnel, searchQuery]);

  const StatusButton = ({ status, active, onClick, icon: Icon, color }: any) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`p-2 rounded-xl transition-all ${
        active 
          ? `${color} ring-2 ring-offset-2 ring-current ring-offset-white dark:ring-offset-slate-900` 
          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
      title={status}
    >
      <Icon size={14} />
    </button>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-amber-50 dark:bg-amber-950/20 p-8 rounded-[3rem] border border-amber-100 dark:border-amber-900/40 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-500 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
          <History size={40} />
        </div>
        <div>
          <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-2">حالة الجلسة الحالية (مراجعة وتعديل لحظي)</p>
          <h4 className="text-2xl font-black text-amber-700">
            {activeCount > 0 ? `نشطة (${activeCount} فرد تم فرزهم)` : 'لا توجد جلسة نشطة حالياً'}
          </h4>
        </div>
        
        {sessionStartTime && (
          <div className="pt-6 border-t border-amber-200/50 flex items-center justify-center gap-4">
            <div className="text-right">
               <p className="text-[10px] font-black text-amber-600 uppercase">وقت البدء</p>
               <p className="text-sm font-bold text-amber-800">{new Date(sessionStartTime).toLocaleTimeString('ar-EG')}</p>
            </div>
            <div className="w-px h-10 bg-amber-200/50 mx-2"></div>
            <div className="text-left">
               <p className="text-[10px] font-black text-amber-600 uppercase">تاريخ الجلسة</p>
               <p className="text-sm font-bold text-amber-800">{new Date(sessionStartTime).toLocaleDateString('ar-EG')}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm flex flex-col items-center gap-2">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-xl"><CheckCircle size={20}/></div>
            <p className="text-2xl font-black text-emerald-600">{presentCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">حضور</p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm flex flex-col items-center gap-2">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl"><XCircle size={20}/></div>
            <p className="text-2xl font-black text-red-600">{absentCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">غياب</p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm flex flex-col items-center gap-2">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-xl"><Clock size={20}/></div>
            <p className="text-2xl font-black text-amber-600">{permissionCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">إذن/إجازة</p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm flex flex-col items-center gap-2">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-xl"><Briefcase size={20}/></div>
            <p className="text-2xl font-black text-indigo-600">{missionCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">مهمة</p>
         </div>
      </div>

      {activeCount > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm">
           <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="font-black text-sm dark:text-white flex items-center gap-2">
                   <TrendingUp size={16} className="text-accent"/> مراجعة وتعديل الأفراد
                </h5>
                <span className="text-[10px] font-bold bg-white dark:bg-slate-900 px-3 py-1 rounded-full text-slate-400">
                  تم عرض {filteredPersonnel.length} من أصل {activeCount}
                </span>
              </div>
              
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="ابحث بالاسم أو الرقم العسكري لتعديل الحالة..." 
                  className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-accent outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              </div>
           </div>
           
           <div className="max-h-96 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredPersonnel.length > 0 ? (
                filteredPersonnel.map(({ person, status }) => (
                  <div key={person.id} className="flex flex-wrap sm:flex-nowrap justify-between items-center p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-slate-50 dark:border-slate-800 group">
                    <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border-2 dark:border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {person.photo ? <img src={person.photo} alt="" className="w-full h-full object-cover"/> : <UserIcon size={20} className="text-slate-300"/>}
                      </div>
                      <div>
                        <p className="text-sm font-black dark:text-white group-hover:text-accent transition-colors">{person.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{person.rank} | {person.militaryNumber}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-inner mt-4 sm:mt-0">
                      <StatusButton 
                        status="حضور" icon={CheckCircle} color="bg-emerald-500 text-white" 
                        active={status === 'present'} onClick={() => onUpdateStatus(person.id, 'present')} 
                      />
                      <StatusButton 
                        status="غياب" icon={XCircle} color="bg-red-500 text-white" 
                        active={status === 'absent'} onClick={() => onUpdateStatus(person.id, 'absent')} 
                      />
                      <StatusButton 
                        status="إذن" icon={Clock} color="bg-amber-500 text-white" 
                        active={status === 'permission'} onClick={() => onUpdateStatus(person.id, 'permission')} 
                      />
                      <StatusButton 
                        status="مهمة" icon={Briefcase} color="bg-indigo-500 text-white" 
                        active={status === 'mission'} onClick={() => onUpdateStatus(person.id, 'mission')} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                   <p className="text-sm font-bold text-slate-400">لا توجد نتائج تطابق بحثك</p>
                </div>
              )}
           </div>
        </div>
      )}

      <div className="space-y-4 pt-6">
        <button 
           disabled={activeCount === 0}
           onClick={onSave}
           className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 disabled:opacity-30 shadow-xl shadow-emerald-600/20"
        >
           <Save size={24} /> ترحيل وحفظ التمام النهائي
        </button>

        <button 
          disabled={activeCount === 0}
          onClick={() => {
            if(confirm('هل تريد مسح الجلسة المؤقتة؟ لا يمكن التراجع عن هذا الإجراء.')) {
              onClearSession();
            }
          }}
          className="w-full bg-white dark:bg-slate-900 text-red-500 border-2 border-red-100 dark:border-red-900/30 py-5 rounded-[2rem] font-black hover:bg-red-50 transition-all flex items-center justify-center gap-4 disabled:opacity-30 disabled:grayscale shadow-sm"
        >
          <RotateCcw size={20} /> مسح الجلسة والبدء من جديد
        </button>
        
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3 text-slate-500">
            <AlertCircle size={18} className="text-accent" />
            <span className="text-[11px] font-black uppercase tracking-widest">معلومات الأرشفة والترحيل التفاعلي</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed text-right rtl">
            يمكنك الآن تعديل حالة أي فرد مباشرة من هذه القائمة قبل الترحيل النهائي. استخدم شريط البحث أعلاه للوصول السريع للأفراد المطلوب تصحيح تمامهم.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ArchiveTab;
