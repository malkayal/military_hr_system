
/**
 * مكون مدير التقارير (Reports Manager)
 * المحرك المسؤول عن بناء التقارير المخصصة، تقارير الانضباط، والملفات الفردية.
 * يدعم التصدير لـ Excel والمعاينة للطباعة الورقية مع مراعاة الأقدمية العسكرية.
 */

import React, { useState, useMemo } from 'react';
import { storage } from '../utils/storage';
import { User, PersonnelType } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { 
  Printer, Search, CheckSquare, Square, 
  Download, Droplets, CreditCard, MapPin, 
  LayoutTemplate, ShieldCheck,
  Minimize2, Maximize2,
  UserCircle, Sliders,
  Stamp, Hash, History, PhoneCall, Calendar,
  Landmark, Briefcase, Activity, Shirt, Binary,
  ClipboardList, BarChart3,
  GraduationCap, UserCheck, Table as TableIcon, ArrowDownUp,
  UserX, AlertTriangle, Shield
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReportsManagerProps {
  currentUser: User;
}

const ReportsManager: React.FC<ReportsManagerProps> = () => {
  // جلب البيانات من محرك التخزين المحلي
  const personnel = useMemo(() => storage.getPersonnel(), []);
  const departments = useMemo(() => storage.getDepartments(), []);
  const settings = useMemo(() => storage.getSettings(), []);
  const attendanceHistory = useMemo(() => storage.getAttendance(), []);
  const workSchedules = useMemo(() => storage.getWorkSchedules(), []);

  // --- حالات وضع التقرير (View Modes) ---
  const [reportMode, setReportMode] = useState<'table' | 'attendance_stats' | 'attendance' | 'individual'>('table');
  const [attendanceView, setAttendanceView] = useState<'daily' | 'monthly' | 'dropped'>('daily');

  // حالات تقرير التمام المطور (Attendance Stats)
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | string>('all');
  const [reportRankFilter, setReportRankFilter] = useState<string>('all');
  const [reportTypeFilter] = useState<string>('all');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportVisibleColumns, setReportVisibleColumns] = useState<string[]>(['name', 'expected', 'present', 'assigned', 'absent', 'disrupted', 'rate']);

  // فلاتر البحث والفرز المتقدم
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [targetDeptId, setTargetDeptId] = useState('all');
  const [targetRank] = useState('all');
  const [targetType] = useState<'all' | PersonnelType>('all');
  
  // مفاتيح التحكم البصري (Toggles) لتخصيص شكل التقرير المطبوع
  const [showLogo, setShowLogo] = useState(true);
  const [showHierarchy, setShowHierarchy] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showFooter] = useState(true);
  const [showTotalCount, setShowTotalCount] = useState(true);
  const [fontSize] = useState<'text-[8px]' | 'text-[10px]' | 'text-[12px]'>('text-[10px]');
  const [zebraStripes, setZebraStripes] = useState(true);
  
  // إعدادات المعاينة (Zoom & Orientation)
  const [reportTitle] = useState('تقرير تفصيلي شامل للأفراد');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [previewZoom, setPreviewZoom] = useState(100);

  /** تعريف كافة الأعمدة المتاحة في النظام لبناء الجداول المخصصة */
  const allColumns = [
    { id: 'rank', label: 'الرتبة / الدرجة', icon: ShieldCheck },
    { id: 'name', label: 'الاسم الرباعي الكامل', icon: Search },
    { id: 'militaryNumber', label: 'الرقم العسكري', icon: Binary },
    { id: 'nationalId', label: 'الرقم الوطني', icon: Hash },
    { id: 'departmentId', label: 'الإدارة / الوحدة', icon: LayoutTemplate },
    { id: 'entity', label: 'الجهة التابع لها', icon: Landmark },
    { id: 'employmentType', label: 'نوع التعاقد', icon: Briefcase },
    { id: 'placementLocation', label: 'مكان التمركز', icon: MapPin },
    { id: 'salaryEntity', label: 'جهة الراتب', icon: CreditCard },
    { id: 'phone', label: 'رقم الهاتف', icon: PhoneCall },
    { id: 'bloodType', label: 'فصيلة الدم', icon: Droplets },
    { id: 'qualification', label: 'المؤهل العلمي', icon: GraduationCap },
    { id: 'uniformSize', label: 'مقاس البدلة', icon: Shirt },
    { id: 'joinDate', label: 'تاريخ الالتحاق', icon: History },
    { id: 'attendanceStatus', label: 'حالة الحضور', icon: UserCheck },
  ];

  // الأعمدة التي تظهر افتراضياً عند فتح التقرير
  const [selectedCols, setSelectedCols] = useState<string[]>(['rank', 'name', 'militaryNumber', 'departmentId', 'attendanceStatus']);

  // --- منطق المعالجة (Memoized Logic) ---

  const schedulesByDeptSection = useMemo(() => {
    const map = new Map<string, any[]>();
    workSchedules.forEach(s => {
      const key = `${s.departmentId}-${s.sectionId || 'all'}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [workSchedules]);

  const isScheduledOnDate = (person: any, dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const key = `${person.departmentId}-${person.sectionId || 'all'}`;
    const deptKey = `${person.departmentId}-all`;
    const applicableSchedules = [
      ...(schedulesByDeptSection.get(key) || []),
      ...(person.sectionId ? (schedulesByDeptSection.get(deptKey) || []) : [])
    ];
    if (applicableSchedules.length === 0) return true;
    return applicableSchedules.some(s => {
      if (s.type === 'daily') return s.daysOfWeek ? s.daysOfWeek.includes(dayOfWeek) : true;
      if (s.type === 'fixed_days') return s.daysOfWeek?.includes(dayOfWeek);
      if (s.type === 'rotation' || s.type === 'overnight') {
         const refDate = new Date(s.startDate || s.createdAt || '2024-01-01');
         const diffDays = Math.floor((date.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
         if (diffDays < 0) return false;
         const cycleLength = (s.workDaysCount || 1) + (s.restDaysCount || 0);
         const dayInCycle = diffDays % cycleLength;
         return dayInCycle < (s.workDaysCount || 1);
      }
      return true;
    });
  };

  const aggregatedReportData = useMemo(() => {
    if (reportMode !== 'attendance_stats') return [];
    const recordsInRange = attendanceHistory.filter(r => r.date >= startDate && r.date <= endDate);
    const recordsByPerson = new Map<string, any[]>();
    recordsInRange.forEach(r => {
      if (!recordsByPerson.has(r.personnelId)) recordsByPerson.set(r.personnelId, []);
      recordsByPerson.get(r.personnelId)!.push(r);
    });

    const targetPeople = personnel.filter(p => {
      const matchesDept = targetDeptId === 'all' || p.departmentId === targetDeptId;
      const matchesSearch = p.name.includes(reportSearchQuery) || (p.militaryNumber && p.militaryNumber.includes(reportSearchQuery));
      const matchesRank = reportRankFilter === 'all' || p.rank === reportRankFilter;
      const matchesType = reportTypeFilter === 'all' || p.type === reportTypeFilter;
      return matchesDept && matchesSearch && matchesRank && matchesType;
    });

    return targetPeople.map(p => {
       const pRecords = recordsByPerson.get(p.id) || [];
       const presentCount = pRecords.filter(r => r.status === 'present').length;
       const assignedCount = pRecords.filter(r => r.status === 'assigned').length;
       const absentCount = pRecords.filter(r => r.status === 'absent').length;
       const excusedCount = pRecords.filter(r => r.status === 'disrupted').length;
       const total = pRecords.length;

       let expectedDays = 0;
       const start = new Date(startDate);
       const end = new Date(endDate);
       for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
         if (isScheduledOnDate(p, d.toISOString().split('T')[0])) expectedDays++;
       }

       return {
         person: p,
         presentCount,
         assignedCount,
         absentCount,
         excusedCount,
         total,
         expectedDays,
         disciplineRate: expectedDays > 0 ? Math.round(((presentCount + assignedCount) / expectedDays) * 100) : (total > 0 ? Math.round(((presentCount + assignedCount) / total) * 100) : 0)
       };
    }).filter(row => {
       if (reportStatusFilter === 'all') return true;
       if (reportStatusFilter === 'present') return row.presentCount > 0;
       if (reportStatusFilter === 'absent') return row.absentCount > 0;
       if (reportStatusFilter === 'assigned') return row.assignedCount > 0;
       if (reportStatusFilter === 'disrupted') return row.excusedCount > 0;
       return true;
    }).sort((a, b) => {
       const idxA = settings.ranks.indexOf(a.person.rank);
       const idxB = settings.ranks.indexOf(b.person.rank);
       return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  }, [reportMode, attendanceHistory, startDate, endDate, targetDeptId, reportSearchQuery, reportStatusFilter, reportRankFilter, reportTypeFilter, personnel, settings.ranks, workSchedules, isScheduledOnDate]);

  const reportSummary = useMemo(() => {
    return aggregatedReportData.reduce((acc, curr) => ({
      present: acc.present + curr.presentCount,
      assigned: acc.assigned + curr.assignedCount,
      absent: acc.absent + curr.absentCount,
      disrupted: acc.disrupted + curr.excusedCount,
      total: acc.total + curr.total
    }), { present: 0, assigned: 0, absent: 0, disrupted: 0, total: 0 });
  }, [aggregatedReportData]);

  /** تصفية البيانات العامة بناءً على الفلاتر المختارة والفرز حسب الرتبة (الأقدمية) */
  const filteredData = useMemo(() => {
    const search = debouncedSearchQuery.toLowerCase();
    return personnel.filter(p => {
      const matchesDept = targetDeptId === 'all' || p.departmentId === targetDeptId;
      const matchesRank = targetRank === 'all' || p.rank === targetRank;
      const matchesType = targetType === 'all' || p.type === targetType;
      const matchesSearch = !search || p.name.toLowerCase().includes(search) || p.militaryNumber.includes(search);
      return matchesDept && matchesRank && matchesType && matchesSearch;
    }).sort((a, b) => {
       const idxA = settings.ranks.indexOf(a.rank);
       const idxB = settings.ranks.indexOf(b.rank);
       return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  }, [personnel, targetDeptId, targetRank, targetType, debouncedSearchQuery, settings.ranks]);

  /** تصفية الأفراد المنقطعين (dropped) فقط لغرض تقرير الانضباط */
  const droppedPersonnel = useMemo(() => {
    return personnel.filter(p => p.status === 'dropped' && (targetDeptId === 'all' || p.departmentId === targetDeptId))
      .sort((a, b) => {
        const idxA = settings.ranks.indexOf(a.rank);
        const idxB = settings.ranks.indexOf(b.rank);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      });
  }, [personnel, targetDeptId, settings.ranks]);

  /** دالة لتصدير البيانات الحالية لملف Excel بلمسة واحدة */
  const handleExportExcel = () => {
    let dataToExport = [];
    if (reportMode === 'attendance_stats') {
      dataToExport = aggregatedReportData.map(row => ({
        'الرتبة': row.person.rank,
        'الاسم': row.person.name,
        'الرقم العسكري': row.person.militaryNumber,
        'الإدارة': departments.find(d => d.id === row.person.departmentId)?.name,
        'أيام العمل المقررة': row.expectedDays,
        'أيام الحضور': row.presentCount,
        'أيام التكليف': row.assignedCount,
        'أيام الغياب': row.absentCount,
        'نسبة الانضباط': `${row.disciplineRate}%`
      }));
    } else if (attendanceView === 'dropped' && reportMode === 'attendance') {
      dataToExport = droppedPersonnel.map(p => ({
        'الرتبة': p.rank,
        'الاسم الكامل': p.name,
        'الإدارة': departments.find(d => d.id === p.departmentId)?.name || '---',
        'تاريخ الانقطاع': p.lastEditedAt ? new Date(p.lastEditedAt).toLocaleDateString('ar-EG') : 'غير محدد'
      }));
    } else {
      dataToExport = filteredData.map(p => {
        const row: any = {};
        selectedCols.forEach(col => {
          if (col === 'departmentId') row['الإدارة'] = departments.find(d => d.id === p.departmentId)?.name;
          else row[allColumns.find(c => c.id === col)?.label || col] = (p as any)[col];
        });
        return row;
      });
    }
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `DCMI_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. نظام التنقل العلوي بين أنواع التقارير */}
      <div className="flex bg-white dark:bg-slate-900 p-2 rounded-[2.5rem] shadow-sm border dark:border-slate-800 w-fit no-print">
         <button onClick={() => setReportMode('table')} className={`px-10 py-4 rounded-3xl font-black text-sm flex items-center gap-3 transition-all ${reportMode === 'table' ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}><TableIcon size={22}/> تقارير الجداول</button>
         <button onClick={() => setReportMode('attendance_stats')} className={`px-10 py-4 rounded-3xl font-black text-sm flex items-center gap-3 transition-all ${reportMode === 'attendance_stats' ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}><BarChart3 size={22}/> تقارير الحضور والغياب</button>
         <button onClick={() => setReportMode('attendance')} className={`px-10 py-4 rounded-3xl font-black text-sm flex items-center gap-3 transition-all ${reportMode === 'attendance' ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}><ClipboardList size={22}/> تقارير الانضباط والحضور</button>
         <button onClick={() => setReportMode('individual')} className={`px-10 py-4 rounded-3xl font-black text-sm flex items-center gap-3 transition-all ${reportMode === 'individual' ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}><UserCircle size={22}/> الملفات الفردية</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 no-print">
         
         {/* 2. لوحة التحكم الجانبية (محرك الفلترة والتخصيص) */}
         <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 shadow-sm space-y-8">
               
               <div className="flex items-center gap-4 text-accent">
                  <div className="p-3 bg-accent/10 rounded-2xl"><Sliders size={24}/></div>
                  <h3 className="text-xl font-black">محرك الفلترة الذكي</h3>
               </div>

               {/* تبديل عرض تقارير الانضباط فقط عند اختيار التبويب الخاص بها */}
               {reportMode === 'attendance' && (
                 <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border dark:border-slate-700 animate-in zoom-in-95">
                    <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-2">نوع تقرير الانضباط</label>
                    <div className="grid grid-cols-1 gap-2">
                       <button onClick={() => setAttendanceView('daily')} className={`flex items-center gap-3 p-4 rounded-2xl font-black text-xs transition-all ${attendanceView === 'daily' ? 'bg-accent text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}><Calendar size={18}/> التمام اليومي</button>
                       <button onClick={() => setAttendanceView('monthly')} className={`flex items-center gap-3 p-4 rounded-2xl font-black text-xs transition-all ${attendanceView === 'monthly' ? 'bg-accent text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}><Activity size={18}/> إحصائيات الشهر</button>
                       <button onClick={() => setAttendanceView('dropped')} className={`flex items-center justify-between p-4 rounded-2xl font-black text-xs transition-all ${attendanceView === 'dropped' ? 'bg-red-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-red-500 border border-red-100 dark:border-red-900/30'}`}>
                          <div className="flex items-center gap-3"><UserX size={18}/> كشف المنقطعين</div>
                          <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px]">{personnel.filter(p => p.status === 'dropped').length}</span>
                       </button>
                    </div>
                 </div>
               )}

               <div className="space-y-6">
                  {/* محرك البحث السريع */}
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-2">بحث سريع</label>
                     <div className="relative">
                        <input 
                          type="text" 
                          placeholder="ابحث بالاسم أو الرقم..." 
                          className="w-full p-4 pr-12 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-accent transition-all"
                          value={reportMode === 'attendance_stats' ? reportSearchQuery : searchQuery}
                          onChange={e => reportMode === 'attendance_stats' ? setReportSearchQuery(e.target.value) : setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400" size={18}/>
                     </div>
                  </div>
                  {/* اختيار الإدارة المستهدفة بالتقرير */}
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-2">اختيار الإدارة</label>
                     <select className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-black text-sm" value={targetDeptId} onChange={e => setTargetDeptId(e.target.value)}>
                        <option value="all">كافة الإدارات والوحدات</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                     </select>
                  </div>

                  {reportMode === 'attendance_stats' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-2">الفترة الزمنية</label>
                          <div className="grid grid-cols-1 gap-2">
                             <input type="date" className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-black text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                             <input type="date" className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-black text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-2">تصفية الحالة</label>
                          <select className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-black text-sm" value={reportStatusFilter} onChange={e => setReportStatusFilter(e.target.value)}>
                             <option value="all">كافة الحالات</option>
                             <option value="present">الحضور فقط</option>
                             <option value="absent">الغياب فقط</option>
                             <option value="assigned">التكليف فقط</option>
                             <option value="disrupted">الأذونات فقط</option>
                          </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-2">تخصيص الأعمدة</label>
                          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2 bg-gray-50 dark:bg-slate-800 rounded-2xl">
                             {[
                                { id: 'name', label: 'الاسم والبيانات' },
                                { id: 'expected', label: 'أيام العمل المقررة' },
                                { id: 'present', label: 'الحضور' },
                                { id: 'assigned', label: 'التكليف' },
                                { id: 'absent', label: 'الغياب' },
                                { id: 'disrupted', label: 'الأذونات' },
                                { id: 'rate', label: 'معدل الانضباط' },
                             ].map(col => (
                                <button 
                                  key={col.id} 
                                  onClick={() => setReportVisibleColumns(prev => prev.includes(col.id) ? prev.filter(c => c !== col.id) : [...prev, col.id])}
                                  className={`flex items-center justify-between p-3 rounded-xl transition-all ${reportVisibleColumns.includes(col.id) ? 'bg-accent/10 text-accent' : 'text-slate-600 dark:text-slate-400 hover:bg-white'}`}
                                >
                                   <span className="text-[10px] font-black">{col.label}</span>
                                   {reportVisibleColumns.includes(col.id) ? <CheckSquare size={16}/> : <Square size={16}/>}
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}

                  {/* تحديد الأعمدة المطلوبة للظهور في جدول التقرير (Dynamic Columns Selection) */}
                  {reportMode === 'table' && (
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-2">الأعمدة المطلوبة (البيانات)</label>
                       <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2 bg-gray-50 dark:bg-slate-800 rounded-2xl">
                          {allColumns.map(col => (
                             <button 
                               key={col.id} 
                               onClick={() => {
                                 const next = selectedCols.includes(col.id) ? selectedCols.filter(c => c !== col.id) : [...selectedCols, col.id];
                                 setSelectedCols(next);
                               }}
                               className={`flex items-center justify-between p-3 rounded-xl transition-all ${selectedCols.includes(col.id) ? 'bg-accent/10 text-accent' : 'text-slate-600 dark:text-slate-400 hover:bg-white'}`}
                             >
                                <div className="flex items-center gap-3"><col.icon size={14}/><span className="text-[10px] font-black">{col.label}</span></div>
                                {selectedCols.includes(col.id) ? <CheckSquare size={16}/> : <Square size={16}/>}
                             </button>
                          ))}
                       </div>
                    </div>
                  )}

                  {/* تخصيص المظهر النهائي للتقرير المطبوع (Visual Toggles) */}
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-2">تخصيص المظهر</label>
                     <div className="space-y-2">
                        {[
                           { label: 'إظهار الشعار الرسمي', state: showLogo, set: setShowLogo },
                           { label: 'إظهار الترويسة الهيكلية', state: showHierarchy, set: setShowHierarchy },
                           { label: 'إظهار التواقيع والاعتماد', state: showSignatures, set: setShowSignatures },
                           { label: 'إظهار العدد الإجمالي', state: showTotalCount, set: setShowTotalCount },
                           { label: 'خطوط الجدول (Zebra)', state: zebraStripes, set: setZebraStripes }
                        ].map((toggle, i) => (
                           <button key={i} onClick={() => toggle.set(!toggle.state)} className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                              <span className="text-[10px] font-black">{toggle.label}</span>
                              <div className={`w-8 h-4 rounded-full relative transition-colors ${toggle.state ? 'bg-accent' : 'bg-slate-200'}`}>
                                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${toggle.state ? 'right-4' : 'right-0.5'}`}></div>
                              </div>
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               {/* أزرار الإجراءات النهائية (تصدير/طباعة) */}
               <div className="pt-6 border-t dark:border-slate-800 flex gap-3">
                  <button onClick={handleExportExcel} className="flex-1 p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 font-black text-xs flex items-center justify-center gap-3 hover:scale-105 transition-all"><Download size={18}/> تصدير Excel</button>
                  <button onClick={() => window.print()} className="flex-1 p-4 bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-slate-900/20"><Printer size={18}/> طباعة التقرير</button>
               </div>
            </div>
         </div>

         {/* 3. لوحة المعاينة (Preview Panel) - هذا الجزء هو الذي يتم طباعته ورقياً */}
         <div className="lg:col-span-8">
            <div className="bg-slate-200 dark:bg-slate-800/40 rounded-[4rem] p-10 min-h-[1000px] flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 relative overflow-hidden">
               <div 
                 className={`bg-white text-slate-900 shadow-2xl origin-top transition-transform duration-500 overflow-hidden relative ${orientation === 'landscape' ? 'w-[1122px]' : 'w-[794px]'}`}
                 style={{ transform: `scale(${previewZoom / 100})`, minHeight: '1123px' }}
               >
                  {/* العلامة المائية الرسمية (Watermark) */}
                  {settings.showWatermark && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none -rotate-45 z-0">
                       <span className="text-[120px] font-black uppercase whitespace-nowrap">{settings.watermarkText}</span>
                    </div>
                  )}

                  <div className="p-16 space-y-12 relative z-10">
                     {/* الترويسة الرسمية للتقرير (Report Header) */}
                     <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8">
                        <div className="text-right space-y-1">
                           {showHierarchy && settings.orgHierarchy.map((h, i) => <p key={i} className={`font-black uppercase ${i === 0 ? 'text-xl' : 'text-[10px] text-slate-500'}`}>{h}</p>)}
                           <p className="text-[9px] font-black text-slate-600 dark:text-slate-400 mt-4">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
                        </div>
                        {showLogo && <img src={settings.logo} className="w-24 h-24 object-contain" />}
                     </div>

                     {/* عنوان التقرير وإحصائيات سريعة */}
                     <div className="text-center space-y-4">
                        <h2 className="text-3xl font-black underline underline-offset-[12px] decoration-slate-100 decoration-8">
                           {reportMode === 'attendance_stats' ? 'تقرير إحصائيات الحضور والغياب' : (attendanceView === 'dropped' && reportMode === 'attendance' ? 'كشف الأفراد المنقطعين عن العمل' : reportTitle)}
                        </h2>
                        {reportMode === 'attendance_stats' && (
                          <div className="flex justify-center items-center gap-8 text-lg font-bold text-slate-600">
                             <p>الفترة من: <span className="underline">{startDate}</span></p>
                             <p>إلى: <span className="underline">{endDate}</span></p>
                          </div>
                        )}
                        {showTotalCount && (
                           <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.3em]">إجمالي عدد السجلات في التقرير: {reportMode === 'attendance_stats' ? aggregatedReportData.length : (attendanceView === 'dropped' && reportMode === 'attendance' ? droppedPersonnel.length : filteredData.length)}</p>
                        )}
                     </div>

                     {/* عرض المحتوى - جدول المنقطعين أو الجدول العام المخصص */}
                     {reportMode === 'attendance_stats' ? (
                        <div className="space-y-10 animate-in slide-in-from-bottom-4">
                           <div className="grid grid-cols-5 gap-4">
                              <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 text-center">
                                 <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">إجمالي الحضور</p>
                                 <h4 className="text-2xl font-black text-emerald-700">{reportSummary.present}</h4>
                              </div>
                              <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 text-center">
                                 <p className="text-[10px] font-black text-blue-600 uppercase mb-2">إجمالي التكليف</p>
                                 <h4 className="text-2xl font-black text-blue-700">{reportSummary.assigned}</h4>
                              </div>
                              <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 text-center">
                                 <p className="text-[10px] font-black text-red-600 uppercase mb-2">إجمالي الغياب</p>
                                 <h4 className="text-2xl font-black text-red-700">{reportSummary.absent}</h4>
                              </div>
                              <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 text-center">
                                 <p className="text-[10px] font-black text-purple-600 uppercase mb-2">إجمالي الأذونات</p>
                                 <h4 className="text-2xl font-black text-purple-700">{reportSummary.disrupted}</h4>
                              </div>
                              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 text-center">
                                 <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase mb-2">إجمالي السجلات</p>
                                 <h4 className="text-2xl font-black text-slate-900">{reportSummary.total}</h4>
                              </div>
                           </div>

                           <table className={`w-full text-right border-collapse ${fontSize}`}>
                              <thead className="bg-slate-900 text-white font-black uppercase">
                                 <tr>
                                    <th className="p-3 border border-slate-800">ت</th>
                                    {reportVisibleColumns.includes('name') && <th className="p-3 border border-slate-800">الرتبة والاسم الكامل</th>}
                                    {reportVisibleColumns.includes('expected') && <th className="p-3 border border-slate-800 text-center">أيام العمل</th>}
                                    {reportVisibleColumns.includes('present') && <th className="p-3 border border-slate-800 text-center">الحضور</th>}
                                    {reportVisibleColumns.includes('assigned') && <th className="p-3 border border-slate-800 text-center">التكليف</th>}
                                    {reportVisibleColumns.includes('absent') && <th className="p-3 border border-slate-800 text-center">الغياب</th>}
                                    {reportVisibleColumns.includes('disrupted') && <th className="p-3 border border-slate-800 text-center">الأذونات</th>}
                                    {reportVisibleColumns.includes('rate') && <th className="p-3 border border-slate-800 text-center">معدل الانضباط</th>}
                                 </tr>
                              </thead>
                              <tbody>
                                 {aggregatedReportData.map((row, idx) => (
                                    <tr key={row.person.id} className={`${zebraStripes && idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'} border border-slate-100`}>
                                       <td className="p-3 border border-slate-100 text-center font-black">{idx + 1}</td>
                                       {reportVisibleColumns.includes('name') && (
                                          <td className="p-3 border border-slate-100">
                                             <p className="font-black text-slate-900 leading-tight">{row.person.name}</p>
                                             <p className="text-[10px] text-accent font-black mt-1 uppercase tracking-widest">{row.person.rank}</p>
                                          </td>
                                       )}
                                       {reportVisibleColumns.includes('expected') && <td className="p-3 border border-slate-100 text-center font-black text-slate-500">{row.expectedDays}</td>}
                                       {reportVisibleColumns.includes('present') && <td className="p-3 border border-slate-100 text-center font-black text-emerald-600">{row.presentCount}</td>}
                                       {reportVisibleColumns.includes('assigned') && <td className="p-3 border border-slate-100 text-center font-black text-blue-600">{row.assignedCount}</td>}
                                       {reportVisibleColumns.includes('absent') && <td className="p-3 border border-slate-100 text-center font-black text-red-600">{row.absentCount}</td>}
                                       {reportVisibleColumns.includes('disrupted') && <td className="p-3 border border-slate-100 text-center font-black text-purple-600">{row.excusedCount}</td>}
                                       {reportVisibleColumns.includes('rate') && (
                                          <td className="p-3 border border-slate-100 text-center font-black">
                                             <span className={row.disciplineRate > 80 ? 'text-emerald-500' : 'text-orange-500'}>{row.disciplineRate}%</span>
                                          </td>
                                       )}
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     ) : (reportMode === 'attendance' && attendanceView === 'dropped' ? (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4">
                           <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100 flex items-center gap-4 mb-8">
                              <AlertTriangle className="text-red-500" size={24}/>
                              <p className="text-xs font-black text-red-700 leading-relaxed">تحتوي هذه القائمة على الأفراد الذين تم تحويلهم آلياً أو يدوياً لفئة "منقطع" بسبب تجاوز أيام الغياب القانونية أو الانقطاع المباشر.</p>
                           </div>
                           <table className={`w-full text-right border-collapse ${fontSize}`}>
                              <thead className="bg-slate-900 text-white font-black uppercase">
                                 <tr>
                                    <th className="p-4 border border-slate-700">ت</th>
                                    <th className="p-4 border border-slate-700">الرتبة</th>
                                    <th className="p-4 border border-slate-700">الاسم الكامل</th>
                                    <th className="p-4 border border-slate-700">الإدارة / الوحدة</th>
                                    <th className="p-4 border border-slate-700">تاريخ الانقطاع</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {droppedPersonnel.map((p, idx) => (
                                    <tr key={p.id} className={`${zebraStripes && idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'} border border-slate-200`}>
                                       <td className="p-4 border border-slate-200 text-center font-bold">{idx + 1}</td>
                                       <td className="p-4 border border-slate-200 font-black text-red-600">{p.rank}</td>
                                       <td className="p-4 border border-slate-200 font-black">{p.name}</td>
                                       <td className="p-4 border border-slate-200 font-bold">{departments.find(d => d.id === p.departmentId)?.name}</td>
                                       <td className="p-4 border border-slate-200 font-black text-center" dir="ltr">{p.lastEditedAt ? new Date(p.lastEditedAt).toLocaleDateString('ar-EG') : '---'}</td>
                                    </tr>
                                 ))}
                                 {droppedPersonnel.length === 0 && (
                                    <tr>
                                       <td colSpan={5} className="p-12 text-center text-slate-300 italic font-black">لا يوجد أفراد منقطعين حالياً في السجلات.</td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     ) : (
                        /* الجدول العام المخصص الذي يتم بناؤه بناءً على اختيارات المستخدم */
                        <table className={`w-full text-right border-collapse ${fontSize}`}>
                           <thead className="bg-slate-900 text-white font-black uppercase">
                              <tr>
                                 <th className="p-3 border border-slate-800">ت</th>
                                 {selectedCols.map(col => (
                                    <th key={col} className="p-3 border border-slate-800">{allColumns.find(c => c.id === col)?.label}</th>
                                 ))}
                              </tr>
                           </thead>
                           <tbody>
                              {filteredData.map((p, idx) => (
                                 <tr key={p.id} className={`${zebraStripes && idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'} border border-slate-100`}>
                                    <td className="p-3 border border-slate-100 text-center font-black">{idx + 1}</td>
                                    {selectedCols.map(col => (
                                       <td key={col} className="p-3 border border-slate-100 font-bold">
                                          {col === 'departmentId' ? departments.find(d => d.id === p.departmentId)?.name : (p as any)[col]}
                                       </td>
                                    ))}
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     ))}

                     {/* خانة التواقيع والاعتماد (Signatures) */}
                     {showSignatures && (
                        <div className="grid grid-cols-3 gap-12 pt-20 border-t-2 border-slate-100">
                           {settings.signatureTitles.map((title, i) => (
                              <div key={i} className="text-center space-y-12">
                                 <p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-[0.3em]">{title}</p>
                                 <div className="h-px w-full bg-slate-100"></div>
                              </div>
                           ))}
                        </div>
                     )}

                     {/* تذييل التقرير الرسمي (Report Footer) */}
                     {showFooter && (
                        <div className="pt-20 text-center">
                           <p className="text-[9px] text-slate-300 font-black italic uppercase tracking-[0.4em] max-w-2xl mx-auto leading-loose">{settings.reportFooter}</p>
                           <div className="mt-8 flex justify-center gap-4 opacity-10">
                              <Shield size={32}/>
                              <Stamp size={32}/>
                              <Binary size={32}/>
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               {/* أدوات التحكم في الزوم والتوجيه (لا تظهر في الطباعة الورقية) */}
               <div className="absolute bottom-10 left-10 flex flex-col gap-2 no-print">
                  <button onClick={() => setPreviewZoom(Math.min(previewZoom + 10, 150))} className="p-3 bg-white rounded-xl shadow-lg hover:text-accent transition-all"><Maximize2 size={18}/></button>
                  <button onClick={() => setPreviewZoom(Math.max(previewZoom - 10, 50))} className="p-3 bg-white rounded-xl shadow-lg hover:text-accent transition-all"><Minimize2 size={18}/></button>
                  <button onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')} className="p-3 bg-white rounded-xl shadow-lg hover:text-accent transition-all"><ArrowDownUp size={18}/></button>
               </div>
            </div>
         </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        @media print { 
          .no-print { display: none !important; } 
          body { background: white !important; margin: 0; padding: 0; }
          .bg-slate-200, .bg-slate-800/40 { background: transparent !important; border: none !important; }
          .shadow-2xl { shadow: none !important; }
          .origin-top { transform: scale(1) !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th { background-color: #000 !important; color: #fff !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default ReportsManager;
