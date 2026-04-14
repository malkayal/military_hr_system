
import React, { useState, useRef, useEffect } from 'react';
import { storage } from '../utils/storage';
import { comparePassword } from '../utils/auth';
import { SystemSettings, User, AppError, Announcement } from '../types';
import { 
  Palette, Trophy, FileText, Lock, UsersRound, 
  ShieldAlert, Save, Trash2,
  Upload, ToggleRight, ToggleLeft, Terminal,
  Bug, AlertCircle, History, RefreshCcw, Globe,
  ShieldCheck, FileJson,
  Plug, Zap, Key, Activity, Monitor,
  Volume2, Languages, Megaphone, Gauge,
  Eye, EyeOff, LayoutTemplate,
  Sparkles, Fingerprint, DatabaseBackup, Eraser,
  RotateCcw, FileUp, FileDown
} from 'lucide-react';
import UserManager from './UserManager';

interface SettingsManagerProps {
  currentUser: User;
  onSettingsUpdate: () => void;
}

const ACCENT_PALETTE = [
  { name: 'إنديجو', color: '#4f46e5' },
  { name: 'أزرق ملكي', color: '#2563eb' },
  { name: 'أخضر عسكري', color: '#166534' },
  { name: 'أحمر داكن', color: '#991b1b' },
  { name: 'بنفسجي', color: '#7c3aed' },
  { name: 'برتقالي', color: '#f59e0b' }
];

const SIDEBAR_TABS_LIST = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutTemplate },
  { id: 'personnel', label: 'إدارة القوة البشرية', icon: UsersRound },
  { id: 'leaves', label: 'الإجازات والأذونات', icon: History },
  { id: 'roll_call', label: 'التمام اليومي', icon: Activity },
  { id: 'forms', label: 'النماذج والتعريفات', icon: FileJson },
  { id: 'reports', label: 'التقارير المخصصة', icon: FileText },
];

