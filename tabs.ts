
import { 
  LayoutDashboard, Users, CalendarClock, ClipboardList, 
  FileBadge, FileSpreadsheet, ShieldAlert, Settings 
} from 'lucide-react';
import { UserRole } from './types';

export interface TabConfig {
  id: 'dashboard' | 'personnel' | 'leaves' | 'roll_call' | 'promotions' | 'reports' | 'admin' | 'settings' | 'forms';
  label: string;
  icon: any;
  requiredRole?: UserRole;
  requiredPermission?: string;
}

export const MAIN_TABS: TabConfig[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'personnel', label: 'إدارة القوة البشرية', icon: Users },
  { id: 'leaves', label: 'الإجازات والأذونات', icon: CalendarClock },
  { id: 'roll_call', label: 'تمام الحضور والغياب', icon: ClipboardList },
  { id: 'promotions', label: 'إدارة الترقيات', icon: FileBadge },
  { id: 'forms', label: 'النماذج والتعريفات', icon: FileBadge },
  { id: 'reports', label: 'التقارير والإحصائيات', icon: FileSpreadsheet, requiredPermission: 'canViewReports' },
  { id: 'admin', label: 'إدارة الوحدات', icon: ShieldAlert, requiredPermission: 'canViewReports' }, // matching Sidebar.tsx line 33
  { id: 'settings', label: 'إعدادات المنظومة', icon: Settings, requiredRole: UserRole.SUPERVISOR },
];
