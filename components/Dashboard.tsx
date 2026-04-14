import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { storage } from '../utils/storage';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, History, Activity, 
  Clock, FileText, Zap, 
  UserCheck2, Briefcase,
  BarChart3, UserPlus, CalendarCheck, ClipboardList,
  ArrowRight, ShieldCheck, BellRing, CalendarDays, AlertTriangle, ChevronDown
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: 'dashboard' | 'personnel' | 'leaves' | 'reports' | 'admin' | 'settings' | 'forms' | 'roll_call') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const personnel = useMemo(() => storage.getPersonnel(), []);
  const departments = useMemo(() => storage.getDepartments(), []);
  const leaves = useMemo(() => storage.getLeaves(), []);
  const settings = useMemo(() => storage.getSettings(), []);
  const logs = useMemo(() => storage.getLogs().slice(0, 5), []);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [storageUsage, setStorageUsage] = useState({ size: '0', percent: 0 });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // حساب حجم المستهلك في التخزين المحلي كنسبة من أصل 5 ميجابايت تقريبية
    let total = 0;
    for (const x in localStorage) {
      if (!Object.prototype.hasOwnProperty.call(localStorage, x)) continue;
      total += ((localStorage[x].length + x.length) * 2);
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    const percent = Math.min(100, Math.round((total / maxSize) * 100));
    setStorageUsage({ size: (total / 1024).toFixed(2), percent });
  }, []);

  const filteredPersonnel = useMemo(() => {
    return selectedDept === 'all' ? personnel : personnel.filter(p => p.departmentId === selectedDept);
  }, [personnel, selectedDept]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let presentCount = 0;
    let missionCount = 0;
    let droppedCount = 0;
    
    filteredPersonnel.forEach(p => {
      if (p.attendanceStatus === 'present' && p.status !== 'dropped') presentCount++;
      if (p.status === 'mission') missionCount++;
      if (p.status === 'dropped') droppedCount++;
    });

    const activeLeaves = leaves.filter(l => l.status === 'approved' && today >= l.startDate && today <= l.endDate && filteredPersonnel.some(p => p.id === l.personnelId)).length;
    
    return {
      total: filteredPersonnel.length,
      present: presentCount,
      leaves: activeLeaves,
      missions: missionCount,
      dropped: droppedCount,
      readiness: filteredPersonnel.length > 0 ? Math.round((presentCount / filteredPersonnel.length) * 100) : 0,
    };
  }, [filteredPersonnel, leaves]);

  const deptData = useMemo(() => {
    const counts = new Map<string, number>();
    personnel.forEach(p => {
      if (p.departmentId) {
        counts.set(p.departmentId, (counts.get(p.departmentId) || 0) + 1);
      }
    });
    return departments.map(d => ({
      name: d.name,
      count: counts.get(d.id) || 0,
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [departments, personnel]);

  const outOfForceData = [
    { name: 'إجازات', value: stats.leaves, fill: '#f59e0b' },
    { name: 'مهام', value: stats.missions, fill: '#3b82f6' },
    { name: 'منقطعين', value: stats.dropped, fill: '#ef4444' }
  ].filter(d => d.value > 0);

  const pendingLeaves = useMemo(() => leaves.filter(l => l.status === 'pending'), [leaves]);
  
  const upcomingLeaves = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return leaves.filter(l => l.status === 'approved' && l.startDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 3);
  }, [leaves]);

  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 5) return 'مساء الخير';
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'طاب مساؤك';
    return 'مساء الخير';
  }, [currentTime]);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 pb-12 pt-4 max-w-[1600px] mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight dark:text-white flex items-center gap-3">
             {greeting} <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm">مرحباً بك في مركز إدارة شئون الأفراد والعمليات</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Smart Filtering Dropdown */}
          <div className="relative group w-full sm:w-auto">
             <select 
               className="w-full sm:w-64 appearance-none px-6 py-3.5 bg-white dark:bg-slate-900 border-2 border-transparent focus:border-accent text-sm font-black rounded-2xl outline-none shadow-sm cursor-pointer transition-all dark:text-white"
               value={selectedDept}
               onChange={e => setSelectedDept(e.target.value)}
             >
               <option value="all">كافة الإدارات والتشكيلات</option>
               {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
             </select>
             <ChevronDown size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border dark:border-slate-800 shadow-sm w-full sm:w-auto">
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-3">
              <Clock size={16} className="text-accent" />
              <span className="text-sm font-black dark:text-white" dir="ltr">
                {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
            <div className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-black shadow-lg shadow-accent/20">
              {currentTime.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'إجمالي القوة', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', tab: 'personnel' },
          { label: 'الحضور الفعلي', value: stats.present, icon: UserCheck2, color: 'text-emerald-600', bg: 'bg-emerald-50', tab: 'roll_call' },
          { label: 'خارج القوة', value: stats.leaves + stats.missions + stats.dropped, icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50', tab: 'leaves' },
          { label: 'نسبة الجاهزية', value: `${stats.readiness}%`, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50', tab: 'reports' }
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants} whileHover={{ y: -5 }} onClick={() => onNavigate(stat.tab as any)} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer group hover:border-accent">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} dark:bg-slate-800/80 ${stat.color} group-hover:bg-accent group-hover:text-white transition-colors`}>
                <stat.icon size={24} />
              </div>
              <div className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={16} className="text-slate-400 group-hover:text-accent" />
              </div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black dark:text-white">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Analytics */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bar Chart: Dept Distribution */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl"><BarChart3 size={20}/></div>
                  <h3 className="text-lg font-black dark:text-white">توزيع القوة</h3>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                    <Bar dataKey="count" fill={settings.accentColor || '#4f46e5'} radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Pie Chart: Out of Force details */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl"><Briefcase size={20}/></div>
                  <h3 className="text-lg font-black dark:text-white">تفاصيل خارج القوة</h3>
                </div>
              </div>
              
              {outOfForceData.length > 0 ? (
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={outOfForceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                        paddingAngle={5} dataKey="value" stroke="none"
                      >
                        {outOfForceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="flex justify-center gap-4 mt-2 mb-2 w-full">
                    {outOfForceData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                        {entry.name} ({entry.value})
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-bold italic">لا يوجد أفراد خارج القوة اليوم</div>
              )}
            </motion.div>
          </div>

          {/* Logs */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl"><History size={20}/></div>
              <h3 className="text-lg font-black dark:text-white">آخر النشاطات</h3>
            </div>
            <div className="space-y-4">
              {logs.length > 0 ? logs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                  <div className="w-10 h-10 bg-accent/10 text-accent rounded-full flex items-center justify-center shrink-0"><Zap size={18} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-black dark:text-white">{log.action}</p>
                    <p className="text-xs text-slate-400 font-bold">{log.details}</p>
                  </div>
                  <div className="text-left text-[10px] font-black text-slate-400">{new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              )) : <div className="py-12 text-center text-slate-400 font-bold italic">لا توجد نشاطات مسجلة حالياً</div>}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Actions, Alerts, Status */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Alerts Center */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 overflow-hidden rounded-[2.5rem] border dark:border-slate-800 shadow-sm relative group">
            <div className="absolute top-0 right-0 w-2 h-full bg-red-500 rounded-r-[2.5rem]"></div>
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl relative">
                    <BellRing size={20} className={pendingLeaves.length > 0 || stats.dropped > 0 ? "animate-[bell-ring_2s_ease-in-out_infinite]" : ""} />
                    {(pendingLeaves.length > 0 || stats.dropped > 0) && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></div>}
                 </div>
                 <h3 className="text-lg font-black dark:text-white">مركز التنبيهات</h3>
              </div>
              <div className="space-y-3">
                 <div onClick={() => onNavigate('leaves')} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition-all">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">إجازات بانتظار الاعتماد</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${pendingLeaves.length > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>{pendingLeaves.length}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition-all">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-500"/>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">أفراد متجاوزون (منقطعين)</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${stats.dropped > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>{stats.dropped}</span>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* Mini Calendar / Upcoming */}
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-accent/5 to-accent/10 dark:from-accent/10 dark:to-accent/5 p-6 md:p-8 rounded-[2.5rem] border border-accent/20 shadow-sm relative overflow-hidden">
             <div className="absolute -top-12 -left-12 w-32 h-32 bg-accent/10 rounded-full blur-3xl"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-white dark:bg-slate-800 text-accent rounded-xl shadow-sm"><CalendarDays size={20}/></div>
                   <h3 className="text-lg font-black dark:text-slate-100 text-slate-800">الأحداث القادمة</h3>
                </div>
                {upcomingLeaves.length > 0 ? (
                  <div className="space-y-3">
                     {upcomingLeaves.map((l, i) => {
                        const person = personnel.find(p => p.id === l.personnelId);
                        return (
                          <div key={i} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-4 rounded-2xl flex items-center justify-between border border-white/50 dark:border-slate-700/50 shadow-sm">
                             <div>
                               <p className="text-[11px] font-black text-accent mb-0.5">{l.startDate}</p>
                               <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{person?.name} ({l.type})</p>
                             </div>
                             <ArrowRight size={14} className="text-slate-400"/>
                          </div>
                        )
                     })}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-500/80 italic text-center py-4">لا توجد أحداث مجدولة قريباً</p>
                )}
             </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2 text-center">الوصول السريع والمهام</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'personnel', label: 'إضافة فرد', icon: UserPlus, color: 'bg-blue-50 text-blue-600' },
                { id: 'roll_call', label: 'تسجيل التمام', icon: ClipboardList, color: 'bg-emerald-50 text-emerald-600' },
                { id: 'leaves', label: 'طلب إجازة', icon: CalendarCheck, color: 'bg-amber-50 text-amber-600' },
                { id: 'reports', label: 'التقارير', icon: FileText, color: 'bg-purple-50 text-purple-600' }
              ].map(action => (
                <button key={action.id} onClick={() => onNavigate(action.id as any)} className="flex flex-col items-center gap-3 p-5 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900 transition-all group active:scale-95 shadow-sm hover:shadow-lg">
                  <div className={`p-3 rounded-2xl ${action.color} dark:bg-opacity-20 group-hover:bg-accent group-hover:text-white transition-colors`}><action.icon size={20} /></div>
                  <span className="text-[10px] sm:text-xs font-black text-slate-600 dark:text-slate-300">{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* System Status - Enhanced */}
          <motion.div variants={itemVariants} className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl"><ShieldCheck size={20} /></div>
                   <span className="text-xs font-black uppercase tracking-widest text-emerald-400">حالة النظام</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] font-bold">متصل</span>
                 </div>
              </div>
              <div className="space-y-5">
                <div>
                   <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2">
                      <span>استهلاك الذاكرة ({storageUsage.size} KB)</span>
                      <span className={storageUsage.percent > 80 ? 'text-red-400' : 'text-emerald-400'}>{storageUsage.percent}%</span>
                   </div>
                   <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${storageUsage.percent > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${storageUsage.percent}%` }}></div>
                   </div>
                </div>
                <div className="pt-5 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div>
                     <p className="text-[10px] text-slate-500 font-bold mb-1">الإصدار</p>
                     <p className="text-xs font-black">v{settings.version || '1.0.0'}</p>
                  </div>
                  <div>
                     <p className="text-[10px] text-slate-500 font-bold mb-1">تحديث المنظومة</p>
                     <p className="text-xs font-black text-emerald-400">محدّث التلقائي</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Ambient background decoration */}
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
            <div className="absolute top-10 -left-10 w-24 h-24 bg-accent/20 rounded-full blur-2xl"></div>
          </motion.div>
        </div>
      </div>

    </motion.div>
  );
};

export default Dashboard;
