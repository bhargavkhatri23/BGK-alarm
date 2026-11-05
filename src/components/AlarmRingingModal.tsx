import React, { useEffect } from 'react';
import { AlarmItem } from '../types/alarm';
import { audioEngine } from '../utils/audioEngine';
import { BellRing, Check, Clock, Volume2, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AlarmRingingModalProps {
  alarm: AlarmItem;
  onDismiss: () => void;
  onSnooze: (alarmId: string, minutes: number) => void;
  isHindi: boolean;
}

export const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({
  alarm,
  onDismiss,
  onSnooze,
  isHindi,
}) => {
  useEffect(() => {
    // Start continuous alarm audio
    audioEngine.play(alarm.ringtone, true);

    // Vibrate phone if supported
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 800]);
      } catch {
        // Ignored
      }
    }

    return () => {
      audioEngine.stop();
    };
  }, [alarm]);

  const handleDismiss = () => {
    audioEngine.stop();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Ignored
    }
    onDismiss();
  };

  const handleSnooze = () => {
    audioEngine.stop();
    onSnooze(alarm.id, 5);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#0C121E] via-[#090D16] to-[#05080F] border-2 border-red-500/80 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center relative overflow-hidden animate-urgent-pulse">
        {/* Urgent Header Banner */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 text-red-300 border border-red-500/50 text-xs font-extrabold uppercase tracking-wider mb-5 font-['Orbitron',sans-serif]">
          <ShieldAlert className="w-3.5 h-3.5 animate-pulse text-red-400" />
          <span>{isHindi ? 'हाई अलर्ट अलार्म बज रहा है!' : 'OMNITRIX HIGH ALERT ACTIVE'}</span>
        </div>

        {/* Pulsing Bell Icon matching High-tech theme */}
        <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-400 opacity-30 blur-xl animate-pulse" />
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-red-500/50 border-2 border-white/20">
            <BellRing className="w-12 h-12 text-white animate-ring-shake" />
          </div>
        </div>

        {/* Task Name */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
          {alarm.task}
        </h2>

        {/* Alarm Time & Details with Omnitrix Neon Highlight */}
        <div className="flex items-center justify-center gap-2 text-[#00FF66] text-sm font-semibold mb-4 bg-[#070B12] py-2 px-4 rounded-xl border border-emerald-500/40 inline-flex shadow-[0_0_15px_rgba(0,255,102,0.15)] font-['Orbitron',monospace]">
          <Clock className="w-4 h-4 text-[#00FF66]" />
          <span>{alarm.time}</span>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 mb-6 bg-[#0F172A] py-1.5 px-3 rounded-lg max-w-xs mx-auto border border-slate-800 font-mono">
          <Volume2 className="w-3.5 h-3.5 text-[#00FF66] shrink-0" />
          <span className="truncate">{alarm.ringtone}</span>
        </div>

        {/* Actions: Dismiss & Snooze */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleSnooze}
            className="w-full py-3.5 px-4 bg-[#0F172A] hover:bg-slate-800 active:bg-slate-750 text-slate-200 border border-emerald-500/30 hover:border-emerald-500/60 font-semibold rounded-2xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer font-['Orbitron',sans-serif]"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{isHindi ? 'स्नूज़ (5 मिनट)' : 'Snooze 5m'}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold rounded-2xl text-sm shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer font-['Orbitron',sans-serif]"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isHindi ? 'बंद करें (DISMISS)' : 'DISMISS'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
