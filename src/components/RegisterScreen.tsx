import React, { useState } from 'react';
import { Mail, Lock, UserPlus, ArrowLeft, AlertCircle, CheckCircle2, Shield, Zap } from 'lucide-react';

interface RegisterScreenProps {
  onRegister: (email: string, password: string) => boolean;
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

    const success = onRegister(cleanEmail, cleanPass);
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
          ? 'यह ईमेल पहले से पंजीकृत है! कृपया लॉगिन करें।'
          : 'This email is already registered! Please login instead.'
      );
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center px-4 py-8 sm:px-6">
      {/* Top Bar matching Omnitrix tech bar */}
      <div className="w-full max-w-md mx-auto mb-6 flex items-center justify-between">
        <button
          onClick={onBackToLogin}
          className="flex items-center text-slate-300 hover:text-[#00FF66] transition-colors gap-2 text-xs font-bold p-2 rounded-xl hover:bg-emerald-950/40 border border-transparent hover:border-emerald-500/20"
        >
          <ArrowLeft className="w-4 h-4 text-[#00FF66]" />
          <span>{isHindi ? 'लॉगिन पर वापस' : 'Back to Login'}</span>
        </button>
        <span className="text-xs px-2.5 py-1 bg-emerald-950/70 text-[#00FF66] border border-emerald-500/40 rounded-full font-mono font-bold tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(0,255,102,0.15)]">
          <Zap className="w-3 h-3 text-[#00FF66]" />
          OMNITRIX ID
        </span>
      </div>

      <div className="w-full max-w-md mx-auto bg-[#0C121E] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(0,255,102,0.12)] backdrop-blur-md relative overflow-hidden">
        {/* Top edge glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00FF66] to-transparent opacity-80" />

        <div className="text-center mb-6">
          <div className="relative w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-[#00FF66] p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.35)] mb-4">
            <div className="w-full h-full rounded-2xl bg-[#08150C] flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-[#00FF66]" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wider font-mono">
            {isHindi ? 'नया खाता रजिस्टर करें' : 'Create New Account'}
          </h2>
          <p className="text-emerald-400/80 text-xs mt-1.5 font-medium">
            {isHindi ? 'अपने जरूरी रिमाइंडर्स सुरक्षित रखने के लिए' : 'Sync your reminders with Omnitrix persistence'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-700/70 rounded-xl text-red-200 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500/70 rounded-xl text-emerald-200 text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,102,0.2)]">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00FF66]" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 tracking-wide">
              {isHindi ? 'ईमेल आईडी' : 'Email ID'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-500/70" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 bg-[#080D16] border border-emerald-500/20 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 tracking-wide">
              {isHindi ? 'पासवर्ड बनाएँ' : 'Create Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-500/70" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-[#080D16] border border-emerald-500/20 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 tracking-wide">
              {isHindi ? 'पासवर्ड पुनः दर्ज करें' : 'Confirm Password'}
            </label>
            <div className="relative">
              <Shield className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-500/70" />
              <input
                type="password"
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-[#080D16] border border-emerald-500/20 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-all shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-[#00FF66] to-emerald-400 hover:from-emerald-400 hover:to-[#00FF66] text-black font-extrabold rounded-xl text-sm shadow-[0_0_20px_rgba(0,255,102,0.35)] active:scale-[0.99] transition-all cursor-pointer mt-2 tracking-wide"
          >
            {isHindi ? 'रजिस्टर करें' : 'Register Now'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-emerald-500/20 pt-4">
          <button
            onClick={onBackToLogin}
            className="text-xs text-slate-400 hover:text-[#00FF66] transition-colors cursor-pointer font-medium"
          >
            {isHindi ? 'पहले से खाता है? लॉग इन करें' : 'Already have an account? Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};
