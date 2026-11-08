import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PermissionStatusResult } from '../utils/notificationService';

interface DiagnosticCardProps {
  status: PermissionStatusResult;
  isHindi: boolean;
}

export const DiagnosticCard: React.FC<DiagnosticCardProps> = ({
  status,
  isHindi,
}) => {
  if (status.allMandatoryGranted) {
    return null;
  }

  return (
    <div className="bg-white border border-blue-200 rounded-2xl p-3.5 mb-5 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <span>{isHindi ? 'सभी आवश्यक अनुमतियाँ सक्रिय' : 'All Required Permissions Granted'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-mono">
              Notifications + Overlay OK
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {isHindi
              ? 'बैकग्राउंड और लॉकस्क्रीन पर अलार्म 100% सटीक काम करने के लिए तैयार है।'
              : 'App is fully authorized to trigger audio alerts and full-screen alarm screens.'}
          </p>
        </div>
      </div>
    </div>
  );
};
