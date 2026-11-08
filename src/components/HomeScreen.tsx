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
  CalendarDays,
  Radio,
  Zap,
  Activity,
} from 'lucide-react';
import { DiagnosticCard } from './DiagnosticCard';
import { PermissionStatusResult } from '../utils/notificationService';
import { WhatsAppIcon } from './WhatsAppIcon';

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
  permissionStatus: PermissionStatusResult;
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
  permissionStatus,
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
    <div className="min-h-full flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* ================= 1. APP BAR ================= */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shadow-sm">
              <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-sm transform rotate-45 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="font-['Orbitron',sans-serif] tracking-wider text-slate-900">BGK SMART ALARM</span>
                <span className="text-[11px] font-semibold text-blue-600 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 hidden sm:inline">
                  {isHindi ? 'रिमाइंडर्स' : 'REMINDERS'}
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-mono truncate max-w-[180px] sm:max-w-xs">
                {userEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleLanguage}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-blue-600 border border-slate-200 transition-all cursor-pointer font-mono"
              title="भाषा बदलें"
            >
              {isHindi ? 'EN' : 'हिं'}
            </button>

            <button
              onClick={() => onTriggerTestAlarm()}
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 hover:text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="टेस्ट अलार्म बजाएँ"
            >
              <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span className="hidden sm:inline font-mono">
                {isHindi ? 'टेस्ट बीप' : 'TEST'}
              </span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
              title={isHindi ? 'लॉगआउट करें' : 'Log Out'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-28">
        {/* System Diagnostics */}
        <DiagnosticCard 
          status={permissionStatus}
          isHindi={isHindi}
        />

        {/* ================= 2. LIVE CLOCK & DASHBOARD HERO (Classic Digital Segment LED Font) ================= */}
        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 mb-5 shadow-md relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center space-x-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{formattedLiveDate}</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-3">
                {/* Classic digital alarm clock segment LED font style */}
                <span className="font-['Orbitron',monospace] text-blue-600 text-4xl sm:text-5xl font-extrabold tracking-widest drop-shadow-[0_0_12px_rgba(37,99,235,0.35)]">
                  {formattedLiveTime}
                </span>
                <span className="text-xs font-semibold text-blue-700 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 font-mono">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  {isHindi ? 'लाइव मॉनिटर' : 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>{isHindi ? 'BGK SMART ALARM: समय पर सटीक अलर्ट, कभी न भूलें!' : 'BGK SMART ALARM: Precision alerts, never forget!'}</span>
              </p>
            </div>

            {/* Quick Stats & Volume controls */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-center min-w-[78px] shadow-sm">
                <div className="text-lg font-bold text-slate-900 font-['Orbitron',monospace]">{alarms.length}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  {isHindi ? 'कुल' : 'TOTAL'}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl px-3.5 py-2 text-center min-w-[78px] shadow-sm">
                <div className="text-lg font-bold text-blue-600 font-['Orbitron',monospace]">{activeCount}</div>
                <div className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">
                  {isHindi ? 'सक्रिय' : 'ACTIVE'}
                </div>
              </div>

              {/* Volume Slider */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 flex items-center space-x-2 shadow-sm">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                  title="Mute / Unmute"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-500" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-blue-600" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  title="अलार्म वॉल्यूम"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Auto-Trigger Live System Status Bar */}
        <div className="bg-white border border-blue-200 rounded-2xl p-3.5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>{isHindi ? 'बैकग्राउंड टाइम चेकर सक्रिय' : 'Background Time-Checker Active'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-mono">
                  1-Sec Loop
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isHindi
                  ? 'डिवाइस का समय मिलते ही क्लासिक डिजिटल बीप अलार्म अपने आप बजेगा।'
                  : 'Classic Digital Beep triggers automatically when scheduled time matches.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onQuickAddOneMinAlarm}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
              title="अगले 1 मिनट बाद का अलार्म सेट करें"
            >
              <Zap className="w-3.5 h-3.5 fill-white text-white" />
              <span>{isHindi ? '+1 मिनट बाद का ऑटो टेस्ट' : '+1 Min Auto Test'}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHindi ? 'रिमाइंडर खोजें (दवाई, पेट्रोल, मीटिंग...)' : 'Search reminders...'}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 self-start sm:self-auto space-x-1 shadow-sm">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isHindi ? 'सभी' : 'All'} ({alarms.length})
            </button>
            <button
              onClick={() => setFilterMode('active')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterMode === 'active'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isHindi ? 'सक्रिय' : 'Active'} ({activeCount})
            </button>
            <button
              onClick={() => setFilterMode('inactive')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterMode === 'inactive'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isHindi ? 'बंद' : 'Off'} ({alarms.length - activeCount})
            </button>
          </div>
        </div>

        {/* Alarms List */}
        {filteredAlarms.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto mt-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-200 shadow-sm">
              <Bell className="w-8 h-8" />
            </div>
            <p className="text-slate-800 font-semibold text-base mb-2 whitespace-pre-line leading-relaxed">
              {isHindi
                ? 'कोई अलार्म सेट नहीं है!\nनीचे दिए गए \'+\' बटन से नया रिमाइंडर जोड़ें।'
                : 'No alarms scheduled!\nTap the \'+\' button below to add an alert.'}
            </p>
            <p className="text-xs text-slate-500 mb-6">
              {isHindi
                ? 'दवाई, पेट्रोल, मीटिंग या अपने जरूरी काम के लिए अलर्ट लगाएं।'
                : 'Stay punctual for medicines, bike fuel, standups, and daily routines.'}
            </p>
            <button
              onClick={onAddAlarm}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm shadow-md transition-all cursor-pointer"
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
                  className={`bg-white border transition-all rounded-2xl p-4 sm:p-5 shadow-sm ${
                    alarm.enabled
                      ? 'border-blue-200 hover:border-blue-400 shadow-sm'
                      : 'border-slate-200 opacity-60 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center space-x-3.5 flex-1 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          alarm.enabled
                            ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        <AlarmClock
                          className={`w-6 h-6 ${alarm.enabled ? 'text-blue-600' : 'text-slate-400'}`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`text-base sm:text-lg font-bold truncate ${
                              alarm.enabled ? 'text-slate-900' : 'text-slate-400 line-through'
                            }`}
                          >
                            {alarm.task}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mt-1 font-mono">
                          <span className="flex items-center gap-1 text-blue-600 font-semibold font-['Orbitron',monospace]">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{alarm.time}</span>
                          </span>
                          {(alarm.callContactName || alarm.whatsappContactName) && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-blue-600 font-medium inline-flex items-center gap-1.5 flex-wrap">
                                {alarm.callContactName && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <span>📞</span>
                                    <span>{alarm.callContactName}</span>
                                  </span>
                                )}
                                {alarm.callContactName && alarm.whatsappContactName && <span className="text-slate-300">|</span>}
                                {alarm.whatsappContactName && (
                                  <span className="inline-flex items-center gap-1">
                                    <WhatsAppIcon size={12} className="text-blue-600 inline-block" />
                                    <span>{alarm.whatsappContactName}</span>
                                  </span>
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePlayTone(alarm.ringtone)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isPlayingThis
                            ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                            : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200'
                        }`}
                        title={isPlayingThis ? 'रोकें (Stop)' : 'टोन सुनें (Preview)'}
                      >
                        {isPlayingThis ? (
                          <Square className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleAlarm(alarm.id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          alarm.enabled ? 'bg-blue-600 shadow-sm' : 'bg-slate-300'
                        }`}
                        title={alarm.enabled ? 'सक्रिय अलार्म (चालू)' : 'निष्क्रिय अलार्म (बंद)'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            alarm.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditAlarm(alarm)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer"
                        title={isHindi ? 'संशोधित करें' : 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(alarm.id)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-red-500 border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
                        title={isHindi ? 'हटाएँ' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {deleteConfirmId === alarm.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs animate-in fade-in">
                      <span className="text-red-600 font-medium">
                        {isHindi ? 'क्या आप इस अलार्म को हटाना चाहते हैं?' : 'Delete this alarm?'}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            onDeleteAlarm(alarm.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg cursor-pointer shadow-sm"
                        >
                          {isHindi ? 'हाँ, हटाएँ' : 'Delete'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
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

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={onAddAlarm}
          className="flex items-center gap-2.5 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold rounded-2xl shadow-xl border border-white/20 transition-all cursor-pointer font-['Orbitron',sans-serif]"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Plus className="w-4 h-4 stroke-[3] text-white" />
          </div>
          <span className="text-sm font-extrabold tracking-wider">
            {isHindi ? 'नया अलार्म' : 'NEW ALARM'}
          </span>
        </button>
      </div>
    </div>
  );
};
