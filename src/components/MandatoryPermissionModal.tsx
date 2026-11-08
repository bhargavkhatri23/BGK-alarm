import React from 'react';
import { Bell, Monitor, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PermissionStatusResult } from '../utils/notificationService';

interface MandatoryPermissionModalProps {
  status: PermissionStatusResult;
  onRequestNotifications: () => Promise<void>;
  onRequestOverlay: () => Promise<void>;
  onRecheck: () => Promise<void>;
  isHindi: boolean;
}

export const MandatoryPermissionModal: React.FC<MandatoryPermissionModalProps> = ({
  status,
  onRequestNotifications,
  onRequestOverlay,
  onRecheck,
  isHindi,
}) => {
  if (status.allMandatoryGranted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white border border-blue-200 rounded-3xl w-full max-w-md p-6 sm:p-7 text-left shadow-2xl relative overflow-hidden flex flex-col text-slate-800">
        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
            <ShieldCheck className="w-7 h-7 text-blue-600 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-blue-600 tracking-widest uppercase px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
              {isHindi ? 'अनिवार्य अनुमति' : 'MANDATORY SETUP'}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 font-['Orbitron',sans-serif] tracking-wide mt-1">
              {isHindi ? 'अलार्म की 2 ज़रूरी अनुमतियाँ' : '2 Required Permissions'}
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          {isHindi
            ? 'BGK Smart Alarm को ऐप बंद होने या लॉक स्क्रीन पर भी 100% सटीक बजने के लिए नीचे दी गई दोनों अनुमतियाँ अनिवार्य हैं। कृपया दोनों को Allow करें:'
            : 'For BGK Smart Alarm to ring 100% reliably even when the app is closed or phone is locked, both permissions below are required:'}
        </p>

        {/* Permission 1: Notifications */}
        <div className="space-y-3 mb-6">
          <div className={`p-4 rounded-2xl border transition-all ${
            status.notificationsGranted
              ? 'bg-blue-50/60 border-blue-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  status.notificationsGranted ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>1. {isHindi ? 'नोटिफिकेशन अनुमति' : 'Notification Permission'}</span>
                    {status.notificationsGranted && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isHindi ? 'अलार्म साउंड और अलर्ट सूचना के लिए' : 'For sound, vibration & status alert'}
                  </p>
                </div>
              </div>

              <div>
                {status.notificationsGranted ? (
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-mono">
                    {isHindi ? 'मंजूर' : 'GRANTED'}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onRequestNotifications}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition-all font-mono"
                  >
                    {isHindi ? 'अनुमति दें' : 'ALLOW'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Permission 2: Display Over Other Apps */}
          <div className={`p-4 rounded-2xl border transition-all ${
            status.overlayPermissionGranted
              ? 'bg-blue-50/60 border-blue-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  status.overlayPermissionGranted ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                }`}>
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>2. {isHindi ? 'अन्य ऐप्स के ऊपर दिखाएं' : 'Display Over Other Apps'}</span>
                    {status.overlayPermissionGranted && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isHindi ? 'लॉक स्क्रीन पर फुल-स्क्रीन अलार्म दिखाने के लिए' : 'To wake & show alarm screen when locked'}
                  </p>
                </div>
              </div>

              <div>
                {status.overlayPermissionGranted ? (
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-mono">
                    {isHindi ? 'मंजूर' : 'GRANTED'}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onRequestOverlay}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition-all font-mono"
                  >
                    {isHindi ? 'अनुमति दें' : 'ALLOW'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Status Verification */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRecheck}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black rounded-xl text-sm shadow-[0_4px_15px_rgba(37,99,235,0.35)] cursor-pointer transition-all font-['Orbitron',sans-serif] tracking-wider text-center"
          >
            {isHindi ? 'अनुमति सत्यापित करें (VERIFY & CONTINUE)' : 'VERIFY & CONTINUE'}
          </button>
          <p className="text-[11px] text-center text-slate-500">
            {isHindi
              ? '🔒 दोनों अनुमतियाँ स्वीकृत होने के बाद ही मुख्य अलार्म स्क्रीन खुलेगी।'
              : '🔒 Both permissions are mandatory to access the alarms dashboard.'}
          </p>
        </div>
      </div>
    </div>
  );
};
