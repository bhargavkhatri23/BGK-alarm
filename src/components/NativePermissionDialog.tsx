import React from 'react';
import { Bell } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { backgroundTimer } from '../utils/backgroundTimer';

interface NativePermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isHindi: boolean;
}

export const NativePermissionDialog: React.FC<NativePermissionDialogProps> = ({
  isOpen,
  onClose,
  isHindi,
}) => {
  if (!isOpen) return null;

  const handleAllow = async () => {
    // 1. Standard Platform API: Request Notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        await Notification.requestPermission();
      } catch {
        // Ignored
      }
    }

    // 2. Standard Web Audio Context unlock
    try {
      audioEngine.initContext();
    } catch {
      // Ignored
    }

    // 3. Exact background timer & wake lock
    try {
      await backgroundTimer.requestWakeLock();
    } catch {
      // Ignored
    }

    try {
      localStorage.setItem('bgk_permissions_requested', 'true');
    } catch {
      // Ignored
    }

    onClose();
  };

  const handleDontAllow = () => {
    try {
      localStorage.setItem('bgk_permissions_requested', 'true');
    } catch {
      // Ignored
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      {/* Native System Dialog styling with Omnitrix Tech Accents */}
      <div className="bg-[#0C121E] text-white border border-emerald-500/40 rounded-3xl p-6 max-w-[340px] w-full shadow-[0_0_30px_rgba(0,255,102,0.18)] text-center animate-in zoom-in-95 duration-150">
        {/* App Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#070B12] border border-emerald-500/50 mx-auto flex items-center justify-center shadow-[0_0_15px_rgba(0,255,102,0.25)] mb-4">
          <Bell className="w-6 h-6 text-[#00FF66]" />
        </div>

        {/* System Prompt Question */}
        <h3 className="text-base font-bold text-white mb-2 leading-snug">
          {isHindi
            ? 'क्या आप "BGK Yadgiri" को नोटिफिकेशन भेजने की अनुमति देना चाहते हैं?'
            : 'Allow "BGK Yadgiri" to send you notifications?'}
        </h3>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {isHindi
            ? 'अलार्म और रिमाइंडर समय पर बजने के लिए आवश्यक।'
            : 'Alarms and reminders will play sound and alerts at scheduled times.'}
        </p>

        {/* Native 2-button layout: Don't Allow | Allow */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-emerald-500/20">
          <button
            type="button"
            onClick={handleDontAllow}
            className="py-2.5 px-3 bg-[#0F172A] hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            {isHindi ? 'अनुमति न दें' : "Don't Allow"}
          </button>

          <button
            type="button"
            onClick={handleAllow}
            className="py-2.5 px-3 bg-gradient-to-r from-emerald-500 via-[#00FF66] to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-95 text-black font-extrabold rounded-xl text-xs shadow-[0_0_15px_rgba(0,255,102,0.3)] transition-all cursor-pointer font-mono"
          >
            {isHindi ? 'अनुमति दें' : 'Allow'}
          </button>
        </div>
      </div>
    </div>
  );
};
