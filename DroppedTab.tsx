
import React from 'react';
import { 
  AlertOctagon, Settings, ShieldAlert, Users, 
  Search, ExternalLink, User as UserIcon
} from 'lucide-react';
import { Personnel, SystemSettings } from '../../types';

interface DroppedTabProps {
  personnel: Personnel[];
  settings: SystemSettings;
}

const DroppedTab: React.FC<DroppedTabProps> = ({
  personnel,
  settings
}) => {
  const droppedPersonnel = personnel.filter(p => p.status === 'dropped');

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-red-50 dark:bg-red-950/20 p-8 rounded-[3rem] border border-red-100 dark:border-red-900/40 text-center space-y-4">
        <div className="w-20 h-20 bg-red-500 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
          <AlertOctagon size={40} />
        </div>
        <div>
          <p className="text-[11px] font-black text-red-500 uppercase tracking-widest mb-1">إجمالي الأفراد المنقطعين</p>
          <h4 className="text-4xl font-black text-red-700">{droppedPersonnel.length}</h4>
        </div>
        <p className="text-[10px] font-bold text-red-600/60 uppercase tracking-tighter">يتم مراقبة هؤلاء الأفراد بشكل دوري من قبل الإدارة</p>
      </div>

      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-4 shadow-inner">
        <div className="flex items-center gap-3 text-slate-500">
          <Settings size={18} className="text-red-500 animate-spin-slow" />
          <span className="text-[11px] font-black uppercase tracking-widest">معايير الانقطاع الحالية</span>
        </div>
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border dark:border-slate-800">
          <div className="text-right">
             <p className="text-sm font-black dark:text-white">حد الغياب المسموح</p>
             <p className="text-[10px] font-bold text-slate-400">تجاوز هذا العدد يؤدي للنقل التلقائي</p>
          </div>
          <span className="bg-red-500 text-white px-5 py-2 rounded-2xl text-sm font-black shadow-lg shadow-red-500/20">{settings.absenceThreshold || 3} أيام</span>
        </div>
      </div>

      <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
             <h5 className="text-sm font-black flex items-center gap-2 dark:text-white">
                <Users size={16} className="text-red-500"/> قائمة الأفراد
             </h5>
          </div>

          <div className="space-y-3">
             {droppedPersonnel.length > 0 ? (
                droppedPersonnel.map(p => (
                   <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-red-200 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden border flex items-center justify-center">
                            {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover"/> : <UserIcon size={24} className="text-slate-300"/>}
                         </div>
                         <div className="text-right">
                            <h6 className="text-sm font-black dark:text-white">{p.name}</h6>
                            <p className="text-[10px] font-bold text-slate-400">{p.rank} | #{p.militaryNumber}</p>
                         </div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-950/40 text-red-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-red-100 dark:border-red-900/30">
                         منقطع عن العمل
                      </div>
                   </div>
                ))
             ) : (
                <div className="text-center py-10 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-[2rem] border-2 border-dashed border-emerald-100 dark:border-emerald-900/20">
                   <p className="text-xs font-bold text-emerald-600 italic">لا يوجد أفراد منقطعين حالياً. نظام العمل مستقر ✅</p>
                </div>
             )}
          </div>
      </div>
    </div>
  );
};

export default DroppedTab;
