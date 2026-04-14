
import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { comparePassword } from '../utils/auth';
import { Lock, User as UserIcon, ShieldAlert } from 'lucide-react';
import { User } from '../types';
import { useToast } from './Toast';

const LOCKOUT_KEY = 'mil_hr_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface LockoutState {
  attempts: number;
  lockedUntil: number | null;
}

const getLockout = (): LockoutState => {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { attempts: 0, lockedUntil: null };
};

const setLockout = (state: LockoutState) => {
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
};

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const settings = storage.getSettings();
  const { showToast } = useToast();

  useEffect(() => {
    const tick = () => {
      const lockout = getLockout();
      if (lockout.lockedUntil) {
        const remaining = Math.ceil((lockout.lockedUntil - Date.now()) / 1000);
        if (remaining > 0) {
          setLockoutRemaining(remaining);
        } else {
          setLockoutRemaining(0);
          setLockout({ attempts: 0, lockedUntil: null });
          setError('');
        }
      } else {
        setLockoutRemaining(0);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const lockout = getLockout();
    if (lockout.lockedUntil && Date.now() < lockout.lockedUntil) {
      return;
    }

    try {
      const users = storage.getUsers();
      const user = users.find(u => u.username === username);

      if (user && user.password) {
        const isMatch = await comparePassword(password, user.password);
        if (isMatch) {
          setLockout({ attempts: 0, lockedUntil: null });
          onLogin(user);
          setError('');
          return;
        }
      }

      const newAttempts = lockout.attempts + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
        setLockout({ attempts: newAttempts, lockedUntil });
        setLockoutRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
        setError('');
        showToast('تم تعليق الحساب مؤقتاً بسبب محاولات دخول متعددة فاشلة', 'error');
      } else {
        setLockout({ attempts: newAttempts, lockedUntil: null });
        const msg = `خطأ في اسم المستخدم أو كلمة السر! (محاولة ${newAttempts} من ${MAX_ATTEMPTS})`;
        setError(msg);
        showToast(msg, 'error');
      }
    } catch {
      const msg = 'حدث خطأ أثناء محاولة الدخول. يرجى المحاولة مجدداً.';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  const isLocked = lockoutRemaining > 0;
  const minutes = Math.floor(lockoutRemaining / 60);
  const seconds = lockoutRemaining % 60;

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

          {isLocked ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6 text-center space-y-3">
              <ShieldAlert className="text-red-500 mx-auto animate-pulse" size={36} />
              <p className="text-red-700 font-black text-sm">تم تعليق الحساب مؤقتاً بسبب محاولات دخول متعددة فاشلة</p>
              <div className="bg-red-100 rounded-xl px-6 py-3 inline-block">
                <p className="text-red-600 font-black text-2xl tabular-nums">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </p>
                <p className="text-red-400 text-[10px] font-bold mt-1">الوقت المتبقي لإعادة المحاولة</p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border-r-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg text-sm animate-pulse font-bold">
                  {error}
                </div>
              )}
            </>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 block">اسم المستخدم</label>
              <div className="relative">
                <UserIcon className="absolute right-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium disabled:opacity-50"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLocked}
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
                  className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium disabled:opacity-50"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLocked}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLocked}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLocked ? 'الحساب موقوف مؤقتاً' : 'دخول للنظام'}
            </button>
          </form>

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
