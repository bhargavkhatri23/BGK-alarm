import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Mail, ArrowLeft, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';

interface ForgotPasswordModalProps {
  registeredUsers: Record<string, string>;
  onSavePassword: (email: string, newPass: string) => void;
  onClose: () => void;
  isHindi: boolean;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  registeredUsers,
  onSavePassword,
  onClose,
  isHindi,
}) => {
  const [email, setEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg(isHindi ? 'कृपया ईमेल दर्ज करें!' : 'Please enter an email address!');
      return;
    }

    if (registeredUsers[trimmedEmail]) {
      const code = (100000 + Math.floor(Math.random() * 900000)).toString();
      setGeneratedCode(code);
      setShowCodeDialog(true);
    } else {
      setErrorMsg(
        isHindi
          ? 'यह ईमेल रजिस्टर नहीं है! कृपया पहले खाता बनाएँ।'
          : 'This email is not registered! Please register first.'
      );
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (enteredCode.trim() === generatedCode) {
      setCodeVerified(true);
      setSuccessMsg(
        isHindi
          ? 'कोड वेरिफाई हो गया! अब नया पासवर्ड सेट करें।'
          : 'Code verified successfully! Please set your new password.'
      );
    } else {
      setErrorMsg(isHindi ? 'गलत कोड! पुनः प्रयास करें।' : 'Incorrect verification code!');
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newPassword || newPassword.length < 4) {
      setErrorMsg(
        isHindi
          ? 'पासवर्ड कम से कम 4 अक्षरों का होना चाहिए!'
          : 'Password must be at least 4 characters long!'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(isHindi ? 'दोनों पासवर्ड मेल नहीं खा रहे हैं!' : 'Passwords do not match!');
      return;
    }

    onSavePassword(email.trim(), newPassword);
    setSuccessMsg(
      isHindi ? 'पासवर्ड सफलतापूर्वक बदल गया! कृपया लॉगिन करें।' : 'Password updated successfully!'
    );
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const copyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const autoFillCode = () => {
    if (generatedCode) {
      setEnteredCode(generatedCode);
      setShowCodeDialog(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0C121E] border border-emerald-500/40 rounded-3xl p-6 w-full max-w-md shadow-[0_0_40px_rgba(0,255,102,0.15)] relative text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-5">
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-[#00FF66] transition-colors cursor-pointer"
              title="वापस जाएँ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-[#00FF66]" />
              <h2 className="text-lg font-bold text-white font-['Orbitron',sans-serif]">
                {isHindi ? 'पासवर्ड रीसेट करें' : 'Reset Password'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-medium px-2 py-1 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-200 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00FF66]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: Enter email and send verification code */}
        {!generatedCode && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                {isHindi ? 'अपनी रजिस्टर ईमेल आईडी दर्ज करें' : 'Enter Registered Email ID'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#070B12] border border-emerald-500/30 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66]/30 text-sm transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-[#00FF66] to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold rounded-xl text-sm shadow-[0_0_20px_rgba(0,255,102,0.35)] active:scale-[0.99] transition-all cursor-pointer font-['Orbitron',sans-serif] tracking-wider"
            >
              {isHindi ? 'सुरक्षा कोड जनरेट करें (SEND CODE)' : 'GENERATE SECURITY CODE'}
            </button>
          </form>
        )}

        {/* STEP 2: Verify code */}
        {generatedCode && !codeVerified && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="p-3 bg-[#070B12] border border-emerald-500/30 rounded-xl text-xs text-slate-400 flex items-center justify-between">
              <span>ईमेल: <b className="text-slate-200 font-mono">{email}</b></span>
              <button
                type="button"
                onClick={() => setShowCodeDialog(true)}
                className="text-[#00FF66] hover:underline font-semibold cursor-pointer"
              >
                {isHindi ? 'कोड देखें' : 'View Code'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                {isHindi ? '6 अंकों का कोड यहाँ लिखें' : 'Enter 6-digit Code'}
              </label>
              <input
                type="text"
                maxLength={6}
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-2xl font-['Orbitron',monospace] py-3 bg-[#070B12] border border-emerald-500/40 rounded-xl text-[#00FF66] placeholder-slate-600 focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66]/40"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-[#00FF66] to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold rounded-xl text-sm shadow-[0_0_20px_rgba(0,255,102,0.35)] active:scale-[0.99] transition-all cursor-pointer font-['Orbitron',sans-serif] tracking-wider"
            >
              {isHindi ? 'कोड वेरिफाई करें (VERIFY)' : 'VERIFY CODE'}
            </button>
          </form>
        )}

        {/* STEP 3: Set new password */}
        {codeVerified && (
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                {isHindi ? 'नया पासवर्ड' : 'New Password'}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#070B12] border border-emerald-500/30 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#00FF66] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                {isHindi ? 'नया पासवर्ड पुनः दर्ज करें (Confirm)' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#070B12] border border-emerald-500/30 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#00FF66] text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-[#00FF66] to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold rounded-xl text-sm shadow-[0_0_25px_rgba(0,255,102,0.35)] active:scale-[0.99] transition-all cursor-pointer font-['Orbitron',sans-serif] tracking-wider"
            >
              {isHindi ? 'पासवर्ड सेव करें' : 'SAVE PASSWORD'}
            </button>
          </form>
        )}

        {/* Verification code popup */}
        {showCodeDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85">
            <div className="bg-[#0C121E] border border-emerald-500/50 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_30px_rgba(0,255,102,0.2)] text-center animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 bg-emerald-950/80 text-[#00FF66] border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(0,255,102,0.25)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 font-['Orbitron',sans-serif]">
                {isHindi ? 'सुरक्षा कोड (Security Code)' : 'Security Verification Code'}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                {isHindi ? 'आपका 6 अंकों का गुप्त कोड है:' : 'Your 6-digit verification code is:'}
              </p>
              <div className="bg-[#070B12] border border-emerald-500/40 rounded-xl py-3 px-4 mb-4 flex items-center justify-center space-x-3">
                <span className="text-3xl font-['Orbitron',monospace] font-extrabold text-[#00FF66] tracking-widest drop-shadow-[0_0_10px_rgba(0,255,102,0.4)]">
                  {generatedCode}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-[#00FF66] transition-colors cursor-pointer"
                  title="कॉपी करें"
                >
                  {copied ? <Check className="w-4 h-4 text-[#00FF66]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={autoFillCode}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-[#00FF66] hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold rounded-xl text-xs font-mono cursor-pointer"
                >
                  {isHindi ? 'ऑटो-फिल करें' : 'Auto Fill'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCodeDialog(false)}
                  className="w-full py-2.5 px-3 bg-[#0F172A] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {isHindi ? 'ठीक है' : 'OK'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
