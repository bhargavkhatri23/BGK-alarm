import React from 'react';
import { AlertTriangle, Bell, Monitor, CheckCircle2 } from 'lucide-react';

interface DiagnosticCardProps {
  permissionStatus: {
    notifications: boolean;
    fullScreen: boolean;
  };
  onFixPermissions: () => void;
  onOpenNotificationSettings: () => void;
  onOpenFullScreenSettings: () => void;
  isHindi: boolean;
}

export const DiagnosticCard: React.FC<DiagnosticCardProps> = ({
  permissionStatus,
  onFixPermissions,
  onOpenNotificationSettings,
  onOpenFullScreenSettings,
  isHindi,
}) => {
  const hasIssues = !permissionStatus.notifications || !permissionStatus.fullScreen;

  if (!hasIssues) {
    return (
      <div className="bg-[#0C121E] border border-emerald-500/30 rounded-2xl p-3.5 mb-5 flex items-center justify-between shadow-[0_0_15px_rgba(0,255,102,0.05)]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-[#00FF66]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>{isHindi ? 'नेटिव अलार्म सिस्टम सक्रिय' : 'Native Android Alarm Active'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-[#00FF66] border border-emerald-500/40 font-mono">
                AlarmManager Clock
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isHindi
                ? 'ऐप बंद होने या स्क्रीन लॉक होने पर भी अलार्म 100% बजेगा।'
                : 'Alarms will ring reliably even when the app is swiped away or phone is locked.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0C121E] border border-amber-500/40 rounded-2xl p-4 mb-6 shadow-[0_0_20px_rgba(245,158,11,0.1)] relative overflow-hidden">
      {/* Warning Glow Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Orbitron',sans-serif]">
            {isHindi ? 'सिस्टम अनुमति आवश्यक' : 'Permissions Required'}
          </h3>
          <p className="text-[10px] text-amber-400 font-mono">
            {isHindi ? 'अलार्म की विश्वसनीयता के लिए अनुमति दें' : 'Required for native alarm execution'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Notification Issue */}
        {!permissionStatus.notifications && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-slate-200">
                  {isHindi ? 'नोटिफिकेशन बंद हैं' : 'Notifications Disabled'}
                </span>
              </div>
              <button
                onClick={onOpenNotificationSettings}
                className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-500 transition-colors cursor-pointer"
              >
                {isHindi ? 'अनुमति दें' : 'ENABLE'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {isHindi ? 'अलार्म बजने के लिए नोटिफिकेशन की अनुमति ज़रूरी है।' : 'Required for alarm sound and alerts.'}
            </p>
          </div>
        )}

        {/* Full screen permission */}
        {!permissionStatus.fullScreen && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold text-slate-200">
                  {isHindi ? 'लॉक स्क्रीन पर फुल-स्क्रीन अलार्म' : 'Full Screen Lock Alarm'}
                </span>
              </div>
              <button
                onClick={onOpenFullScreenSettings}
                className="px-2.5 py-1 bg-purple-600 text-white text-[10px] font-bold rounded-lg hover:bg-purple-500 transition-colors cursor-pointer"
              >
                {isHindi ? 'चालू करें' : 'ENABLE'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {isHindi ? 'लॉक स्क्रीन पर अलार्म दिखाने के लिए "Full screen notifications" चालू करें।' : 'Turn on Full Screen Notifications to display over lock screen.'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end">
        <button
          onClick={onFixPermissions}
          className="px-3 py-1.5 bg-[#00FF66] text-black font-extrabold text-xs rounded-xl shadow-[0_0_12px_rgba(0,255,102,0.3)] cursor-pointer"
        >
          {isHindi ? 'अनुमति जांचें व सुधारें' : 'Check & Request Permissions'}
        </button>
      </div>

      {/* Decorative pulse */}
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
    </div>
  );
};
