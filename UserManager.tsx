
import React, { useState, useMemo } from 'react';
import { storage } from '../utils/storage';
import { hashPassword } from '../utils/auth';
import { User, UserRole, UserPermissions } from '../types';
import { 
  UserPlus, CheckSquare, 
  Square, X, Search, ShieldCheck,
  UserCog, Lock, Fingerprint,
  Edit3, Trash
} from 'lucide-react';

interface UserManagerProps {
  currentUser: User;
}

const UserManager: React.FC<UserManagerProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>(storage.getUsers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter] = useState<'all' | UserRole>('all');

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    username: '',
    password: '',
    role: UserRole.USER,
    permissions: {
      canAdd: true,
      canEdit: true,
      canDelete: false,
      canViewReports: true,
      canManageUsers: false
    }
  });

  // فلترة المستخدمين
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.includes(searchQuery) || u.username.includes(searchQuery);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.name) return;

    let updatedUsers: User[];
    if (editingUser) {
      // تشفير كلمة المرور إذا تم تغييرها
      let finalPassword = editingUser.password;
      if (formData.password && formData.password !== '') {
        finalPassword = await hashPassword(formData.password);
      }

      updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, ...formData, password: finalPassword } as User : u);
      storage.addLog({
        userId: currentUser.id,
        username: currentUser.username,
        action: 'تعديل صلاحيات مستخدم',
        details: `تم تحديث ملف وبروتوكولات الوصول للمستخدم: ${formData.username}`
      });
    } else {
      const newUser: User = {
        id: crypto.randomUUID(),
        name: formData.name!,
        username: formData.username!,
        password: await hashPassword(formData.password || '123456'),
        role: formData.role || UserRole.USER,
        permissions: formData.permissions as UserPermissions
      };
      updatedUsers = [...users, newUser];
      storage.addLog({
        userId: currentUser.id,
        username: currentUser.username,
        action: 'إنشاء مستخدم جديد',
        details: `تم منح صلاحية الوصول للنظام للمستخدم الجديد: ${newUser.username}`
      });
    }

    setUsers(updatedUsers);
    storage.setUsers(updatedUsers);
    setIsModalOpen(false);
    setEditingUser(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      role: UserRole.USER,
      permissions: {
        canAdd: true,
        canEdit: true,
        canDelete: false,
        canViewReports: true,
        canManageUsers: false
      }
    });
  };

  const togglePermission = (key: keyof UserPermissions) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions!,
        [key]: !formData.permissions![key]
      }
    });
  };

  const handleDelete = (id: string, username: string) => {
    if (id === currentUser.id) return alert('خطأ أمني: لا يمكنك حذف حسابك الذي تسجل به الدخول حالياً.');
    if (confirm(`تحذير أمني: هل أنت متأكد من سحب كافة صلاحيات الوصول وحذف المستخدم (${username}) نهائياً؟`)) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      storage.setUsers(updated);
      storage.addLog({
        userId: currentUser.id,
        username: currentUser.username,
        action: 'حذف مستخدم',
        details: `تم سحب صلاحيات الوصول وحذف حساب: ${username}`
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-accent/10 rounded-[2rem] text-accent">
              <ShieldCheck size={32}/>
           </div>
           <div>
              <h2 className="text-2xl font-black dark:text-white">إدارة الدخول والصلاحيات</h2>
              <p className="text-sm text-slate-400 font-bold mt-1">تحديد بروتوكولات الوصول للمستخدمين وإدارة الهوية الرقمية.</p>
           </div>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
           <div className="relative flex-1 lg:w-80 group">
              <Search className="absolute right-4 top-3.5 text-slate-300 group-focus-within:text-accent transition-colors" size={20}/>
              <input 
                type="text" placeholder="بحث عن مستخدم..." 
                className="w-full pr-12 pl-4 py-3.5 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent rounded-2xl outline-none font-bold text-sm"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           <button 
             onClick={() => { resetForm(); setEditingUser(null); setIsModalOpen(true); }}
             className="bg-accent text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-accent/20 hover:scale-105 transition-all"
           >
              <UserPlus size={20} /> إضافة مستخدم
           </button>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] border-4 border-transparent hover:border-accent transition-all group relative overflow-hidden shadow-sm hover:shadow-xl">
            
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[1.8rem] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 font-black text-2xl group-hover:scale-110 transition-transform">
                  {user.name.split(' ')[0][0]}{user.name.split(' ')[1]?.[0] || ''}
                </div>
                <div>
                  <h3 className="font-black text-lg dark:text-white leading-tight">{user.name}</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">@{user.username}</p>
                </div>
              </div>
              <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${user.role === UserRole.SUPERVISOR ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {user.role === UserRole.SUPERVISOR ? 'مسؤول نظام' : 'مستخدم'}
              </div>
            </div>

            <div className="space-y-4 mb-10">
               <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b dark:border-slate-800 pb-2">الصلاحيات النشطة</div>
               <div className="flex flex-wrap gap-2">
                  {Object.entries(user.permissions).map(([key, value]) => value && (
                    <span key={key} className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1 rounded-lg text-[9px] font-black">
                       {key === 'canAdd' && 'إضافة'}
                       {key === 'canEdit' && 'تعديل'}
                       {key === 'canDelete' && 'حذف'}
                       {key === 'canViewReports' && 'تقارير'}
                       {key === 'canManageUsers' && 'إدارة'}
                    </span>
                  ))}
               </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => { setEditingUser(user); setFormData(user); setIsModalOpen(true); }}
                className="flex-1 bg-gray-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl text-xs font-black hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Edit3 size={16} /> تعديل الحساب
              </button>
              <button 
                onClick={() => handleDelete(user.id, user.username)}
                disabled={user.id === currentUser.id}
                className="p-4 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-20 shadow-sm"
              >
                <Trash size={18} />
              </button>
            </div>

            <ShieldCheck className="absolute -bottom-4 -left-4 text-accent opacity-0 group-hover:opacity-5 rotate-12 transition-all" size={120} />
          </div>
        ))}
        
        {filteredUsers.length === 0 && (
          <div className="col-span-full py-32 text-center bg-gray-50 dark:bg-slate-800/30 rounded-[4rem] border-4 border-dashed border-slate-200 dark:border-slate-800">
             <Search size={64} className="mx-auto text-slate-200 mb-4" />
             <p className="text-xl font-black text-slate-400 italic">لا يوجد مستخدمين يطابقون بحثك الحالي.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[4rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-800 my-8">
            
            <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
               {/* Modal Sidebar */}
               <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-800/50 p-12 border-l dark:border-slate-800 space-y-10">
                  <div className="p-5 bg-accent text-white rounded-[2rem] shadow-xl shadow-accent/20 w-fit"><UserCog size={40}/></div>
                  <div>
                    <h3 className="text-3xl font-black">{editingUser ? 'تحديث الحساب' : 'مستخدم جديد'}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-2 leading-relaxed italic">قم بتحديد البيانات والبروتوكولات الخاصة بالوصول للمنظومة.</p>
                  </div>
                  
                  <div className="space-y-4 pt-8">
                     <div className="flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-widest"><Lock size={14}/> أمان الجلسة</div>
                     <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold mb-1">حالة التشفير</p>
                        <p className="text-xs font-black text-emerald-500">BCRYPT SECURE</p>
                     </div>
                  </div>
               </div>

               {/* Modal Content */}
               <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-10 py-8 border-b dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                    <h4 className="font-black text-xl">تفاصيل بروتوكول الهوية</h4>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-50 rounded-full transition-all text-slate-400"><X /></button>
                  </div>
                  
                  <form onSubmit={handleSave} className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الاسم الثلاثي الكامل</label>
                        <input required type="text" className="w-full p-5 bg-gray-50 dark:bg-slate-800 rounded-3xl border-2 border-transparent focus:border-accent outline-none font-bold text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">معرف الدخول (Username)</label>
                        <input required type="text" className="w-full p-5 bg-gray-50 dark:bg-slate-800 rounded-3xl border-2 border-transparent focus:border-accent outline-none font-black text-sm" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">كلمة المرور الرقمية</label>
                        <input type="password" placeholder={editingUser ? 'اتركها فارغة للحفاظ على الحالية' : 'اكتب كلمة مرور قوية'} className="w-full p-5 bg-gray-50 dark:bg-slate-800 rounded-3xl border-2 border-transparent focus:border-accent outline-none font-bold text-sm" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">رتبة الوصول للنظام</label>
                        <select className="w-full p-5 bg-gray-50 dark:bg-slate-800 rounded-3xl border-2 border-transparent focus:border-accent outline-none font-black text-sm appearance-none shadow-inner" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                          <option value={UserRole.USER}>مستخدم اعتيادي</option>
                          <option value={UserRole.SUPERVISOR}>مسؤول نظام (آمر)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b dark:border-slate-800 pb-3 flex items-center gap-3"><Fingerprint size={16}/> مصفوفة صلاحيات العمليات</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { key: 'canAdd', label: 'إضافة بيانات قوة بشرية', desc: 'يسمح للمستخدم بإنشاء ملفات رقمية جديدة.' },
                          { key: 'canEdit', label: 'تعديل السجلات الحالية', desc: 'يسمح بتعديل بيانات الأفراد والرتب والتمركز.' },
                          { key: 'canDelete', label: 'حذف وإتلاف البيانات', desc: 'صلاحية حساسة لحذف السجلات نهائياً.' },
                          { key: 'canViewReports', label: 'عرض وتصدير التقارير', desc: 'الوصول لقسم التقارير المخصصة والتحليلات.' },
                          { key: 'canManageUsers', label: 'إدارة شؤون المستخدمين', desc: 'التحكم في صلاحيات بقية الموظفين.' },
                        ].map(perm => (
                          <button 
                            key={perm.key}
                            type="button"
                            onClick={() => togglePermission(perm.key as keyof UserPermissions)}
                            className={`flex flex-col gap-1 text-right p-5 rounded-3xl border-2 transition-all ${formData.permissions?.[perm.key as keyof UserPermissions] ? 'border-accent bg-accent/5' : 'border-gray-100 dark:border-slate-800'}`}
                          >
                            <div className="flex items-center justify-between w-full">
                               <span className={`text-xs font-black ${formData.permissions?.[perm.key as keyof UserPermissions] ? 'text-accent' : 'text-slate-500'}`}>{perm.label}</span>
                               {formData.permissions?.[perm.key as keyof UserPermissions] ? <CheckSquare size={20} className="text-accent" /> : <Square size={20} className="text-slate-300" />}
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold leading-tight">{perm.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 mt-6 border-t dark:border-slate-800">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black hover:text-slate-600 transition-colors">إلغاء</button>
                      <button type="submit" className="px-14 py-4 bg-accent text-white font-black rounded-[2rem] shadow-2xl shadow-accent/40 hover:scale-[1.02] active:scale-95 transition-all">
                        {editingUser ? 'حفظ التحديثات' : 'تفعيل الحساب الآن'}
                      </button>
                    </div>
                  </form>
               </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
      `}</style>
    </div>
  );
};

export default UserManager;
