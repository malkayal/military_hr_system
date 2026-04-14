
import React, { useState, useMemo } from 'react';
import { Personnel, User, Department, Promotion } from '../types';
import { storage } from '../utils/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Award, Calendar, Search, 
  Filter, CheckCircle2, ChevronRight, 
  ArrowUpCircle, Info, Hash, UserCircle, 
  Clock, ShieldCheck, AlertCircle, Settings2, X, Edit3
} from 'lucide-react';

interface PromotionsManagerProps {
  currentUser: User;
}

const PromotionsManager: React.FC<PromotionsManagerProps> = ({ currentUser }) => {
  const [personnel, setPersonnel] = useState<Personnel[]>(storage.getPersonnel());
  const [departments] = useState<Department[]>(storage.getDepartments());
  const [settings] = useState(storage.getSettings());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEligible, setFilterEligible] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // Promotion Form State
  const [promotionData, setPromotionData] = useState({
    newRank: '',
    orderNumber: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Service Dates Form State
  const [serviceDates, setServiceDates] = useState({
    joinDate: '',
    lastPromotionDate: ''
  });

  const getPromotionInfo = (person: Personnel) => {
    if (!person.lastPromotionDate) return { eligible: false, remaining: 'يرجى ضبط التاريخ', percent: 0, missing: true };
    
    const last = new Date(person.lastPromotionDate);
    const next = new Date(last.getFullYear() + 4, last.getMonth(), last.getDate());
    const now = new Date();
    
    const diff = next.getTime() - now.getTime();
    const isEligible = diff <= 0;
    
    const totalDays = 4 * 365.25;
    const elapsedDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
    const percent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

    if (isEligible) return { eligible: true, remaining: 'مستحق حالياً', percent: 100, missing: false };

    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    
    return {
      eligible: false,
      remaining: `${years} سنة و ${months} شهر`,
      percent,
      missing: false
    };
  };

  const filteredPersonnel = useMemo(() => {
    return personnel.filter(p => {
      const matchesSearch = p.name.includes(searchQuery) || (p.militaryNumber && p.militaryNumber.includes(searchQuery));
      const info = getPromotionInfo(p);
      const matchesEligibility = !filterEligible || info.eligible;
      return matchesSearch && matchesEligibility;
    }).sort((a, b) => {
        const idxA = settings.ranks.indexOf(a.rank);
        const idxB = settings.ranks.indexOf(b.rank);
        if (idxA !== idxB) return idxA - idxB;
        if (!a.lastPromotionDate) return 1;
        if (!b.lastPromotionDate) return -1;
        return (a.lastPromotionDate).localeCompare(b.lastPromotionDate);
    });
  }, [personnel, searchQuery, filterEligible, settings.ranks]);

  const stats = useMemo(() => {
    const eligibleCount = personnel.filter(p => getPromotionInfo(p).eligible).length;
    const missingCount = personnel.filter(p => !p.lastPromotionDate).length;
    const recentlyPromoted = personnel.filter(p => {
        if (!p.lastPromotionDate) return false;
        const last = new Date(p.lastPromotionDate);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return last >= monthAgo;
    }).length;

    return {
      total: personnel.length,
      eligible: eligibleCount,
      recent: recentlyPromoted,
      missing: missingCount
    };
  }, [personnel]);

  const handleOpenPromoteModal = (person: Personnel) => {
    setSelectedPersonnel(person);
    const currentRankIndex = settings.ranks.indexOf(person.rank);
    const nextRank = currentRankIndex > 0 ? settings.ranks[currentRankIndex - 1] : person.rank;
    
    setPromotionData({
      newRank: nextRank,
      orderNumber: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenDateModal = (person: Personnel) => {
    setSelectedPersonnel(person);
    setServiceDates({
      joinDate: person.joinDate || '',
      lastPromotionDate: person.lastPromotionDate || ''
    });
    setIsDateModalOpen(true);
  };

  const handleUpdateDates = () => {
    if (!selectedPersonnel) return;

    const updatedPersonnel = personnel.map(p => {
      if (p.id === selectedPersonnel.id) {
        return {
          ...p,
          joinDate: serviceDates.joinDate,
          lastPromotionDate: serviceDates.lastPromotionDate
        };
      }
      return p;
    });

    setPersonnel(updatedPersonnel);
    storage.setPersonnel(updatedPersonnel);
    storage.addLog({
      userId: currentUser.id,
      username: currentUser.username,
      action: 'تعديل تواريخ الخدمة',
      details: `تم تحديث تواريخ الخدمة للفرد ${selectedPersonnel.name}`
    });

    setIsDateModalOpen(false);
    setSelectedPersonnel(null);
  };

  const handlePromote = () => {
    if (!selectedPersonnel) return;
    if (!promotionData.orderNumber) {
        alert('يرجى إدخال رقم الأمر العسكري');
        return;
    }

    const newPromotion: Promotion = {
      rank: selectedPersonnel.rank,
      date: promotionData.date,
      orderNumber: promotionData.orderNumber
    };

    const updatedPersonnel = personnel.map(p => {
      if (p.id === selectedPersonnel.id) {
        return {
          ...p,
          rank: promotionData.newRank,
          lastPromotionDate: promotionData.date,
          promotionHistory: [newPromotion, ...(p.promotionHistory || [])]
        };
      }
      return p;
    });

    setPersonnel(updatedPersonnel);
    storage.setPersonnel(updatedPersonnel);
    storage.addLog({
      userId: currentUser.id,
      username: currentUser.username,
      action: 'ترقية فرد',
      details: `تم ترقية ${selectedPersonnel.name} من ${selectedPersonnel.rank} إلى ${promotionData.newRank} (أمر رقم: ${promotionData.orderNumber})`
    });

    setIsModalOpen(false);
    setSelectedPersonnel(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* 1. Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي القوة', value: stats.total, icon: UserCircle, color: 'bg-blue-500' },
          { label: 'مستحبين للترقية', value: stats.eligible, icon: Award, color: 'bg-emerald-500' },
          { label: 'تواريخ غير مكتملة', value: stats.missing, icon: Clock, color: 'bg-red-500' },
          { label: 'ترقيات الشهر', value: stats.recent, icon: TrendingUp, color: 'bg-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm flex items-center gap-6 group hover:scale-[1.02] transition-all">
            <div className={`p-4 rounded-2xl text-white ${stat.color} shadow-lg shrink-0`}>
              <stat.icon size={24}/>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2 truncate">{stat.label}</p>
              <h4 className="text-2xl font-black dark:text-white">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-sm border dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={18}/>
          <input 
            type="text" 
            placeholder="البحث بالاسم أو الرقم العسكري..." 
            className="w-full pr-12 pl-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-accent rounded-2xl outline-none font-bold text-sm transition-all"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setFilterEligible(!filterEligible)}
          className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all w-full md:w-auto ${filterEligible ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
        >
          <Filter size={18}/> {filterEligible ? 'عرض المستحقين فقط' : 'كل القوة'}
        </button>
      </div>

      {/* 3. Personnel List */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50 text-slate-500 font-black text-[10px] uppercase">
                <th className="px-8 py-6">البيانات الشخصية</th>
                <th className="px-8 py-6">الرتبة</th>
                <th className="px-8 py-6">تاريخ الخدمة</th>
                <th className="px-8 py-6">حالة الاستحقاق</th>
                <th className="px-8 py-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filteredPersonnel.map((p, idx) => {
                const info = getPromotionInfo(p);
                return (
                  <motion.tr 
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                            {p.photo ? <img src={p.photo} className="w-full h-full object-cover rounded-xl" /> : <UserCircle size={20}/>}
                         </div>
                         <div>
                            <p className="font-black dark:text-white text-xs">{p.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">#{p.militaryNumber}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="font-black text-accent">{p.rank}</span>
                    </td>
                    <td className="px-8 py-4">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                             <Clock size={12}/> {p.lastPromotionDate || 'غير محدد'}
                          </div>
                          {p.joinDate && <div className="text-[9px] text-slate-400 font-bold">التحاق: {p.joinDate}</div>}
                       </div>
                    </td>
                    <td className="px-8 py-4">
                       {info.missing ? (
                          <div className="flex items-center gap-2 text-red-500 font-black text-[10px] animate-pulse">
                             <AlertCircle size={14}/> {info.remaining}
                          </div>
                       ) : (
                        <div className="space-y-2 w-48">
                          <div className="flex justify-between items-center text-[10px] font-black">
                             <span className={info.eligible ? 'text-emerald-500 uppercase tracking-widest' : 'text-slate-500'}>{info.remaining}</span>
                             <span className="text-slate-400">{Math.round(info.percent)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${info.percent}%` }}
                                className={`h-full rounded-full ${info.eligible ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-accent'}`}
                             />
                          </div>
                        </div>
                       )}
                    </td>
                    <td className="px-8 py-4">
                       <div className="flex items-center justify-center gap-2">
                           <button 
                            onClick={() => handleOpenDateModal(p)}
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-accent hover:bg-white dark:hover:bg-slate-700 transition-all"
                            title="تعديل تواريخ الخدمة"
                           >
                              <Settings2 size={16}/>
                           </button>
                           <button 
                            onClick={() => handleOpenPromoteModal(p)}
                            disabled={info.missing}
                            className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${info.eligible ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : (info.missing ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}`}
                           >
                            <ArrowUpCircle size={16}/> ترقية
                           </button>
                       </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Promotion Modal */}
      <AnimatePresence>
        {isModalOpen && selectedPersonnel && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl border dark:border-slate-800 overflow-hidden">
               <div className="p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl"><Award size={24}/></div>
                     <div>
                        <h3 className="text-xl font-black dark:text-white">إجراء ترقية مجمعة</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">تحديث الرتبة العسكرية والسجل التاريخي</p>
                     </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
               </div>
               <div className="p-10 space-y-8">
                  <div className="bg-accent/5 p-6 rounded-3xl border border-accent/10 flex items-center gap-6">
                     <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border dark:border-slate-700 overflow-hidden">
                        {selectedPersonnel.photo ? <img src={selectedPersonnel.photo} className="w-full h-full object-cover" /> : <UserCircle size={40} className="m-3 text-slate-300"/>}
                     </div>
                     <div>
                        <p className="text-xs font-black text-slate-500 mb-1">{selectedPersonnel.rank}</p>
                        <h4 className="text-xl font-black dark:text-white">{selectedPersonnel.name}</h4>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-2 flex items-center gap-2"><ArrowUpCircle size={14}/> الرتبة الجديدة</label>
                        <select className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-accent transition-all" value={promotionData.newRank} onChange={e => setPromotionData({...promotionData, newRank: e.target.value})}>
                           {settings.ranks.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase px-2 flex items-center gap-2"><Hash size={14}/> رقم الأمر</label>
                           <input type="text" placeholder="رقم الأمر..." className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-accent transition-all" value={promotionData.orderNumber} onChange={e => setPromotionData({...promotionData, orderNumber: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase px-2 flex items-center gap-2"><Calendar size={14}/> التاريخ</label>
                           <input type="date" className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-accent transition-all" value={promotionData.date} onChange={e => setPromotionData({...promotionData, date: e.target.value})} />
                        </div>
                     </div>
                  </div>
               </div>
               <div className="p-8 border-t dark:border-slate-800 flex gap-4">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black text-sm">تراجع</button>
                  <button onClick={handlePromote} className="flex-[2] py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all">تحديث الرتبة الآن</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Service Dates Modal */}
      <AnimatePresence>
        {isDateModalOpen && selectedPersonnel && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDateModalOpen(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl border dark:border-slate-800">
               <div className="p-8 border-b dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-accent/10 text-accent rounded-2xl"><Edit3 size={24}/></div>
                     <div>
                        <h3 className="text-xl font-black dark:text-white">تعديل تواريخ الخدمة</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">تحرير بيانات الالتحاق والأقدمية</p>
                     </div>
                  </div>
                  <button onClick={() => setIsDateModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
               </div>
               <div className="p-10 space-y-6">
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-2">تاريخ الالتحاق بالمؤسسة</label>
                        <input type="date" className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-accent outline-none font-bold text-sm" value={serviceDates.joinDate} onChange={e => setServiceDates({...serviceDates, joinDate: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-2">تاريخ آخر ترقية (لبء حساب الأقدمية)</label>
                        <input type="date" className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-accent outline-none font-bold text-sm" value={serviceDates.lastPromotionDate} onChange={e => setServiceDates({...serviceDates, lastPromotionDate: e.target.value})} />
                     </div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-start gap-3">
                     <Info size={16} className="text-blue-500 mt-0.5 shrink-0"/>
                     <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold leading-relaxed">تاريخ آخر ترقية هو الأساس الذي يعتمد عليه النظام لحساب الرتبة القادمة. يرجى التأكد من دقة البيانات المدخلة.</p>
                  </div>
               </div>
               <div className="p-8 border-t dark:border-slate-800 flex gap-4">
                  <button onClick={() => setIsDateModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black text-sm">إلغاء</button>
                  <button onClick={handleUpdateDates} className="flex-[2] py-4 bg-accent text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all">حفظ التعديلات</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromotionsManager;
