import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, Battery, BellRing, Cpu } from 'lucide-react';

interface DeviceFrameWrapperProps {
  children: React.ReactNode;
  isHindi: boolean;
  onTriggerTestAlarm: () => void;
}

export const DeviceFrameWrapper: React.FC<DeviceFrameWrapperProps> = ({
  children,
  isHindi,
  onTriggerTestAlarm,
}) => {
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('desktop');
  const [phoneTime, setPhoneTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setPhoneTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#05080F] flex flex-col items-center justify-start text-slate-100">
      {/* Top Universal App Control Bar - Omnitrix Tech Styling */}
      <header className="w-full bg-[#080D18]/95 backdrop-blur-md border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-between text-xs z-20">
        <div className="flex items-center space-x-2.5">
          {/* Omnitrix Dial Emblem */}
          <div className="relative w-7 h-7 rounded-full bg-slate-950 border border-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.4)] flex items-center justify-center p-0.5">
            <div className="w-full h-full rounded-full bg-[#08120b] flex items-center justify-center">
              {/* Hourglass Icon shape */}
              <div className="w-3.5 h-3.5 relative flex items-center justify-center">
                <span className="absolute w-2.5 h-2.5 border-t-2 border-b-2 border-[#00FF66] rotate-45" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-white tracking-wider font-mono text-sm">
              BGK <span className="text-[#00FF66] omnitrix-text-glow">YADGIRI</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-950/80 text-[#00FF66] border border-emerald-500/30">
              Omnitrix OS
            </span>
          </div>
        </div>

        {/* View Mode & Quick Actions */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#090F1A] border border-emerald-500/30 rounded-xl p-0.5 shadow-inner">
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-all font-semibold cursor-pointer ${
                viewMode === 'mobile'
                  ? 'bg-gradient-to-r from-emerald-600 to-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.4)] font-bold'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
              title="मोबाइल ऐप व्यू"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isHindi ? 'मोबाइल' : 'Mobile'}</span>
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-all font-semibold cursor-pointer ${
                viewMode === 'desktop'
                  ? 'bg-gradient-to-r from-emerald-600 to-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.4)] font-bold'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
              title="डेस्कटॉप व्यू"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isHindi ? 'डेस्कटॉप' : 'Desktop'}</span>
            </button>
          </div>

          <button
            onClick={onTriggerTestAlarm}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/60 text-[#00FF66] border border-emerald-500/40 hover:border-[#00FF66] font-bold text-xs transition-all active:scale-95 shadow-[0_0_10px_rgba(0,255,102,0.15)] cursor-pointer"
            title="अलार्म बीप टेस्ट"
          >
            <BellRing className="w-3.5 h-3.5 text-[#00FF66] animate-ring-shake" />
            <span className="hidden sm:inline">{isHindi ? 'टेस्ट बीप' : 'Test Beep'}</span>
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="w-full flex-1 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-x-hidden">
        {viewMode === 'mobile' ? (
          /* Phone Frame - Omnitrix Sci-fi Bezel */
          <div className="relative w-full max-w-[420px] h-[860px] max-h-[94vh] bg-[#090D16] border-[8px] border-[#131B2A] rounded-[48px] shadow-[0_25px_65px_-15px_rgba(0,0,0,0.95),0_0_30px_rgba(0,255,102,0.15)] flex flex-col overflow-hidden ring-1 ring-emerald-500/30">
            {/* Phone Top Notch / Dynamic Island */}
            <div className="h-8 w-full bg-[#090D16] flex items-center justify-between px-6 pt-1 text-[11px] font-semibold text-slate-300 shrink-0 z-40 select-none border-b border-emerald-500/10">
              <span className="font-mono text-xs text-[#00FF66]">{phoneTime || '09:41'}</span>
              <div className="w-20 h-4 bg-slate-950 rounded-full border border-emerald-500/40 flex items-center justify-center shadow-[0_0_8px_rgba(0,255,102,0.3)]">
                <div className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-400/80">
                <Wifi className="w-3 h-3 text-[#00FF66]" />
                <Battery className="w-3.5 h-3.5 text-[#00FF66]" />
              </div>
            </div>

            {/* Phone Screen Contents */}
            <div className="flex-1 w-full overflow-y-auto relative bg-[#090D16]">
              {children}
            </div>

            {/* Bottom Home Indicator */}
            <div className="h-5 w-full bg-[#090D16] flex items-center justify-center shrink-0 z-40 border-t border-emerald-500/10">
              <div className="w-28 h-1 bg-emerald-500/40 rounded-full shadow-[0_0_8px_rgba(0,255,102,0.5)]" />
            </div>
          </div>
        ) : (
          /* Full Desktop Width */
          <div className="w-full h-full min-h-[calc(100vh-45px)] flex flex-col bg-[#070B12]">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
