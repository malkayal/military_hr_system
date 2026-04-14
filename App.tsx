
import React, { useState, useEffect, useCallback } from 'react';
import { User, SystemSettings, UserRole } from './types';
import { storage } from './utils/storage';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PersonnelManager from './components/PersonnelManager';
import LeavesManager from './components/LeavesManager';
import DailyRollCall from './components/DailyRollCall';
import AdminManager from './components/AdminManager';
import ReportsManager from './components/ReportsManager';
import SettingsManager from './components/SettingsManager';
import FormsManager from './components/FormsManager';
import PromotionsManager from './components/PromotionsManager';
import { CheckCircle2, AlertOctagon, Menu } from 'lucide-react';

import { MAIN_TABS } from './constants/tabs';

/**
 * المكون الرئيسي للتطبيق (Root Component)
 * يدير حالة المستخدم الحالي، التنقل بين الصفحات (Tabs)، الإعدادات العامة، ونظام رصد الأخطاء
 */
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<typeof MAIN_TABS[number]['id']>('dashboard');
  const [settings, setSettings] = useState<SystemSettings>(storage.getSettings());
  const [welcomeUser, setWelcomeUser] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTabChanging, setIsTabChanging] = useState(false);

  const activeTabConfig = MAIN_TABS.find(t => t.id === activeTab);

  const applyTheme = (s: SystemSettings) => {
    if (s.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    document.documentElement.style.setProperty('--accent-color', s.accentColor);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    storage.setCurrentUser(null);
  };

  const handleSettingsUpdate = () => {
    const newSettings = storage.getSettings();
    setSettings(newSettings);
    applyTheme(newSettings);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    storage.setCurrentUser(user);
    setWelcomeUser(user.name);
    setTimeout(() => setWelcomeUser(null), 4000);
  };

  const handleTabChange = useCallback((tab: typeof activeTab) => {
    if (tab === activeTab) return;
    setIsTabChanging(true);
    setActiveTab(tab);
    setTimeout(() => setIsTabChanging(false), 300);
  }, [activeTab]);

  // نظام رصد الأخطاء العالمي
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      storage.addError({
        message: event.message,
        stack: event.error?.stack || 'No stack trace'
      });
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      storage.addError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack || 'No stack trace'
      });
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (!currentUser || !settings.enableAutoLogout) return;
    let logoutTimer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => { handleLogout(); }, settings.autoLogoutTime * 60 * 1000);
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    resetTimer();
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      clearTimeout(logoutTimer);
    };
  }, [currentUser, settings.enableAutoLogout, settings.autoLogoutTime]);

  // استعادة المستخدم عند التحميل الأول فقط
  useEffect(() => {
    const user = storage.getCurrentUser();
    if (user) setCurrentUser(user);
  }, []);

  // تطبيق الثيم عند تغيير الإعدادات فقط
  useEffect(() => {
    applyTheme(settings);
  }, [settings]);

  if (currentUser && settings.enableMaintenance && currentUser.role !== UserRole.SUPERVISOR) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center text-white">
         <div className="max-w-md space-y-6">
            <AlertOctagon size={80} className="text-red-500 mx-auto animate-pulse" />
            <h1 className="text-3xl font-black">المنظومة في وضع الصيانة</h1>
            <p className="text-slate-400 font-bold">{settings.maintenanceMessage}</p>
            <button onClick={handleLogout} className="bg-white text-slate-900 px-8 py-3 rounded-xl font-black">خروج</button>
         </div>
      </div>
    );
  }

  if (!currentUser) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {welcomeUser && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl border border-accent flex items-center gap-4 animate-in slide-in-from-top-10 duration-500 max-w-[90%] text-center">
           <CheckCircle2 className="text-accent shrink-0" size={24}/>
           <p className="font-black text-sm truncate">مرحباً بك، {welcomeUser}</p>
        </div>
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        onLogout={handleLogout} 
        currentUser={currentUser} 
        settings={settings}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
        <header className="mb-6 flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border-r-4 border-accent">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-gray-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300"
            >
              <Menu size={24}/>
            </button>
            <div>
              <h1 className="text-lg md:text-2xl font-black text-gray-800 dark:text-white truncate max-w-[150px] md:max-w-none">
                {activeTab === 'dashboard' && 'لوحة التحكم'}
                {activeTab === 'personnel' && 'إدارة القوة'}
                {activeTab === 'leaves' && 'الإجازات'}
                {activeTab === 'roll_call' && 'تمام الحضور والغياب'}
                {activeTab === 'promotions' && 'إدارة الترقيات'}
                {activeTab === 'forms' && 'النماذج'}
                {activeTab === 'reports' && 'التقارير والإحصائيات'}
                {activeTab === 'admin' && 'إدارة الوحدات'}
                {activeTab === 'settings' && 'الإعدادات'}
              </h1>
            </div>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 dark:bg-slate-800 rounded-lg p-1 border dark:border-slate-700 shadow-sm">
             <img src={settings.logo} className="w-full h-full object-contain" />
          </div>
        </header>

        <div className={`transition-all duration-300 pb-10 ${isTabChanging ? 'opacity-0' : 'opacity-100'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard onNavigate={handleTabChange} />}
              {activeTab === 'personnel' && <PersonnelManager currentUser={currentUser} />}
              {activeTab === 'leaves' && <LeavesManager currentUser={currentUser} />}
              {activeTab === 'roll_call' && <DailyRollCall currentUser={currentUser} />}
              {activeTab === 'promotions' && <PromotionsManager currentUser={currentUser} />}
              {activeTab === 'forms' && <FormsManager currentUser={currentUser} />}
              {activeTab === 'reports' && <ReportsManager currentUser={currentUser} />}
              {activeTab === 'admin' && <AdminManager currentUser={currentUser} onSettingsUpdate={handleSettingsUpdate} />}
              {activeTab === 'settings' && <SettingsManager currentUser={currentUser} onSettingsUpdate={handleSettingsUpdate} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default App;
