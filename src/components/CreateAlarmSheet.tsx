import React, { useState, useEffect } from 'react';
import { AlarmItem } from '../types/alarm';
import { DAYS_LIST, HOURS_LIST, MINUTES_LIST, DEFAULT_RINGTONE, QUICK_TASK_PRESETS } from '../utils/constants';
import { audioEngine } from '../utils/audioEngine';
import { Volume2, VolumeX, Sparkles, X, Check, Clock, Calendar, Bell, Radio } from 'lucide-react';

interface CreateAlarmSheetProps {
  existingAlarm?: AlarmItem | null;
  onSave: (alarmData: {
    task: string;
    day: string;
    hour: string;
    minute: string;
    ampm: 'AM' | 'PM';
    ringtone: string;
  }) => void;
  onClose: () => void;
  isHindi: boolean;
}

export const CreateAlarmSheet: React.FC<CreateAlarmSheetProps> = ({
  existingAlarm,
  onSave,
  onClose,
  isHindi,
}) => {
  const [task, setTask] = useState(existingAlarm ? existingAlarm.task : '');
  const [selectedDay, setSelectedDay] = useState(
    existingAlarm ? existingAlarm.day : 'प्रतिदिन (Every Day)'
  );
  const [selectedHour, setSelectedHour] = useState(
    existingAlarm ? existingAlarm.hour : '08'
  );
  const [selectedMinute, setSelectedMinute] = useState(
    existingAlarm ? existingAlarm.minute : '30'
  );
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>(
    existingAlarm ? existingAlarm.ampm : 'AM'
  );
  // Permanently fixed to "क्लासिक डिजिटल बीप"
  const selectedRingtone = DEFAULT_RINGTONE;
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [taskError, setTaskError] = useState(false);

  useEffect(() => {
    return () => {
      audioEngine.stop();
    };
  }, []);

  const handleTestRingtone = () => {
    if (isPlayingPreview) {
      audioEngine.stop();
      setIsPlayingPreview(false);
    } else {
      setIsPlayingPreview(true);
      audioEngine.preview(selectedRingtone, 3500);
      setTimeout(() => {
        setIsPlayingPreview(false);
      }, 3500);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTask = task.trim();
    if (!cleanTask) {
      setTaskError(true);
      return;
    }
    audioEngine.stop();
    onSave({
      task: cleanTask,
      day: selectedDay,
      hour: selectedHour,
      minute: selectedMinute,
      ampm: selectedAmPm,
      ringtone: selectedRingtone,
    });
  };

  const applyPreset = (preset: typeof QUICK_TASK_PRESETS[0]) => {
    setTask(preset.task);
    setTaskError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-4">
      <div className="bg-[#0C121E] border border-emerald-500/40 rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-[0_0_40px_rgba(0,255,102,0.15)] relative overflow-hidden text-slate-100">
        {/* Header with Omnitrix Accent */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-emerald-500/20 bg-[#070B12]/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 text-[#00FF66] border border-emerald-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(0,255,102,0.2)]">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white font-['Orbitron',sans-serif] tracking-wide flex items-center gap-2">
              <span>{existingAlarm ? (isHindi ? 'अलार्म संशोधित करें' : 'Edit Alarm') : (isHindi ? 'नया अलार्म सेट करें' : 'Set New Alarm')}</span>
              <span className="text-xs text-[#00FF66] font-mono">OMNITRIX</span>
            </h2>
          </div>
          <button
            onClick={() => {
              audioEngine.stop();
              onClose();
            }}
            className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body with Smooth Scroll */}
        <form onSubmit={handleSave} className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Task Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
              {isHindi ? 'क्या काम करना है? (जैसे: दवाई लेना, पेट्रोल भरवाना)' : 'What is the task? (e.g. Medicine, Fuel)'}
            </label>
            <input
              type="text"
              required
              value={task}
              onChange={(e) => {
                setTask(e.target.value);
                if (taskError) setTaskError(false);
              }}
              placeholder={isHindi ? 'जैसे: शुगर की दवाई लेना, ऑफिस मीटिंग, पेट्रोल' : 'e.g., Take medicine, Team standup'}
              className={`w-full px-4 py-3 bg-[#070B12] border ${
                taskError ? 'border-red-500 ring-1 ring-red-500' : 'border-emerald-500/30'
              } rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66]/30 transition-all`}
            />
            {taskError && (
              <p className="text-red-400 text-xs mt-1">
                {isHindi ? 'कृपया काम का विवरण दर्ज करें' : 'Please specify the reminder task'}
              </p>
            )}
          </div>

          {/* Quick preset suggestions */}
          <div>
            <span className="text-[11px] font-semibold text-[#00FF66] uppercase tracking-wider flex items-center gap-1 mb-2 font-mono">
              <Sparkles className="w-3 h-3 text-[#00FF66]" />
              {isHindi ? 'जल्दी से चुनें (Quick Presets)' : 'Quick Presets'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TASK_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-[#0F172A] hover:bg-emerald-950/70 border border-emerald-500/25 text-slate-300 hover:text-[#00FF66] hover:border-emerald-500/50 transition-all cursor-pointer font-sans"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Time Selection */}
          <div className="pt-2 border-t border-emerald-500/20">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2 font-['Orbitron',sans-serif]">
              <Clock className="w-4 h-4 text-[#00FF66]" />
              <span>{isHindi ? 'मैनुअल टाइम सिलेक्शन (Schedule & Time):' : 'Schedule & Time Selection:'}</span>
            </h3>

            {/* Day Dropdown */}
            <div className="mb-3">
              <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-[#00FF66]" />
                <span>{isHindi ? 'दिन चुनें (Select Day)' : 'Select Day'}</span>
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#070B12] border border-emerald-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF66] cursor-pointer"
              >
                {DAYS_LIST.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Hour, Minute (1-minute intervals from 00 to 59), AM/PM Row */}
            <div className="grid grid-cols-3 gap-2">
              {/* Hour Dropdown (01 to 12) */}
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono">
                  {isHindi ? 'घंटा (Hour)' : 'Hour'}
                </label>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#070B12] border border-emerald-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF66] cursor-pointer font-['Orbitron',monospace]"
                >
                  {HOURS_LIST.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minute Dropdown (Precise 1-minute interval from 00 to 59) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-400 font-mono">
                    {isHindi ? 'मिनट (Minute)' : 'Minute'}
                  </label>
                  <span className="text-[10px] text-[#00FF66] font-mono">00-59</span>
                </div>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#070B12] border border-emerald-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF66] cursor-pointer font-['Orbitron',monospace]"
                >
                  {MINUTES_LIST.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* AM/PM Dropdown */}
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono">
                  {isHindi ? 'प्रहर (AM/PM)' : 'AM / PM'}
                </label>
                <select
                  value={selectedAmPm}
                  onChange={(e) => setSelectedAmPm(e.target.value as 'AM' | 'PM')}
                  className="w-full px-3 py-2.5 bg-[#070B12] border border-emerald-500/30 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-[#00FF66] cursor-pointer font-mono"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fixed Default Ringtone (Permanently fixed to "क्लासिक डिजिटल बीप") */}
          <div className="pt-2 border-t border-emerald-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-[#00FF66]" />
                <label className="text-xs font-semibold text-slate-300 font-mono">
                  {isHindi ? 'रिंगटोन (Ringtone)' : 'Ringtone'}
                </label>
              </div>
              <button
                type="button"
                onClick={handleTestRingtone}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  isPlayingPreview
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse'
                    : 'bg-emerald-950/70 text-[#00FF66] border border-emerald-500/40 hover:bg-emerald-900/60 shadow-[0_0_10px_rgba(0,255,102,0.15)]'
                }`}
              >
                {isPlayingPreview ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>{isHindi ? 'रोकें (Stop)' : 'Stop'}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isHindi ? 'बीप सुनें (Test)' : 'Preview Beep'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Fixed Ringtone Card Display without dropdown */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#070B12] border border-emerald-500/35 rounded-xl text-white text-sm shadow-[0_0_15px_rgba(0,255,102,0.08)]">
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66] animate-pulse" />
                <span className="font-semibold text-white tracking-wide">
                  {DEFAULT_RINGTONE}
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-950 text-[#00FF66] border border-emerald-500/40 font-mono">
                {isHindi ? 'डिफ़ॉल्ट फिक्स्ड' : 'Fixed Default'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
              {isHindi
                ? '🔔 सभी अलार्म के लिए क्लासिक डिजिटल बीप को स्थायी रूप से निर्धारित किया गया है।'
                : '🔔 Classic digital beep is permanently fixed as the alarm ringtone for all alerts.'}
            </p>
          </div>

          {/* Save Button (Omnitrix High-Tech Button) */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-[#00FF66] to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold rounded-xl text-sm shadow-[0_0_25px_rgba(0,255,102,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer font-['Orbitron',sans-serif] tracking-wider"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isHindi ? 'अलार्म सेव करें' : 'SAVE ALARM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
