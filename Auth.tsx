
import React, { useState } from 'react';
import { storage } from '../utils/storage';
import { comparePassword } from '../utils/auth';
import { Lock, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const settings = storage.getSettings();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const users = storage.getUsers();
      const user = users.find(u => u.username === username);

      if (user && user.password) {
        const isMatch = await comparePassword(password, user.password);
        if (isMatch) {
          onLogin(user);
          setError('');
          return;
        }
      }
      
      setError('خطأ في اسم المستخدم أو كلمة السر!');
    } catch (err) {
      setError('حدث خطأ أثناء محاولة الدخول. يرجى مسح البيانات ومحاولة مجدداً.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border-t-8 border-indigo-600">
        
        <div className="p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 bg-gray-50 border rounded-3xl flex items-center justify-center text-indigo-600 mb-4 shadow-sm overflow-hidden p-2">
               <img src={settings.logo} alt="DCMI Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">DCMI</h1>
            <p className="text-gray-400 text-sm mt-1 font-bold">منظومة إدارة شئون الأفراد</p>
            <p className="text-[10px] text-indigo-400 font-bold mt-2 uppercase tracking-tighter">This system was created by Mohammed Alkayal</p>
          </div>

          {error && (
            <div className="bg-red-50 border-r-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg text-sm animate-pulse font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 block">اسم المستخدم</label>
              <div className="relative">
                <UserIcon className="absolute right-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 block">كلمة السر</label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 text-gray-400" size={18} />
                <input 
                  type="password" 
                  className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all transform hover:-translate-y-1 active:scale-95"
            >
              دخول للنظام
            </button>
          </form>

          <button
            onClick={() => {
              if (confirm('هل أنت متأكد من رغبتك في مسح جميع البيانات المخزنة محلياً؟')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="w-full mt-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 rounded-2xl transition-all text-sm"
          >
            إعادة تعيين البيانات
          </button>

          <div className="mt-12 pt-8 border-t text-center">
            <p className="text-xs text-gray-400 font-bold italic mb-1">Developed & Designed with Passion</p>
            <p className="text-[10px] text-gray-300 font-black">DCMI ENTERPRISE v3.1.0 - 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
