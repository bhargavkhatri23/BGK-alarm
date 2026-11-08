import React, { useEffect, useState } from 'react';
import { AlarmItem } from '../types/alarm';
import { audioEngine } from '../utils/audioEngine';
import { Bell, Clock, Radio, Volume2 } from 'lucide-react';

interface AlarmRingingModalProps {
  alarm: AlarmItem;
  onDismiss: () => void;
  onSnooze: (alarmId: string, snoozeMinutes?: number) => void;
  isHindi: boolean;
}

export const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({
  alarm,
  onDismiss,
  onSnooze,
  isHindi,
}) => {
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    // Play the classic digital beep in loop
    audioEngine.play(alarm.ringtone, true);

    const interval = setInterval(() => {
      setPulseScale((prev) => (prev === 1 ? 1.08 : 1));
    }, 600);

    return () => {
      clearInterval(interval);
      audioEngine.stop();
    };
  }, [alarm.ringtone]);

  const handleSnoozeClick = () => {
    audioEngine.stop();
    onSnooze(alarm.id, 5);
  };

  const handleDismissClick = () => {
    audioEngine.stop();
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-[#0C121E] to-[#070B12] border-2 border-emerald-500 rounded-3xl w-full max-w-sm p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(0,255,102,0.4)] relative overflow-hidden flex flex-col items-center">
        {/* Glow ambient background */}
        <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none rounded-3xl" />

        {/* Omnitrix Dial Ringing Icon */}
        <div
          className="relative w-24 h-24 rounded-full bg-[#070B12] border-4 border-[#00FF66] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,255,102,0.6)] transition-transform duration-300"
          style={{ transform: `scale(${pulseScale})` }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-[#00FF66] flex items-center justify-center">
            <Bell className="w-6 h-6 text-[#00FF66] animate-bounce" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF66] opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#00FF66]" />
          </span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-1.5 text-[#00FF66] text-xs font-bold font-mono tracking-widest uppercase mb-1">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>{isHindi ? 'अलार्म बज रहा है!' : 'ALARM RINGING!'}</span>
        </div>

        {/* Task Name */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2 drop-shadow-md">
          {alarm.task}
        </h2>

        {/* Time Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[#00FF66] font-mono text-sm font-bold mb-4 shadow-[0_0_15px_rgba(0,255,102,0.2)]">
          <Clock className="w-4 h-4" />
          <span>{alarm.time}</span>
        </div>

        {/* Tone info */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-8">
          <Volume2 className="w-3.5 h-3.5 text-[#00FF66]" />
          <span>{alarm.ringtone}</span>
        </div>

        {/* Action Buttons: Snooze & Dismiss */}
        <div className="w-full space-y-3">
          {/* Snooze Button */}
          <button
            onClick={handleSnoozeClick}
            className="w-full py-3.5 px-4 bg-[#0F172A] hover:bg-[#1E293B] border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold rounded-2xl text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span>{isHindi ? 'स्नूज़ करें (+5 मिनट)' : 'Snooze (+5 mins)'}</span>
          </button>

          {/* Dismiss Button */}
          <button
            onClick={handleDismissClick}
            className="w-full py-4 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-extrabold rounded-2xl text-base transition-all shadow-[0_0_25px_rgba(239,68,68,0.4)] active:scale-95 cursor-pointer font-['Orbitron',sans-serif] tracking-wider"
          >
            {isHindi ? 'बंद करें (DISMISS)' : 'DISMISS'}
          </button>
        </div>
      </div>
    </div>
  );
};