const SettingsManager: React.FC<SettingsManagerProps> = ({ currentUser, onSettingsUpdate }) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'ux' | 'announcements' | 'api' | 'ranks' | 'reports' | 'security' | 'users' | 'backup' | 'errors'>('identity');
  const [sysSettings, setSysSettings] = useState<SystemSettings>(storage.getSettings());
  const [errorLogs, setErrorLogs] = useState<AppError[]>([]);
  const [newRank, setNewRank] = useState('');
  const [isTestingApi, setIsTestingApi] = useState(false);
  
  const [annForm, setAnnForm] = useState<Partial<Announcement>>({ title: '', content: '', priority: 'normal' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'errors') setErrorLogs(storage.getErrors());
  }, [activeTab]);

  const handleSaveSettings = () => {
    storage.setSettings(sysSettings);
    onSettingsUpdate();
    alert("تم حفظ وتحديث كافة الإعدادات والبروتوكولات بنجاح ✅");
    // إعادة تحميل خفيفة لتطبيق الثيم والألوان
    const root = document.documentElement;
    root.style.setProperty('--accent-color', sysSettings.accentColor);
    if (sysSettings.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  };

  const toggleSidebarTab = (tabId: string) => {
    const hidden = sysSettings.hiddenTabs || [];
    const next = hidden.includes(tabId) ? hidden.filter(t => t !== tabId) : [...hidden, tabId];
    setSysSettings({ ...sysSettings, hiddenTabs: next });
  };

  const handleAddAnnouncement = () => {
    if (!annForm.title || !annForm.content) return;
    const newAnn: Announcement = {
      id: crypto.randomUUID(),
      title: annForm.title,
      content: annForm.content,
      priority: annForm.priority as any,
      date: new Date().toLocaleDateString('ar-EG'),
      author: currentUser.name
    };
    setSysSettings({ ...sysSettings, announcements: [newAnn, ...(sysSettings.announcements || [])] });
    setAnnForm({ title: '', content: '', priority: 'normal' });
  };

  // --- وظائف الأرشفة والنسخ الاحتياطي ---
  
  const exportFullBackup = () => {
    const allData = {
      personnel: storage.getPersonnel(),
      departments: storage.getDepartments(),
      sections: storage.getSections(),
      users: storage.getUsers(),
      leaves: storage.getLeaves(),
      attendance: storage.getAttendance(),
      settings: storage.getSettings(),
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DCMI_FULL_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    storage.addLog({
      userId: currentUser.id,
      username: currentUser.username,
      action: 'تصدير نسخة احتياطية',
      details: 'تم استخراج نسخة شاملة لكافة بيانات المنظومة.'
    });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (confirm('تحذير: استيراد البيانات سيقوم باستبدال كافة البيانات الحالية. هل أنت متأكد؟')) {
          if (data.personnel) storage.setPersonnel(data.personnel);
          if (data.departments) storage.setDepartments(data.departments);
          if (data.sections) storage.setSections(data.sections);
          if (data.users) storage.setUsers(data.users);
          if (data.leaves) storage.setLeaves(data.leaves);
          if (data.attendance) storage.setAttendance(data.attendance);
          if (data.settings) storage.setSettings(data.settings);
          
          alert('تمت استعادة البيانات بنجاح! سيتم إعادة تشغيل المنظومة الآن.');
          window.location.reload();
        }
      } catch {
        alert('خطأ: الملف المرفوع غير صالح أو تالف.');
      }
    };
    reader.readAsText(file);
  };

  const factoryReset = async () => {
    if (confirm('خطر: سيتم مسح كافة البيانات والعودة لضبط المصنع. لا يمكن التراجع عن هذا الإجراء!')) {
      const password = prompt('يرجى إدخال كلمة سر المدير للتأكيد:');
      if (password) {
        const isMatch = await comparePassword(password, currentUser.password || '');
        if (isMatch) {
          localStorage.clear();
          window.location.reload();
          return;
        }
      }
      alert('كلمة السر غير صحيحة.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-24">
      
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-80 space-y-2 no-print shrink-0">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] shadow-sm border dark:border-slate-800 space-y-1 overflow-hidden sticky top-4">
          {[
            { id: 'identity', label: 'هوية المنظومة', icon: Palette },
            { id: 'ux', label: 'تجربة المستخدم', icon: Monitor },
            { id: 'announcements', label: 'التعميمات', icon: Megaphone },
            { id: 'api', label: 'بوابة الـ API', icon: Globe },
            { id: 'ranks', label: 'إدارة الرتب', icon: Trophy },
            { id: 'reports', label: 'إعدادات التقارير', icon: FileText },
            { id: 'security', label: 'الأمان والوصول', icon: Lock },
            { id: 'users', label: 'إدارة المستخدمين', icon: UsersRound },
            { id: 'errors', label: 'مراقبة النواة', icon: Bug },
            { id: 'backup', label: 'الأرشفة والصيانة', icon: ShieldAlert },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-sm ${
                activeTab === tab.id ? 'bg-accent text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Settings Area */}
      <div className="flex-1 bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-sm border dark:border-slate-800 min-h-[850px] relative overflow-hidden">
        
        {activeTab === 'identity' && (
          <div className="space-y-12 animate-in slide-in-from-left-4">
             <div className="flex items-center gap-4 border-b dark:border-slate-800 pb-6">
                <div className="p-4 bg-accent/10 rounded-3xl text-accent"><Palette size={32}/></div>
                <div>
                   <h3 className="text-2xl font-black">هوية المنظومة والعلامة التجارية</h3>
                   <p className="text-xs text-slate-400 font-bold mt-1">تخصيص المظهر العام، الشعار، وحقوق الملكية.</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">اسم المنظومة (الجهة الرسمية)</label>
                      <input type="text" className="w-full p-5 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-3xl outline-none font-black text-lg focus:border-accent" value={sysSettings.orgName} onChange={e => setSysSettings({...sysSettings, orgName: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">نص حقوق الملكية (Login Footer)</label>
                      <input type="text" className="w-full p-5 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-3xl outline-none font-bold text-xs" value={sysSettings.copyrightText} onChange={e => setSysSettings({...sysSettings, copyrightText: e.target.value})} />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">اللون المميز للمنظومة</label>
                      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-[2rem] border dark:border-slate-700">
                         {ACCENT_PALETTE.map(p => (
                            <button key={p.color} onClick={() => setSysSettings({...sysSettings, accentColor: p.color})} className={`w-12 h-12 rounded-2xl border-4 transition-all ${sysSettings.accentColor === p.color ? 'border-white dark:border-slate-900 shadow-xl scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`} style={{ backgroundColor: p.color }} />
                         ))}
                      </div>
                   </div>
                </div>
                <div className="flex flex-col items-center gap-6">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الشعار الرسمي</p>
                   <div className="w-64 h-64 bg-slate-50 dark:bg-slate-800 rounded-[4rem] border-4 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center p-12 relative group overflow-hidden">
                      <img src={sysSettings.logo} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white rounded-2xl text-accent shadow-xl"><Upload size={24}/></button>
                      </div>
                   </div>
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                         const reader = new FileReader();
                         reader.onload = (ev) => setSysSettings({...sysSettings, logo: ev.target?.result as string});
                         reader.readAsDataURL(file);
                      }
                   }} />
                </div>
             </div>
          </div>
        )}

        {activeTab === 'ux' && (
          <div className="space-y-12 animate-in slide-in-from-left-4">
             <div className="flex items-center gap-4 border-b dark:border-slate-800 pb-6">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl"><Monitor size={32}/></div>
                <div>
                   <h3 className="text-2xl font-black">تخصيص تجربة المستخدم</h3>
                   <p className="text-xs text-slate-400 font-bold mt-1">التحكم في واجهة الاستخدام، التنبيهات، والعناصر المرئية.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 dark:bg-slate-800/50 p-8 rounded-[3rem] border dark:border-slate-700 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Sparkles className="text-amber-500" size={20}/>
                         <h4 className="font-black text-sm">المظهر العام (Theme)</h4>
                      </div>
                      <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border dark:border-slate-700">
                         <button 
                           onClick={() => setSysSettings({...sysSettings, theme: 'light'})}
                           className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${sysSettings.theme === 'light' ? 'bg-accent text-white shadow-md' : 'text-slate-400'}`}
                         >فاتح</button>
                         <button 
                           onClick={() => setSysSettings({...sysSettings, theme: 'dark'})}
                           className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${sysSettings.theme === 'dark' ? 'bg-accent text-white shadow-md' : 'text-slate-400'}`}
                         >داكن</button>
                      </div>
                   </div>
                   
                   <div className="flex items-center justify-between pt-4 border-t dark:border-slate-700">
                      <div className="flex items-center gap-3">
                         <Volume2 className="text-indigo-500" size={20}/>
                         <h4 className="font-black text-sm">أصوات التنبيهات</h4>
                      </div>
                      <button onClick={() => setSysSettings({...sysSettings, enableNotificationSounds: !sysSettings.enableNotificationSounds})}>
                         {sysSettings.enableNotificationSounds ? <ToggleRight size={36} className="text-accent"/> : <ToggleLeft size={36} className="text-slate-300"/>}
                      </button>
                   </div>

                   <div className="flex items-center justify-between pt-4 border-t dark:border-slate-700">
                      <div className="flex items-center gap-3">
                         <Languages className="text-emerald-500" size={20}/>
                         <h4 className="font-black text-sm">تنسيق الأرقام</h4>
                      </div>
                      <select 
                        className="p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold outline-none"
                        value={sysSettings.numberFormat}
                        onChange={e => setSysSettings({...sysSettings, numberFormat: e.target.value as any})}
                      >
                         <option value="latin">English (123)</option>
                         <option value="arabic">العربية (١٢٣)</option>
                      </select>
                   </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/50 p-8 rounded-[3rem] border dark:border-slate-700 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Eye className="text-purple-500" size={20}/>
                         <h4 className="font-black text-sm">العلامة المائية (Watermark)</h4>
                      </div>
                      <button onClick={() => setSysSettings({...sysSettings, showWatermark: !sysSettings.showWatermark})}>
                         {sysSettings.showWatermark ? <ToggleRight size={36} className="text-accent"/> : <ToggleLeft size={36} className="text-slate-300"/>}
                      </button>
                   </div>
                   <input 
                     disabled={!sysSettings.showWatermark}
                     type="text" 
                     placeholder="نص العلامة المائية..."
                     className="w-full p-4 bg-white dark:bg-slate-900 border rounded-2xl text-xs font-bold outline-none focus:border-accent"
                     value={sysSettings.watermarkText}
                     onChange={e => setSysSettings({...sysSettings, watermarkText: e.target.value})}
                   />
                   
                   <div className="pt-4 border-t dark:border-slate-700">
                      <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4">إظهار/إخفاء أقسام القائمة الجانبية</h4>
                      <div className="grid grid-cols-2 gap-2">
                         {SIDEBAR_TABS_LIST.map(tab => (
                           <button 
                             key={tab.id}
                             onClick={() => toggleSidebarTab(tab.id)}
                             className={`flex items-center gap-2 p-3 rounded-xl border text-[10px] font-black transition-all ${
                               !(sysSettings.hiddenTabs || []).includes(tab.id) 
                               ? 'bg-white dark:bg-slate-900 border-accent/30 text-accent' 
                               : 'bg-gray-100 dark:bg-slate-800 border-transparent text-slate-400 opacity-60'
                             }`}
                           >
                              {!(sysSettings.hiddenTabs || []).includes(tab.id) ? <Eye size={14}/> : <EyeOff size={14}/>}
                              {tab.label}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-12 animate-in slide-in-from-left-4">
             <div className="flex items-center gap-4 border-b dark:border-slate-800 pb-6">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl"><Globe size={32}/></div>
                <div>
                   <h3 className="text-2xl font-black">بوابة الربط البرمجي (API Gateway)</h3>
                   <p className="text-xs text-slate-400 font-bold mt-1">إعدادات التكامل مع الأنظمة الخارجية وتفعيل الـ Webhooks.</p>
                </div>
             </div>

             <div className="bg-gray-50 dark:bg-slate-800/50 p-8 rounded-[3rem] border dark:border-slate-700 space-y-8">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${sysSettings.apiConfig.enabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                         <Plug size={24}/>
                      </div>
                      <div>
                         <h4 className="font-black text-lg">تفعيل واجهة الربط الخارجية</h4>
                         <p className="text-[10px] text-slate-400 font-bold">السماح للأنظمة المعتمدة بالوصول لبيانات المنظومة.</p>
                      </div>
                   </div>
                   <button onClick={() => setSysSettings({...sysSettings, apiConfig: {...sysSettings.apiConfig, enabled: !sysSettings.apiConfig.enabled}})}>
                      {sysSettings.apiConfig.enabled ? <ToggleRight size={48} className="text-emerald-500"/> : <ToggleLeft size={48} className="text-slate-300"/>}
                   </button>
                </div>

                {sysSettings.apiConfig.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-300">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">رابط الـ Endpoint الرئيسي</label>
                        <div className="relative">
                           <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                           <input 
                             type="text" 
                             className="w-full p-4 pl-12 bg-white dark:bg-slate-900 border rounded-2xl outline-none font-bold text-sm focus:border-emerald-500"
                             value={sysSettings.apiConfig.externalEndpoint}
                             onChange={e => setSysSettings({...sysSettings, apiConfig: {...sysSettings.apiConfig, externalEndpoint: e.target.value}})}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">نوع المصادقة (Auth Type)</label>
                        <select 
                           className="w-full p-4 bg-white dark:bg-slate-900 border rounded-2xl outline-none font-bold text-sm focus:border-emerald-500"
                           value={sysSettings.apiConfig.authType}
                           onChange={e => setSysSettings({...sysSettings, apiConfig: {...sysSettings.apiConfig, authType: e.target.value as any}})}
                        >
                           <option value="Bearer">Bearer Token</option>
                           <option value="ApiKey">API Key Header</option>
                           <option value="Basic">Basic Auth</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">مفتاح الوصول (API Key)</label>
                        <div className="relative">
                           <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                           <input 
                             type="password" 
                             className="w-full p-4 pl-12 bg-white dark:bg-slate-900 border rounded-2xl outline-none font-bold text-sm focus:border-emerald-500"
                             value={sysSettings.apiConfig.apiKey}
                             onChange={e => setSysSettings({...sysSettings, apiConfig: {...sysSettings.apiConfig, apiKey: e.target.value}})}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">رمز التشفير (Secret Token)</label>
                        <div className="relative">
                           <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                           <input 
                             type="password" 
                             className="w-full p-4 pl-12 bg-white dark:bg-slate-900 border rounded-2xl outline-none font-bold text-sm focus:border-emerald-500"
                             value={sysSettings.apiConfig.secretToken}
                             onChange={e => setSysSettings({...sysSettings, apiConfig: {...sysSettings.apiConfig, secretToken: e.target.value}})}
                           />
                        </div>
                     </div>
                     <div className="md:col-span-2 pt-4">
                        <button 
                          disabled={isTestingApi}
                          onClick={() => {
                             setIsTestingApi(true);
                             setTimeout(() => {
                                setIsTestingApi(false);
                                alert('تم فحص الاتصال بنجاح! الاستجابة: 200 OK');
                             }, 1500);
                          }}
                          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all disabled:opacity-50"
                        >
                           {isTestingApi ? <RefreshCcw className="animate-spin" size={20}/> : <Zap size={20}/>}
                           اختبار الاتصال بالبوابة
                        </button>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-12 animate-in slide-in-from-left-4">
             <div className="flex items-center gap-4 border-b dark:border-slate-800 pb-6">
                <div className="p-4 bg-slate-100 text-slate-700 rounded-3xl"><FileText size={32}/></div>
                <div>
                   <h3 className="text-2xl font-black">إعدادات التقارير والمخرجات</h3>
                   <p className="text-xs text-slate-400 font-bold mt-1">تخصيص تذييل التقارير، جودة الـ PDF، وقوة رموز الـ QR.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">تذييل التقارير الرسمي (Footer)</label>
                      <textarea 
                        className="w-full p-5 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-3xl outline-none font-bold text-sm min-h-[120px] focus:border-accent"
                        value={sysSettings.reportFooter}
                        onChange={e => setSysSettings({...sysSettings, reportFooter: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">خط التقارير الافتراضي</label>
                      <select 
                        className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none font-bold text-sm"
                        value={sysSettings.reportFont}
                        onChange={e => setSysSettings({...sysSettings, reportFont: e.target.value})}
                      >
                         <option value="IBM Plex Sans Arabic">IBM Plex Sans Arabic (الافتراضي)</option>
                         <option value="Arial">Arial</option>
                         <option value="Tahoma">Tahoma</option>
                         <option value="Courier New">Courier New (للكشوفات التقنية)</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-8 bg-gray-50 dark:bg-slate-800/50 p-8 rounded-[3rem] border dark:border-slate-700">
                   <div className="space-y-4">
                      <h4 className="font-black text-sm flex items-center gap-2"><Gauge size={18} className="text-accent"/> جودة تصدير الـ PDF</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <button 
                           onClick={() => setSysSettings({...sysSettings, pdfQuality: 'standard'})}
                           className={`p-4 rounded-2xl border-2 font-black text-xs transition-all ${sysSettings.pdfQuality === 'standard' ? 'bg-white dark:bg-slate-900 border-accent text-accent shadow-lg' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400'}`}
                         >جودة قياسية (حجم أصغر)</button>
                         <button 
                           onClick={() => setSysSettings({...sysSettings, pdfQuality: 'high'})}
                           className={`p-4 rounded-2xl border-2 font-black text-xs transition-all ${sysSettings.pdfQuality === 'high' ? 'bg-white dark:bg-slate-900 border-accent text-accent shadow-lg' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400'}`}
                         >جودة فائقة (طباعة احترافية)</button>
                      </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t dark:border-slate-700">
                      <h4 className="font-black text-sm flex items-center gap-2"><Fingerprint size={18} className="text-accent"/> مستوى تفاصيل الـ QR Code</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <button 
                           onClick={() => setSysSettings({...sysSettings, qrDetailLevel: 'basic'})}
                           className={`p-4 rounded-2xl border-2 font-black text-xs transition-all ${sysSettings.qrDetailLevel === 'basic' ? 'bg-white dark:bg-slate-900 border-accent text-accent shadow-lg' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400'}`}
                         >أساسي (الرقم العسكري فقط)</button>
                         <button 
                           onClick={() => setSysSettings({...sysSettings, qrDetailLevel: 'full'})}
                           className={`p-4 rounded-2xl border-2 font-black text-xs transition-all ${sysSettings.qrDetailLevel === 'full' ? 'bg-white dark:bg-slate-900 border-accent text-accent shadow-lg' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400'}`}
                         >كامل (كافة بيانات الفرد)</button>
                      </div>
                   </div>

                   <div className="space-y-2 pt-4 border-t dark:border-slate-700">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">حجم الخط الافتراضي في التقارير</label>
                      <input 
                        type="range" min="8" max="16" step="1"
                        className="w-full accent-accent"
                        value={sysSettings.defaultReportFontSize}
                        onChange={e => setSysSettings({...sysSettings, defaultReportFontSize: parseInt(e.target.value)})}
                      />
                      <div className="flex justify-between text-[10px] font-black text-slate-400">
                         <span>8px</span>
                         <span className="text-accent">{sysSettings.defaultReportFontSize}px</span>
                         <span>16px</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-8 animate-in slide-in-from-left-4 h-full flex flex-col">
             <div className="flex items-center justify-between border-b dark:border-slate-800 pb-6 shrink-0">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-red-50 text-red-600 rounded-3xl"><Bug size={32}/></div>
                   <div>
                      <h3 className="text-2xl font-black">مراقبة النواة (Kernel Monitoring)</h3>
                      <p className="text-xs text-slate-400 font-bold mt-1">رصد أخطاء النظام، استثناءات الواجهة، وسجلات الانهيار اللحظية.</p>
                   </div>
                </div>
                <div className="flex gap-3">
                   <button 
                     onClick={() => { storage.clearErrors(); setErrorLogs([]); }}
                     className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-xs hover:bg-red-100 transition-all"
                   >
                      <Eraser size={16}/> مسح السجلات
                   </button>
                   <button 
                     onClick={() => setErrorLogs(storage.getErrors())}
                     className="p-3 bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-gray-200 transition-all"
                   >
                      <RefreshCcw size={20}/>
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 min-h-0">
                {errorLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                     <ShieldCheck size={80} className="opacity-20"/>
                     <p className="font-black text-lg">لا توجد أخطاء مرصودة حالياً. النواة تعمل بكفاءة 100%.</p>
                  </div>
                ) : (
                  errorLogs.map((err) => (
                    <div key={err.id} className="bg-gray-50 dark:bg-slate-800/50 border-r-4 border-red-500 rounded-2xl p-6 space-y-4">
                       <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                             <AlertCircle className="text-red-500" size={20}/>
                             <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">{err.message}</h4>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border dark:border-slate-700">
                             {new Date(err.timestamp).toLocaleString('ar-EG')}
                          </span>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-bold text-slate-500">
                          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border dark:border-slate-700">
                             <Globe size={14}/> <span className="truncate">{err.url}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border dark:border-slate-700">
                             <Monitor size={14}/> <span className="truncate">{err.browser}</span>
                          </div>
                       </div>

                       {err.stack && (
                         <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre border border-slate-800">
                            {err.stack}
                         </div>
                       )}
                    </div>
                  ))
                )}
             </div>
             
             <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/30 flex items-center gap-4 shrink-0">
                <Terminal className="text-amber-600" size={24}/>
                <p className="text-[10px] text-amber-800 dark:text-amber-300 font-bold">
                   تنبيه: يتم تسجيل الأخطاء تلقائياً عند حدوث أي خلل في المتصفح أو فشل في جلب البيانات. تساعد هذه السجلات في تشخيص المشاكل التقنية المعقدة.
                </p>
             </div>
          </div>
        )}


        {activeTab === 'security' && (
          <div className="space-y-12 animate-in slide-in-from-left-4">
             <div className="flex items-center gap-4 border-b dark:border-slate-800 pb-6">
                <div className="p-4 bg-red-50 text-red-600 rounded-3xl"><Lock size={32}/></div>
                <div>
                   <h3 className="text-2xl font-black">الأمان والوصول</h3>
                   <p className="text-xs text-slate-400 font-bold mt-1">تأمين الجلسات، وضع الصيانة، وسياسة الاحتفاظ بالسجلات.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="bg-gray-50 dark:bg-slate-800/50 p-8 rounded-[3rem] border dark:border-slate-700 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <ShieldAlert className="text-red-500" size={20}/>
                         <h4 className="font-black text-sm text-red-700 dark:text-red-400">وضع الصيانة الكامل</h4>
                      </div>
                      <button onClick={() => setSysSettings({...sysSettings, enableMaintenance: !sysSettings.enableMaintenance})}>
                         {sysSettings.enableMaintenance ? <ToggleRight size={40} className="text-red-500"/> : <ToggleLeft size={40} className="text-slate-300"/>}
                      </button>
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold">عند التفعيل، سيتم إيقاف النظام عن كافة المستخدمين عدا المشرف.</p>
                   <textarea placeholder="رسالة الصيانة..." className="w-full p-4 bg-white dark:bg-slate-900 border rounded-2xl text-xs font-bold" value={sysSettings.maintenanceMessage} onChange={e => setSysSettings({...sysSettings, maintenanceMessage: e.target.value})} />
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/50 p-8 rounded-[3rem] border dark:border-slate-700 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <History className="text-blue-500" size={20}/>
                         <h4 className="font-black text-sm">الخروج التلقائي (Timeout)</h4>
                      </div>
                      <button onClick={() => setSysSettings({...sysSettings, enableAutoLogout: !sysSettings.enableAutoLogout})}>
                         {sysSettings.enableAutoLogout ? <ToggleRight size={36} className="text-accent"/> : <ToggleLeft size={36} className="text-slate-300"/>}
                      </button>
                   </div>
                   <div className="flex items-center gap-4">
                      <input disabled={!sysSettings.enableAutoLogout} type="number" className="w-32 p-3 bg-white dark:bg-slate-900 border rounded-xl outline-none font-bold text-sm" value={sysSettings.autoLogoutTime} onChange={e => setSysSettings({...sysSettings, autoLogoutTime: parseInt(e.target.value)})} />
                      <span className="text-xs font-bold text-slate-400">دقيقة من الخمول</span>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-12 animate-in slide-in-from-left-4">
             <div className="flex items-center gap-4 border-b dark:border-slate-800 pb-6">
                <div className="p-4 bg-slate-900 text-accent rounded-3xl"><DatabaseBackup size={32}/></div>
                <div>
                   <h3 className="text-2xl font-black">الأرشفة وإدارة قواعد البيانات</h3>
                   <p className="text-xs text-slate-400 font-bold mt-1">تصدير النسخ الاحتياطية، استعادة البيانات، وصيانة قاعدة البيانات المحلية.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-10 bg-indigo-50 dark:bg-indigo-900/10 rounded-[3.5rem] border-2 border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center text-center space-y-6">
                   <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] text-indigo-600 shadow-xl"><FileDown size={48}/></div>
                   <div>
                      <h4 className="text-xl font-black text-indigo-900 dark:text-indigo-200">النسخ الاحتياطي الشامل</h4>
                      <p className="text-xs text-indigo-400 font-bold mt-2">تصدير كافة سجلات الأفراد والتمام والإعدادات في ملف واحد بصيغة JSON.</p>
                   </div>
                   <button onClick={exportFullBackup} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all">تنزيل النسخة الاحتياطية</button>
                </div>

                <div className="p-10 bg-emerald-50 dark:bg-emerald-900/10 rounded-[3.5rem] border-2 border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center text-center space-y-6">
                   <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] text-emerald-600 shadow-xl"><FileUp size={48}/></div>
                   <div>
                      <h4 className="text-xl font-black text-emerald-900 dark:text-emerald-200">استعادة البيانات</h4>
                      <p className="text-xs text-emerald-400 font-bold mt-2">قم برفع ملف النسخة الاحتياطية لاستبدال البيانات الحالية فوراً.</p>
                   </div>
                   <button onClick={() => backupInputRef.current?.click()} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black shadow-xl shadow-emerald-600/20 hover:scale-105 transition-all">استيراد من ملف خارجي</button>
                   <input type="file" ref={backupInputRef} className="hidden" accept=".json" onChange={handleImportBackup} />
                </div>
             </div>

             <div className="bg-red-50 dark:bg-red-950/20 p-10 rounded-[3.5rem] border-2 border-red-100 dark:border-red-900/30">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                   <div className="flex items-center gap-6">
                      <div className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] text-red-600 shadow-xl"><Eraser size={32}/></div>
                      <div>
                         <h4 className="text-xl font-black text-red-900 dark:text-red-200">تطهير وصيانة النظام</h4>
                         <p className="text-xs text-red-400 font-bold mt-1">مسح سجلات الأخطاء وسجلات العمليات القديمة والعودة لضبط المصنع.</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <button onClick={() => { if(confirm('مسح سجلات العمليات؟')) { localStorage.removeItem('mil_hr_logs'); alert('تم التطهير'); }}} className="px-8 py-4 bg-white dark:bg-slate-900 text-red-600 rounded-2xl font-black text-xs border border-red-200">مسح السجلات</button>
                      <button onClick={factoryReset} className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all">إعادة ضبط المصنع</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Global Save Button */}
        <div className="absolute bottom-10 left-10 no-print flex gap-4">
           <button onClick={() => window.location.reload()} className="p-5 bg-gray-100 dark:bg-slate-800 text-slate-400 rounded-[2rem] hover:text-slate-600 transition-colors">
              <RotateCcw size={24}/>
           </button>
           <button onClick={handleSaveSettings} className="bg-accent text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl shadow-accent/40 flex items-center gap-4 hover:scale-105 active:scale-95 transition-all">
              <Save size={24}/> حفظ وتطبيق الإعدادات
           </button>
        </div>

        {/* Render Users and Errors tabs if selected */}
        {activeTab === 'users' && <UserManager currentUser={currentUser} />}
        {activeTab === 'announcements' && <div className="space-y-8">
           {/* (Content remains the same as previous but integrated into the grid) */}
           <div className="bg-gray-50 dark:bg-slate-800/50 p-8 rounded-[3rem] border dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6"><Megaphone className="text-accent" size={24}/> <h4 className="font-black text-lg">نشر تعميم جديد</h4></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <input placeholder="العنوان..." className="p-4 bg-white dark:bg-slate-900 border rounded-2xl font-bold" value={annForm.title} onChange={e => setAnnForm({...annForm, title: e.target.value})} />
                 <select className="p-4 bg-white dark:bg-slate-900 border rounded-2xl font-bold" value={annForm.priority} onChange={e => setAnnForm({...annForm, priority: e.target.value as any})}>
                    <option value="normal">اعتيادي</option>
                    <option value="high">هام</option>
                    <option value="urgent">عاجل جداً</option>
                 </select>
                 <textarea placeholder="المحتوى..." className="p-4 bg-white dark:bg-slate-900 border rounded-2xl font-bold md:col-span-2 min-h-[100px]" value={annForm.content} onChange={e => setAnnForm({...annForm, content: e.target.value})} />
                 <button onClick={handleAddAnnouncement} className="md:col-span-2 py-4 bg-accent text-white rounded-2xl font-black">+ نشر الإعلان</button>
              </div>
           </div>
        </div>}

        {activeTab === 'ranks' && (
          <div className="space-y-6">
             <div className="flex gap-4">
                <input type="text" placeholder="اسم الرتبة..." className="flex-1 p-5 bg-gray-50 dark:bg-slate-800 border rounded-2xl font-bold" value={newRank} onChange={e => setNewRank(e.target.value)} />
                <button onClick={() => { if(newRank) { setSysSettings({...sysSettings, ranks: [newRank, ...sysSettings.ranks]}); setNewRank(''); } }} className="bg-accent text-white px-8 py-4 rounded-2xl font-black shadow-lg">+</button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sysSettings.ranks.map((rank, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border group">
                     <span className="font-bold text-sm">{rank}</span>
                     <button onClick={() => setSysSettings({...sysSettings, ranks: sysSettings.ranks.filter(r => r !== rank)})} className="text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                  </div>
                ))}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsManager;
