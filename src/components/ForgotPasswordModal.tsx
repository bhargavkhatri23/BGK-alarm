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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-blue-200 rounded-3xl p-6 w-full max-w-md shadow-2xl relative text-slate-800">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
              title="वापस जाएँ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900 font-['Orbitron',sans-serif]">
                {isHindi ? 'पासवर्ड रीसेट करें' : 'Reset Password'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-medium px-2 py-1 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1 */}
        {!generatedCode && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-mono">
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-sm transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold rounded-xl text-sm shadow-[0_4px_15px_rgba(37,99,235,0.35)] transition-all cursor-pointer font-['Orbitron',sans-serif] tracking-wider"
            >
              {isHindi ? 'सुरक्षा कोड जनरेट करें' : 'GENERATE SECURITY CODE'}
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {generatedCode && !codeVerified && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
              <span>ईमेल: <b className="text-slate-900 font-mono">{email}</b></span>
              <button
                type="button"
                onClick={() => setShowCodeDialog(true)}
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                {isHindi ? 'कोड देखें' : 'View Code'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-mono">
                {isHindi ? '6 अंकों का कोड यहाँ लिखें' : 'Enter 6-digit Code'}
              </label>
              <input
                type="text"
                maxLength={6}
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-2xl font-['Orbitron',monospace] py-3 bg-slate-50 border border-slate-200 rounded-xl text-blue-600 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold rounded-xl text-sm shadow-[0_4px_15px_rgba(37,99,235,0.35)] transition-all cursor-pointer font-['Orbitron',sans-serif] tracking-wider"
            >
              {isHindi ? 'कोड वेरिफाई करें' : 'VERIFY CODE'}
            </button>
          </form>
        )}

        {/* STEP 3 */}
        {codeVerified && (
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-mono">
                {isHindi ? 'नया पासवर्ड' : 'New Password'}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-mono">
                {isHindi ? 'नया पासवर्ड पुनः दर्ज करें' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold rounded-xl text-sm shadow-[0_4px_15px_rgba(37,99,235,0.35)] transition-all cursor-pointer font-['Orbitron',sans-serif] tracking-wider"
            >
              {isHindi ? 'पासवर्ड सेव करें' : 'SAVE PASSWORD'}
            </button>
          </form>
        )}

        {/* Verification code popup */}
        {showCodeDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-white border border-blue-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 font-['Orbitron',sans-serif]">
                {isHindi ? 'सुरक्षा कोड' : 'Security Verification Code'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {isHindi ? 'आपका 6 अंकों का गुप्त कोड है:' : 'Your 6-digit verification code is:'}
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 mb-4 flex items-center justify-center space-x-3">
                <span className="text-3xl font-['Orbitron',monospace] font-extrabold text-blue-600 tracking-widest">
                  {generatedCode}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                  title="कॉपी करें"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={autoFillCode}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs font-mono cursor-pointer shadow-sm"
                >
                  {isHindi ? 'ऑटो-फिल करें' : 'Auto Fill'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCodeDialog(false)}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
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
