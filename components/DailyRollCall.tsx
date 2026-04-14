
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { Personnel, User, AttendanceStatus, AttendanceRecord, WorkSchedule } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, History, UsersRound, AlertOctagon, Timer, CalendarSearch, X, Printer
} from 'lucide-react';

// Sub-components
import SchedulesTab from './SchedulesTab';
import TakeRollCallTab from './TakeRollCallTab';
import ArchiveTab from './ArchiveTab';
import DroppedTab from './DroppedTab';

interface DailyRollCallProps {
  currentUser: User;
}

const DailyRollCall: React.FC<DailyRollCallProps> = ({ currentUser }) => {
  const personnel = storage.getPersonnel();
  const departments = storage.getDepartments();
  const sections = storage.getSections();
  const settings = storage.getSettings();
  const attendanceHistory = storage.getAttendance();
  const leaves = storage.getLeaves();

  const [activeSubTab, setActiveSubTab] = useState<'take' | 'session' | 'schedules' | 'dropped'>('take');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [takeDate, setTakeDate] = useState(new Date().toISOString().split('T')[0]);
  const [isTakingMode, setIsTakingMode] = useState(false);
  const [rollCallMode, setRollCallMode] = useState<'all' | 'scheduled'>('all');
  const [tempStatuses, setTempStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ id: string; status: AttendanceStatus } | null>(null);
  const [viewMode, setViewMode] = useState<'queue' | 'grid'>('queue');
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>(storage.getWorkSchedules());

  // History Modal States
  const [selectedPersonForHistory, setSelectedPersonForHistory] = useState<Personnel | null>(null);
  const [historyStartDate, setHistoryStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [historyEndDate, setHistoryEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Session Recovery & Auto-Archive
  useEffect(() => {
    const savedSession = storage.getSession();
    if (savedSession) {
      const now = new Date();
      const sessionStart = new Date(savedSession.startTime);
      const diffHours = (now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);

      if (diffHours >= 24) {
        // Auto-archive old session instead of deleting
        const statusKeys = Object.keys(savedSession.statuses);
        if (statusKeys.length > 0) {
          const autoRecords: AttendanceRecord[] = statusKeys.map(personnelId => ({
            id: crypto.randomUUID(),
            personnelId,
            date: savedSession.startTime.split('T')[0],
            status: savedSession.statuses[personnelId],
            recordedBy: 'system_auto',
            timestamp: new Date().toISOString()
          }));
          storage.addAttendanceRecords(autoRecords);
          storage.addLog({
            userId: 'system',
            username: 'النظام',
            action: 'أرشفة تلقائية',
            details: `تم ترحيل تمام قديم تلقائياً لـ ${autoRecords.length} فرد`
          });
        }
        storage.setSession(null);
      } else {
        setTempStatuses(savedSession.statuses);
        setSessionStartTime(savedSession.startTime);
      }
    }
  }, []);

  // auto-sync temporary labels for leaves
  useEffect(() => {
    if (leaves.length === 0 || personnel.length === 0) return;
    const activeLeaves = leaves.filter(l => l.status === 'approved' && l.startDate <= takeDate && l.endDate >= takeDate);
    if (activeLeaves.length === 0) return;

    setTempStatuses(prev => {
      let changed = false;
      const next = { ...prev };
      personnel.forEach(p => {
        const pLeave = activeLeaves.find(l => l.personnelId === p.id);
        if (pLeave && !next[p.id]) {
          next[p.id] = 'disrupted';
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [takeDate, leaves, personnel]);

  // Persistent storage of temporary session
  useEffect(() => {
    if (Object.keys(tempStatuses).length > 0) {
      const startTime = sessionStartTime || new Date().toISOString();
      if (!sessionStartTime) setSessionStartTime(startTime);
      storage.setSession({ statuses: tempStatuses, startTime });
    } else {
      storage.setSession(null);
      setSessionStartTime(null);
    }
  }, [tempStatuses, sessionStartTime]);

  const schedulesByDeptSection = useMemo(() => {
    const map = new Map<string, WorkSchedule[]>();
    workSchedules.forEach(s => {
      const key = `${s.departmentId}-${s.sectionId || 'all'}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [workSchedules]);

  const getPersonnelScheduleInfo = useCallback((person: Personnel) => {
    const key = `${person.departmentId}-${person.sectionId || 'all'}`;
    const deptKey = `${person.departmentId}-all`;
    const applicableSchedules = [
      ...(schedulesByDeptSection.get(key) || []),
      ...(schedulesByDeptSection.get(deptKey) || []),
      ...(schedulesByDeptSection.get('-all') || [])
    ];
    
    if (applicableSchedules.length === 0) return { name: 'دوام عام', type: 'daily' };
    const s = applicableSchedules[0];
    return { name: s.name, type: s.type };
  }, [schedulesByDeptSection]);

  const isScheduledOnDate = useCallback((person: Personnel, dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = (date.getDay() + 1) % 7;
    const key = `${person.departmentId}-${person.sectionId || 'all'}`;
    const deptKey = `${person.departmentId}-all`;
    const applicableSchedules = [
      ...(schedulesByDeptSection.get(key) || []),
      ...(schedulesByDeptSection.get(deptKey) || []),
      ...(schedulesByDeptSection.get('-all') || [])
    ];

    if (applicableSchedules.length === 0) return true;

    return applicableSchedules.some(s => {
      if (s.type === 'daily' || s.type === 'fixed_days') {
        const isDayScheduled = s.type === 'daily' 
          ? (s.daysOfWeek && s.daysOfWeek.length > 0 ? s.daysOfWeek.includes(dayOfWeek) : true)
          : s.daysOfWeek?.includes(dayOfWeek);
        return isDayScheduled;
      }
      
      if (s.type === 'rotation' || s.type === 'overnight') {
         const refDate = new Date(s.startDate || s.createdAt || '2024-01-01');
         const diffDaysToday = Math.floor((date.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
         const cycleLength = (s.workDaysCount || 1) + (s.restDaysCount || 0);
         const isWorkDayToday = diffDaysToday >= 0 && (diffDaysToday % cycleLength) < (s.workDaysCount || 1);
         if (isWorkDayToday) return true;
         if (s.type === 'overnight') {
            const yesterday = new Date(date);
            yesterday.setDate(yesterday.getDate() - 1);
            const diffDaysYesterday = Math.floor((yesterday.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
            const isWorkDayYesterday = diffDaysYesterday >= 0 && (diffDaysYesterday % cycleLength) < (s.workDaysCount || 1);
            if (isWorkDayYesterday) return true; 
         }
         return false;
      }
      return true;
    });
  }, [schedulesByDeptSection]);

  const handleSave = useCallback((isAutoSave = false) => {
    const statusKeys = Object.keys(tempStatuses);
    if (statusKeys.length === 0) return;

    // Use takeDate from session if it exists, otherwise use current takeDate
    const finalDate = sessionStartTime ? sessionStartTime.split('T')[0] : takeDate;

    const newRecords: AttendanceRecord[] = statusKeys.map(personnelId => ({
      id: crypto.randomUUID(),
      personnelId,
      date: finalDate,
      status: tempStatuses[personnelId],
      recordedBy: currentUser.id,
      timestamp: new Date().toISOString()
    }));

    storage.addAttendanceRecords(newRecords);

    storage.addLog({
      userId: currentUser.id,
      username: currentUser.username,
      action: isAutoSave ? 'حفظ تلقائي للتمام' : 'حفظ تمام الوحدة',
      details: `تم ترحيل التمام لـ ${newRecords.length} فرد`
    });
    
    setTempStatuses({});
    storage.setSession(null);
    setIsTakingMode(false);
    
    if (!isAutoSave) {
      alert(`تم ترحيل تمام اليوم بنجاح ✅`);
      window.location.reload();
    }
  }, [tempStatuses, takeDate, sessionStartTime, currentUser]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Top Navigation */}
      <div className="flex flex-wrap md:flex-nowrap bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-[2rem] shadow-xl border dark:border-slate-800 w-full md:w-fit no-print mx-auto lg:mr-0 gap-2 sticky top-4 z-50">
         {[
           { id: 'schedules', label: 'قيام العمل', icon: Timer },
           { id: 'take', label: 'تسجيل التمام', icon: UsersRound },
           { id: 'session', label: 'أرشفة الجلسة', icon: History },
           { id: 'dropped', label: 'المنقطعين', icon: AlertOctagon },
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveSubTab(tab.id as any)} 
             className={`px-6 py-3.5 rounded-2xl font-black text-[11px] md:text-sm flex items-center justify-center gap-3 transition-all duration-300 ${activeSubTab === tab.id ? 'bg-accent text-white shadow-lg shadow-accent/30 scale-105' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
           >
             <tab.icon size={18}/> 
             <span className="hidden sm:inline">{tab.label}</span>
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-8 order-2 lg:order-1">
            {activeSubTab === 'take' && (
              <TakeRollCallTab 
                personnel={personnel} departments={departments} sections={sections} workSchedules={workSchedules} attendanceHistory={attendanceHistory}
                takeDate={takeDate} setTakeDate={setTakeDate} selectedDeptId={selectedDeptId} setSelectedDeptId={setSelectedDeptId}
                selectedSectionId={selectedSectionId} setSelectedSectionId={setSelectedSectionId} rollCallMode={rollCallMode} setRollCallMode={setRollCallMode}
                isTakingMode={isTakingMode} setIsTakingMode={setIsTakingMode} tempStatuses={tempStatuses} setTempStatuses={setTempStatuses}
                lastAction={lastAction} setLastAction={setLastAction} viewMode={viewMode} setViewMode={setViewMode} currentUser={currentUser}
                onSave={handleSave} isScheduledOnDate={isScheduledOnDate} getPersonnelScheduleInfo={getPersonnelScheduleInfo} settings={settings}
              />
            )}
            {activeSubTab === 'schedules' && (
              <SchedulesTab workSchedules={workSchedules} departments={departments} sections={sections} onSchedulesUpdate={() => setWorkSchedules(storage.getWorkSchedules())}/>
            )}
            {activeSubTab === 'session' && (
              <ArchiveTab 
                tempStatuses={tempStatuses} 
                sessionStartTime={sessionStartTime} 
                onClearSession={() => {setTempStatuses({}); setSessionStartTime(null); setIsTakingMode(false);}} 
                onRefresh={() => window.location.reload()}
                onSave={() => handleSave(false)}
                onUpdateStatus={(id, status) => setTempStatuses(prev => ({ ...prev, [id]: status }))}
                personnel={personnel}
              />
            )}
            {activeSubTab === 'dropped' && (
              <DroppedTab personnel={personnel} settings={settings}/>
            )}
         </div>

         <div className="lg:col-span-4 order-1 lg:order-2 space-y-6 no-print">
            {/* Sidebar Stats Refactored for small view */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-xl space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b dark:border-slate-800">
                  <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center"><History size={20}/></div>
                  <div>
                    <h3 className="font-black text-sm dark:text-white uppercase tracking-wider">موجز العمليات</h3>
                    <p className="text-[10px] font-bold text-slate-500">متابعة حالة التمام اللحظية</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <span className="text-xs font-bold text-slate-500">تم الفرز</span>
                    <span className="text-lg font-black dark:text-white">{Object.keys(tempStatuses).length}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20">
                    <span className="text-xs font-bold text-emerald-600">حضور</span>
                    <span className="text-lg font-black text-emerald-600">{Object.values(tempStatuses).filter(s => s === 'present').length}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100/50 dark:border-red-900/20">
                    <span className="text-xs font-bold text-red-600">غياب</span>
                    <span className="text-lg font-black text-red-600">{Object.values(tempStatuses).filter(s => s === 'absent').length}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100/50 dark:border-amber-900/20 text-amber-600">
                    <span className="text-xs font-bold">إذن/إجازة</span>
                    <span className="text-lg font-black">{Object.values(tempStatuses).filter(s => s === 'permission').length}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20 text-indigo-600">
                    <span className="text-xs font-bold">مهمة</span>
                    <span className="text-lg font-black">{Object.values(tempStatuses).filter(s => s === 'mission').length}</span>
                  </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DailyRollCall;
