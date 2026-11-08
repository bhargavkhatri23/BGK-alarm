import React from 'react';
import { AlertTriangle, Zap, Bell, Clock, Monitor } from 'lucide-react';

interface DiagnosticStatus {
  batteryOptimizationIgnored: boolean;
  canScheduleExactAlarms: boolean;
  notificationsGranted: boolean;
  overlayPermissionGranted: boolean;
}

interface DiagnosticCardProps {
  status: DiagnosticStatus;
  onFixBattery: () => void;
  onFixExactAlarm: () => void;
  onFixNotifications: () => void;
  onFixOverlay: () => void;
  isHindi: boolean;
}

export const DiagnosticCard: React.FC<DiagnosticCardProps> = ({
  status,
  onFixBattery,
  onFixExactAlarm,
  onFixNotifications,
  onFixOverlay,
  isHindi,
}) => {
  const hasIssues = 
    !status.batteryOptimizationIgnored || 
    !status.canScheduleExactAlarms || 
    !status.notificationsGranted || 
    !status.overlayPermissionGranted;

  if (!hasIssues) return null;

  return (
    <div className="bg-[#0C121E] border border-amber-500/40 rounded-2xl p-4 mb-6 shadow-[0_0_20px_rgba(245,158,11,0.1)] relative overflow-hidden">
      {/* Warning Glow Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Orbitron',sans-serif]">
            {isHindi ? 'सिस्टम डायग्नोस्टिक' : 'System Diagnostic'}
          </h3>
          <p className="text-[10px] text-amber-400 font-mono">
            {isHindi ? 'अलार्म की विश्वसनीयता के लिए सुधार आवश्यक' : 'Required for alarm reliability'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Notification Issue */}
        {!status.notificationsGranted && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-slate-200">
                  {isHindi ? 'नोटिफिकेशन बंद हैं' : 'Notifications Disabled'}
                </span>
              </div>
              <button
                onClick={onFixNotifications}
                className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-500 transition-colors"
              >
                {isHindi ? 'अनुमति दें' : 'FIX NOW'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              <span className="font-bold text-slate-300">{isHindi ? 'कारण: ' : 'Reason: '}</span>
              {isHindi ? 'सिस्टम नोटिफिकेशन बंद होने पर अलार्म स्क्रीन पर नहीं दिखेगा। ' : 'The OS is blocking visual alarm alerts.'}
            </p>
          </div>
        )}

        {/* Overlay Permission Issue */}
        {!status.overlayPermissionGranted && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold text-slate-200">
                  {isHindi ? 'अन्य ऐप्स के ऊपर दिखाएं' : 'Display Over Apps'}
                </span>
              </div>
              <button
                onClick={onFixOverlay}
                className="px-2.5 py-1 bg-purple-600 text-white text-[10px] font-bold rounded-lg hover:bg-purple-500 transition-colors"
              >
                {isHindi ? 'अनुमति दें' : 'ALLOW'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              <span className="font-bold text-slate-300">{isHindi ? 'कारण: ' : 'Reason: '}</span>
              {isHindi ? 'इसके बिना अलार्म फुल स्क्रीन पर नहीं दिखेगा।' : 'Required to show the alarm screen over other apps.'}
            </p>
          </div>
        )}

        {/* Exact Alarm Issue */}
        {!status.canScheduleExactAlarms && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-200">
                  {isHindi ? 'सटीक अलार्म अनुमति' : 'Exact Alarm Access'}
                </span>
              </div>
              <button
                onClick={onFixExactAlarm}
                className="px-2.5 py-1 bg-amber-600 text-white text-[10px] font-bold rounded-lg hover:bg-amber-500 transition-colors"
              >
                {isHindi ? 'ठीक करें' : 'ENABLE'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              <span className="font-bold text-slate-300">{isHindi ? 'कारण: ' : 'Reason: '}</span>
              {isHindi ? 'इसके बिना अलार्म 1-2 मिनट की देरी से बज सकता है।' : 'Alarms may trigger late or be grouped by Android.'}
            </p>
          </div>
        )}

        {/* Battery Optimization Issue */}
        {!status.batteryOptimizationIgnored && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-200">
                  {isHindi ? 'बैटरी बचत प्रतिबंध' : 'Battery Restrictions'}
                </span>
              </div>
              <button
                onClick={onFixBattery}
                className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-500 transition-colors"
              >
                {isHindi ? 'अनलिमिटेड करें' : 'FIX'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              <span className="font-bold text-slate-300">{isHindi ? 'कारण: ' : 'Reason: '}</span>
              {isHindi ? 'फोन की बैटरी बचत सर्विस ऐप को बैकग्राउंड में बंद कर सकती है।' : 'Android may kill the app to save battery power.'}
            </p>
          </div>
        )}
      </div>

      {/* Decorative pulse */}
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
    </div>
  );
};
