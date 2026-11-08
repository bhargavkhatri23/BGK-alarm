import React, { useState } from 'react';
import { BellRing, Mail, Lock, ArrowRight, KeyRound, AlertCircle, Clock } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  isHindi: boolean;
  onToggleLanguage: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  isHindi,
  onToggleLanguage,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMsg(isHindi ? 'कृपया दोनों फ़ील्ड भरें!' : 'Please fill in both fields!');
      return;
    }

    setIsLoading(true);
    onLogin(cleanEmail, cleanPass).then((ok) => {
      setIsLoading(false);
      if (!ok) {
        setErrorMsg(
          isHindi
            ? 'गलत ईमेल या पासवर्ड! कृपया जांचें या रजिस्टर करें।'
            : 'Incorrect email or password! Please check or register.'
        );
      }
    });
  };

  return (
    <div className="min-h-full flex flex-col justify-center px-4 py-8 sm:px-6 bg-slate-50 text-slate-800">
      {/* Top Utility Controls */}
      <div className="w-full max-w-md mx-auto mb-4 flex items-center justify-between">
        <span className="text-xs px-3 py-1 bg-blue-50 border border-blue-200 text-blue-600 rounded-full font-mono font-bold tracking-wider flex items-center gap-1.5 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          BGK SMART ALARM
        </span>
        <button
          onClick={onToggleLanguage}
          className="text-xs font-bold px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-600 rounded-full border border-blue-200 transition-colors shadow-sm cursor-pointer"
        >
          {isHindi ? 'English' : 'हिंदी'}
        </button>
      </div>

      <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
        {/* Top blue accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-90" />

        {/* Logo Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-500 p-1.5 shadow-[0_0_20px_rgba(37,99,235,0.2)] flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            <BellRing className="w-9 h-9 text-blue-600 animate-bounce" />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 mt-4 tracking-wider font-['Orbitron',sans-serif]">
            BGK <span className="text-blue-600">ALARM</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-medium tracking-wide">
            {isHindi ? 'कभी न भूलें, समय पर याद रखें!' : 'Never forget, remember on time!'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-wide">
              {isHindi ? 'ईमेल आईडी' : 'Email Address'}
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
              {isHindi ? 'पासवर्ड' : 'Password'}
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

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onNavigateToForgotPassword}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isHindi ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold rounded-xl text-sm shadow-[0_4px_15px_rgba(37,99,235,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 tracking-wide"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isHindi ? 'लॉग इन करें' : 'Log In'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="text-xs text-slate-600 hover:text-blue-600 transition-colors cursor-pointer font-semibold"
          >
            {isHindi ? 'नया खाता बनाएँ? रजिस्टर करें' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
