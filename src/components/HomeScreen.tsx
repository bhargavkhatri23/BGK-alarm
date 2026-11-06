import React, { useState, useEffect } from 'react';
import { AlarmItem } from '../types/alarm';
import { audioEngine } from '../utils/audioEngine';
import { DEFAULT_RINGTONE } from '../utils/constants';
import {
  AlarmClock,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Play,
  Square,
  Search,
  Volume2,
  VolumeX,
  Bell,
  Clock,
  Sparkles,
  CalendarDays,
  Radio,
  Zap,
  Activity,
} from 'lucide-react';
import { DiagnosticCard } from './DiagnosticCard';
import { notificationService } from '../utils/notificationService';

interface HomeScreenProps {
  userEmail: string;
  alarms: AlarmItem[];
  onAddAlarm: () => void;
  onEditAlarm: (alarm: AlarmItem) => void;
  onDeleteAlarm: (id: string) => void;
  onToggleAlarm: (id: string) => void;
  onTriggerTestAlarm: (alarm?: AlarmItem) => void;
  onQuickAddOneMinAlarm: () => void;
  onLogout: () => void;
  isHindi: boolean;
  onToggleLanguage: () => void;
  diagnosticStatus: {
    batteryOptimizationIgnored: boolean;
    canScheduleExactAlarms: boolean;
    notificationsGranted: boolean;
    overlayPermissionGranted: boolean;
  };
  onRefreshDiagnostics: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userEmail,
  alarms,
  onAddAlarm,
  onEditAlarm,
  onDeleteAlarm,
  onToggleAlarm,
  onTriggerTestAlarm,
  onQuickAddOneMinAlarm,
  onLogout,
  isHindi,
  onToggleLanguage,
  diagnosticStatus,
  onRefreshDiagnostics,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentlyPlayingTone, setCurrentlyPlayingTone] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [volume, setVolume] = useState(audioEngine.getVolume());
  const [isMuted, setIsMuted] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Live Digital Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format current live time
  const formattedLiveTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedLiveDate = currentTime.toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const handleTogglePlayTone = (ringtoneName: string) => {
    if (currentlyPlayingTone === ringtoneName) {
      audioEngine.stop();
      setCurrentlyPlayingTone(null);
    } else {
      audioEngine.preview(ringtoneName, 3500);
      setCurrentlyPlayingTone(ringtoneName);
      setTimeout(() => {
        setCurrentlyPlayingTone((curr) => (curr === ringtoneName ? null : curr));
      }, 3500);
    }
  };

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    audioEngine.setVolume(newVal);
    if (newVal === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume || 0.8);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  // Filter alarms
  const filteredAlarms = alarms.filter((item) => {
    const matchesSearch =
      item.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ringtone.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'active') return item.enabled;
    if (filterMode === 'inactive') return !item.enabled;
    return true;
  });

  const activeCount = alarms.filter((a) => a.enabled).length;

  return (
    <div className="min-h-full flex flex-col bg-[#090D16] text-slate-100 font-sans">
      {/* ================= 1. APP BAR (Omnitrix Sci-Fi Header) ================= */}
      <header className="sticky top-0 z-30 bg-[#0C121E]/95 backdrop-blur-md border-b border-emerald-500/25 px-4 py-3 sm:px-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Omnitrix Dial Header Badge */}
            <div className="relative w-10 h-10 rounded-xl bg-[#070B12] border border-emerald-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,102,0.25)] group">
              <div className="w-5 h-5 rounded-full border-2 border-[#00FF66] flex items-center justify-center">
                <div className="w-2 h-2 bg-[#00FF66] rounded-sm transform rotate-45 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span className="font-['Orbitron',sans-serif] tracking-wider text-white">BGK SMART ALARM</span>
                <span className="text-[11px] font-semibold text-[#00FF66] px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 hidden sm:inline">
                  OMNITRIX {isHindi ? 'रिमाइंडर्स' : 'REMINDERS'}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px] sm:max-w-xs">
                {userEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language toggle */}
            <button
              onClick={onToggleLanguage}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1A2438] text-slate-300 hover:text-[#00FF66] border border-emerald-500/25 transition-all cursor-pointer font-mono"
              title="भाषा बदलें"
            >
              {isHindi ? 'EN' : 'हिं'}
            </button>

            {/* Test Alarm Trigger Button */}
            <button
              onClick={() => onTriggerTestAlarm()}
              className="px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/50 text-[#00FF66] hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,102,0.15)] transition-all cursor-pointer"
              title="टेस्ट अलार्म बजाएँ"
            >
              <Radio className="w-3.5 h-3.5 text-[#00FF66] animate-pulse" />
              <span className="hidden sm:inline font-mono">
                {isHindi ? 'टेस्ट बीप' : 'TEST'}
              </span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-[#0F172A] hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition-colors cursor-pointer"
              title={isHindi ? 'लॉगआउट करें' : 'Log Out'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-28">
        {/* ================= 1.5 SYSTEM DIAGNOSTICS ================= */}
        <DiagnosticCard 
          status={diagnosticStatus}
          onFixBattery={async () => {
            await notificationService.triggerBatteryOptimization();
            setTimeout(onRefreshDiagnostics, 3000);
          }}
          onFixExactAlarm={async () => {
            await notificationService.triggerExactAlarm();
            setTimeout(onRefreshDiagnostics, 3000);
          }}
          onFixNotifications={async () => {
            await notificationService.requestPermissions();
            setTimeout(onRefreshDiagnostics, 1000);
          }}
          onFixOverlay={async () => {
            await notificationService.triggerOverlayPermission();
            setTimeout(onRefreshDiagnostics, 3000);
          }}
          isHindi={isHindi}
        />

        {/* ================= 2. LIVE CLOCK & DASHBOARD HERO (Omnitrix Core UI) ================= */}
        <section className="bg-gradient-to-br from-[#0C121E] via-[#090E18] to-[#070B12] border border-emerald-500/35 rounded-3xl p-5 sm:p-6 mb-5 shadow-[0_0_30px_rgba(0,255,102,0.08)] relative overflow-hidden">
          {/* Subtle sci-fi ambient glow background */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#00FF66]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center space-x-2 text-[#00FF66] text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{formattedLiveDate}</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-baseline gap-3">
                <span className="font-['Orbitron',monospace] text-[#00FF66] drop-shadow-[0_0_12px_rgba(0,255,102,0.4)]">
                  {formattedLiveTime}
                </span>
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
                  {isHindi ? 'लाइव मॉनिटर' : 'SYSTEM ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#00FF66]" />
                <span>{isHindi ? 'BGK SMART ALARM: समय पर सटीक अलर्ट, कभी न भूलें!' : 'BGK SMART ALARM: Precision alerts, never forget!'}</span>
              </p>
            </div>

            {/* Quick Stats & Volume controls */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-emerald-500/20 pt-3 sm:pt-0">
              <div className="bg-[#070B12]/90 border border-emerald-500/30 rounded-2xl px-3.5 py-2 text-center min-w-[78px] shadow-sm">
                <div className="text-lg font-bold text-white font-['Orbitron',monospace]">{alarms.length}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  {isHindi ? 'कुल' : 'TOTAL'}
                </div>
              </div>

              <div className="bg-[#070B12]/90 border border-emerald-500/40 rounded-2xl px-3.5 py-2 text-center min-w-[78px] shadow-[0_0_15px_rgba(0,255,102,0.1)]">
                <div className="text-lg font-bold text-[#00FF66] font-['Orbitron',monospace]">{activeCount}</div>
                <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                  {isHindi ? 'सक्रिय' : 'ACTIVE'}
                </div>
              </div>

              {/* Volume Slider with Omnitrix Neon Green Accent */}
              <div className="bg-[#070B12]/90 border border-emerald-500/30 rounded-2xl px-3 py-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-[#00FF66] transition-colors cursor-pointer"
                  title="Mute / Unmute"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#00FF66]" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 accent-[#00FF66] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  title="अलार्म वॉल्यूम"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================= AUTO-TRIGGER LIVE SYSTEM STATUS BAR ================= */}
        <div className="bg-[#0C121E] border border-emerald-500/30 rounded-2xl p-3.5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(0,255,102,0.06)]">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF66] opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{isHindi ? 'बैकग्राउंड टाइम चेकर सक्रिय' : 'Background Time-Checker Active'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-[#00FF66] border border-emerald-500/40 font-mono">
                  1-Sec Loop
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isHindi
                  ? 'डिवाइस का समय मिलते ही क्लासिक डिजिटल बीप अलार्म अपने आप बजेगा।'
                  : 'Classic Digital Beep triggers automatically the second scheduled time matches.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onQuickAddOneMinAlarm}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 via-[#00FF66] to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-95 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,102,0.3)] cursor-pointer transition-all"
              title="अगले 1 मिनट बाद का अलार्म सेट करें"
            >
              <Zap className="w-3.5 h-3.5 fill-black text-black" />
              <span>{isHindi ? '+1 मिनट बाद का ऑटो टेस्ट' : '+1 Min Auto Test'}</span>
            </button>
          </div>
        </div>

        {/* ================= 3. SEARCH & FILTER TABS ================= */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHindi ? 'रिमाइंडर खोजें (दवाई, पेट्रोल, मीटिंग...)' : 'Search reminders...'}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0C121E] border border-emerald-500/25 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66]/30 transition-all"
            />
          </div>

          <div className="flex items-center bg-[#0C121E] border border-emerald-500/25 rounded-xl p-1 self-start sm:self-auto space-x-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.35)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isHindi ? 'सभी' : 'All'} ({alarms.length})
            </button>
            <button
              onClick={() => setFilterMode('active')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterMode === 'active'
                  ? 'bg-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.35)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isHindi ? 'सक्रिय' : 'Active'} ({activeCount})
            </button>
            <button
              onClick={() => setFilterMode('inactive')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterMode === 'inactive'
                  ? 'bg-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.35)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isHindi ? 'बंद' : 'Off'} ({alarms.length - activeCount})
            </button>
          </div>
        </div>

        {/* ================= 4. ALARMS LIST (Omnitrix Tech Cards) ================= */}
        {filteredAlarms.length === 0 ? (
          /* Empty State */
          <div className="bg-[#0C121E]/80 border border-dashed border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto mt-6 shadow-[0_0_30px_rgba(0,255,102,0.04)]">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 text-[#00FF66] flex items-center justify-center mx-auto mb-4 border border-emerald-500/40 shadow-[0_0_15px_rgba(0,255,102,0.2)]">
              <Bell className="w-8 h-8" />
            </div>
            <p className="text-slate-200 font-semibold text-base mb-2 whitespace-pre-line leading-relaxed">
              {isHindi
                ? 'कोई अलार्म सेट नहीं है!\nनीचे दिए गए \'+\' बटन से नया रिमाइंडर जोड़ें।'
                : 'No alarms scheduled!\nTap the Omnitrix \'+\' button below to add an alert.'}
            </p>
            <p className="text-xs text-slate-400 mb-6">
              {isHindi
                ? 'दवाई, पेट्रोल, मीटिंग या अपने जरूरी काम के लिए अलर्ट लगाएं।'
                : 'Stay punctual for medicines, bike fuel, standups, and daily routines.'}
            </p>
            <button
              onClick={onAddAlarm}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 via-[#00FF66] to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold rounded-xl text-sm shadow-[0_0_20px_rgba(0,255,102,0.35)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isHindi ? 'नया अलार्म जोड़ें' : 'Create Alarm'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlarms.map((alarm) => {
              const isPlayingThis = currentlyPlayingTone === alarm.ringtone;
              return (
                <div
                  key={alarm.id}
                  className={`bg-[#0C121E] border transition-all rounded-2xl p-4 sm:p-5 shadow-md ${
                    alarm.enabled
                      ? 'border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_20px_rgba(0,255,102,0.06)]'
                      : 'border-slate-800/80 opacity-60 bg-[#070B12]/70'
                  }`}
                >
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    {/* Omnitrix Dial Emblem */}
                    <div className="flex items-start sm:items-center space-x-3.5 flex-1 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          alarm.enabled
                            ? 'bg-emerald-950/70 text-[#00FF66] border border-emerald-500/50 shadow-[0_0_12px_rgba(0,255,102,0.2)]'
                            : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}
                      >
                        <AlarmClock
                          className={`w-6 h-6 ${alarm.enabled ? 'text-[#00FF66]' : 'text-slate-500'}`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Task Title */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`text-base sm:text-lg font-bold truncate ${
                              alarm.enabled ? 'text-white' : 'text-slate-400 line-through'
                            }`}
                          >
                            {alarm.task}
                          </h3>
                        </div>

                        {/* Scheduled Time & Ringtone */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 mt-1 font-mono">
                          <span className="flex items-center gap-1 text-[#00FF66] font-semibold font-['Orbitron',monospace]">
                            <Clock className="w-3.5 h-3.5 text-[#00FF66]" />
                            <span>{alarm.time}</span>
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="truncate max-w-[200px] sm:max-w-xs text-slate-400">
                            {isHindi ? 'टोन: ' : 'Tone: '}
                            {DEFAULT_RINGTONE}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trailing Controls: Audio Preview, Toggle, Edit, Delete */}
                    <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                      {/* Audio preview play button */}
                      <button
                        type="button"
                        onClick={() => handleTogglePlayTone(alarm.ringtone)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isPlayingThis
                            ? 'bg-[#00FF66] text-black font-extrabold shadow-[0_0_12px_rgba(0,255,102,0.5)]'
                            : 'bg-[#0F172A] hover:bg-emerald-950 text-slate-300 hover:text-[#00FF66] border border-emerald-500/25'
                        }`}
                        title={isPlayingThis ? 'रोकें (Stop)' : 'टोन सुनें (Preview)'}
                      >
                        {isPlayingThis ? (
                          <Square className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>

                      {/* Active/Inactive Toggle Switch with Omnitrix Neon Glow */}
                      <button
                        type="button"
                        onClick={() => onToggleAlarm(alarm.id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          alarm.enabled ? 'bg-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.4)]' : 'bg-slate-800'
                        }`}
                        title={alarm.enabled ? 'सक्रिय अलार्म (चालू)' : 'निष्क्रिय अलार्म (बंद)'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                            alarm.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => onEditAlarm(alarm)}
                        className="p-2 rounded-xl bg-[#0F172A] hover:bg-amber-950/50 text-amber-400 border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer"
                        title={isHindi ? 'संशोधित करें' : 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(alarm.id)}
                        className="p-2 rounded-xl bg-[#0F172A] hover:bg-red-950/50 text-red-400 border border-slate-800 hover:border-red-500/40 transition-colors cursor-pointer"
                        title={isHindi ? 'हटाएँ' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Delete Confirmation prompt */}
                  {deleteConfirmId === alarm.id && (
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs animate-in fade-in">
                      <span className="text-red-300 font-medium">
                        {isHindi ? 'क्या आप इस अलार्म को हटाना चाहते हैं?' : 'Delete this alarm?'}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            onDeleteAlarm(alarm.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg cursor-pointer"
                        >
                          {isHindi ? 'हाँ, हटाएँ' : 'Delete'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                        >
                          {isHindi ? 'रद्द करें' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ================= 5. FLOATING ACTION BUTTON (Omnitrix Dial Style) ================= */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={onAddAlarm}
          className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-emerald-500 via-[#00FF66] to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-95 text-black font-extrabold rounded-2xl shadow-[0_0_25px_rgba(0,255,102,0.45)] border border-white/20 transition-all cursor-pointer font-['Orbitron',sans-serif]"
        >
          <div className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center">
            <Plus className="w-4 h-4 stroke-[3] text-black" />
          </div>
          <span className="text-sm font-extrabold tracking-wider">
            {isHindi ? 'नया अलार्म' : 'NEW ALARM'}
          </span>
        </button>
      </div>
    </div>
  );
};
