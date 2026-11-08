import React, { useState } from 'react';
import { Mail, Lock, UserPlus, ArrowLeft, AlertCircle, CheckCircle2, Shield, Clock } from 'lucide-react';

interface RegisterScreenProps {
  onRegister: (email: string, password: string) => Promise<boolean>;
  onBackToLogin: () => void;
  isHindi: boolean;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegister,
  onBackToLogin,
  isHindi,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMsg(isHindi ? 'सभी फ़ील्ड भरें!' : 'Please fill in all fields!');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg(isHindi ? 'कृपया एक वैध ईमेल आईडी दर्ज करें!' : 'Please enter a valid email address!');
      return;
    }

    if (cleanPass.length < 4) {
      setErrorMsg(isHindi ? 'पासवर्ड कम से कम 4 अक्षरों का होना चाहिए!' : 'Password must be at least 4 characters long!');
      return;
    }

    if (cleanPass !== confirmPass.trim()) {
      setErrorMsg(isHindi ? 'दोनों पासवर्ड मेल नहीं खाते!' : 'Passwords do not match!');
      return;
    }

    setIsLoading(true);
    onRegister(cleanEmail, cleanPass).then((success) => {
      setIsLoading(false);
      if (success) {
        setSuccessMsg(
          isHindi
            ? 'सफलतापूर्वक रजिस्टर हो गया! अब लॉगिन करें।'
            : 'Registration successful! You can now log in.'
        );
        setTimeout(() => {
          onBackToLogin();
        }, 1200);
      } else {
        setErrorMsg(
          isHindi
            ? 'पंजीकरण विफल! यह ईमेल पहले से मौजूद हो सकता है।'
            : 'Registration failed! This email might already exist.'
        );
      }
    });
  };

  return (
    <div className="min-h-full flex flex-col justify-center px-4 py-8 sm:px-6 bg-slate-50 text-slate-800">
      <div className="w-full max-w-md mx-auto mb-6 flex items-center justify-between">
        <button
          onClick={onBackToLogin}
          className="flex items-center text-slate-600 hover:text-blue-600 transition-colors gap-2 text-xs font-bold p-2 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <span>{isHindi ? 'लॉगिन पर वापस' : 'Back to Login'}</span>
        </button>
        <span className="text-xs px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full font-mono font-bold tracking-wider flex items-center gap-1 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          ACCOUNT SETUP
        </span>
      </div>

      <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-90" />

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shadow-sm mb-4">
            <UserPlus className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-wider font-['Orbitron',sans-serif]">
            {isHindi ? 'नया खाता रजिस्टर करें' : 'Create New Account'}
          </h2>
          <p className="text-slate-500 text-xs mt-1.5 font-medium">
            {isHindi ? 'अपने जरूरी रिमाइंडर्स सुरक्षित रखने के लिए' : 'Sync your reminders securely'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-wide">
              {isHindi ? 'ईमेल आईडी' : 'Email ID'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-wide">
              {isHindi ? 'पासवर्ड बनाएँ' : 'Create Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-wide">
              {isHindi ? 'पासवर्ड पुनः दर्ज करें' : 'Confirm Password'}
            </label>
            <div className="relative">
              <Shield className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold rounded-xl text-sm shadow-[0_4px_15px_rgba(37,99,235,0.35)] transition-all cursor-pointer mt-2 tracking-wide flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>{isHindi ? 'रजिस्टर करें' : 'Register Now'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-100 pt-4">
          <button
            onClick={onBackToLogin}
            className="text-xs text-slate-600 hover:text-blue-600 transition-colors cursor-pointer font-semibold"
          >
            {isHindi ? 'पहले से खाता है? लॉग इन करें' : 'Already have an account? Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};
