import React from 'react';
import { UserRole, SystemSettings, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, UsersRound, X } from 'lucide-react';
import { MAIN_TABS, TabConfig } from '../constants/tabs';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  currentUser: User;
  settings: SystemSettings;
  isOpen?: boolean;
  onClose?: () => void;
}

const SidebarItem: React.FC<{
  item: TabConfig;
  isActive: boolean;
  onClick: (id: string) => void;
}> = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  return (
    <motion.button
      onClick={() => onClick(item.id)}
      whileHover={{ x: isActive ? 4 : 8 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-xl transition-all duration-200 relative group ${
        isActive 
          ? 'bg-accent text-white shadow-lg shadow-accent/20' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
      }`}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-accent rounded-xl -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </AnimatePresence>
      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} />
      <span className="font-bold text-sm">{item.label}</span>
    </motion.button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, currentUser, settings, isOpen, onClose }) => {
  const isTabHidden = (id: string) => settings.hiddenTabs?.includes(id);

  const accessibleTabs = MAIN_TABS.filter(tab => {
    if (isTabHidden(tab.id)) return false;
    if (tab.requiredRole && currentUser.role !== tab.requiredRole) return false;
    if (tab.requiredPermission) {
       const hasPerm = (currentUser.permissions as any)[tab.requiredPermission];
       if (!hasPerm && currentUser.role !== UserRole.SUPERVISOR) return false;
    }
    return true;
  });

  const mainAreaTabs = accessibleTabs.filter(t => !['admin', 'settings'].includes(t.id));
  const adminAreaTabs = accessibleTabs.filter(t => ['admin', 'settings'].includes(t.id));

  const sidebarClasses = `
    fixed inset-y-0 right-0 z-[100] w-72 bg-slate-900 dark:bg-slate-950 text-white flex flex-col shadow-2xl transition-transform duration-300 transform 
    ${isOpen ? 'translate-x-0' : 'translate-x-full'} 
    lg:relative lg:translate-x-0 lg:z-20
  `;

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in" 
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="p-6 border-b border-slate-800 dark:border-slate-900 flex items-center justify-between">
          <div className="flex flex-col items-center flex-1">
            <div className="bg-white p-2 rounded-xl mb-3 shadow-lg">
               <img src={settings.logo} alt="Logo" className="w-12 h-12 mx-auto object-contain" />
            </div>
            <span className="text-[10px] font-black text-center leading-tight text-slate-300 uppercase tracking-widest">{settings.orgName}</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white">
            <X size={24}/>
          </button>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-black text-slate-500 uppercase px-4 mb-2 tracking-widest">القائمة الرئيسية</div>
          {mainAreaTabs.map((item) => (
            <SidebarItem 
              key={item.id} 
              item={item} 
              isActive={activeTab === item.id} 
              onClick={handleTabClick} 
            />
          ))}

          {adminAreaTabs.length > 0 && (
            <>
              <div className="text-[10px] font-black text-slate-500 uppercase px-4 mt-6 mb-2 tracking-widest">الإدارة والتحكم</div>
              {adminAreaTabs.map((item) => (
                <SidebarItem 
                  key={item.id} 
                  item={item} 
                  isActive={activeTab === item.id} 
                  onClick={handleTabClick} 
                />
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 dark:border-slate-900 space-y-2">
          <div className="px-4 py-2 bg-slate-800/40 rounded-xl flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                <UsersRound size={16}/>
             </div>
             <div className="overflow-hidden text-right">
                <p className="text-[11px] font-black text-white truncate">{currentUser.name}</p>
                <p className="text-[9px] font-bold text-slate-500 truncate uppercase">{currentUser.role === UserRole.SUPERVISOR ? 'مشرف عام' : 'مستخدم نظام'}</p>
             </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 text-red-100/50 hover:bg-red-500 hover:text-white rounded-xl transition-all group"
          >
            <LogOut size={18} className="group-hover:rotate-12 transition-transform"/>
            <span className="font-black text-xs">تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
