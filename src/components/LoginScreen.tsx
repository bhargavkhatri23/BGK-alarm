import React, { useState } from 'react';
import { BellRing, Mail, Lock, ArrowRight, KeyRound, AlertCircle, Zap } from 'lucide-react';

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
    <div className="min-h-full flex flex-col justify-center px-4 py-8 sm:px-6">
      {/* Top Utility Controls */}
      <div className="w-full max-w-md mx-auto mb-4 flex items-center justify-between">
        <span className="text-xs px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/40 text-[#00FF66] rounded-full font-mono font-bold tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,102,0.2)]">
          <Zap className="w-3 h-3 text-[#00FF66]" />
          OMNITRIX V3.0
        </span>
        <button
          onClick={onToggleLanguage}
          className="text-xs font-bold px-3 py-1 bg-[#0F172A] hover:bg-slate-800 text-[#00FF66] rounded-full border border-emerald-500/30 transition-colors shadow-sm"
        >
          {isHindi ? 'English' : 'हिंदी'}
        </button>
      </div>

      <div className="w-full max-w-md mx-auto bg-[#0C121E] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(0,255,102,0.12)] backdrop-blur-md relative overflow-hidden">
        {/* Top green edge glow line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00FF66] to-transparent opacity-80" />

        {/* Omnitrix Core Dial Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-24 h-24 rounded-full bg-slate-950 border-2 border-[#00FF66] p-1.5 shadow-[0_0_30px_rgba(0,255,102,0.4)] flex items-center justify-center transform hover:scale-105 transition-transform duration-300 animate-glow-omnitrix">
            {/* Outer metallic ring notch indicators */}
            <div className="absolute inset-0 rounded-full border-t border-b border-[#00FF66]/40 -rotate-45 pointer-events-none" />
            <div className="w-full h-full rounded-full bg-[#05140A] border border-emerald-500/60 flex items-center justify-center relative overflow-hidden">
              {/* Ben 10 Hourglass glowing silhouette */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#00FF66_1px,transparent_1px)] [background-size:6px_6px]" />
              <BellRing className="w-11 h-11 text-[#00FF66] animate-ring-shake drop-shadow-[0_0_10px_rgba(0,255,102,0.8)] z-10" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-white mt-4 tracking-wider font-mono">
            BGK <span className="text-[#00FF66] omnitrix-text-glow">YADGIRI</span>
          </h1>
          <p className="text-emerald-400/80 text-xs mt-1.5 font-medium tracking-wide">
            {isHindi ? 'कभी न भूलें, समय पर याद रखें!' : 'Never forget, remember on time!'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-700/70 rounded-xl text-red-200 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 tracking-wide">
              {isHindi ? 'ईमेल आईडी' : 'Email Address'}
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
              {isHindi ? 'पासवर्ड' : 'Password'}
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

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onNavigateToForgotPassword}
              className="text-xs font-bold text-[#00FF66] hover:text-emerald-300 hover:underline transition-colors cursor-pointer flex items-center gap-1 drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isHindi ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-[#00FF66] to-emerald-400 hover:from-emerald-400 hover:to-[#00FF66] text-black font-extrabold rounded-xl text-sm shadow-[0_0_20px_rgba(0,255,102,0.35)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 tracking-wide"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <span>{isHindi ? 'लॉग इन करें' : 'Log In'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-emerald-500/20 text-center">
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="text-xs text-slate-400 hover:text-[#00FF66] transition-colors cursor-pointer font-medium"
          >
            {isHindi ? 'नया खाता बनाएँ? रजिस्टर करें' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
