import React, { useState, useEffect } from 'react';
import { AlarmItem } from '../types/alarm';
import { DAYS_LIST, HOURS_LIST, MINUTES_LIST, DEFAULT_RINGTONE, QUICK_TASK_PRESETS } from '../utils/constants';
import { audioEngine } from '../utils/audioEngine';
import { nativeAlarmService } from '../utils/nativeAlarm';
import { Volume2, VolumeX, Sparkles, X, Check, Clock, Calendar, Bell, Radio, Phone, Search, Trash2 } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface CreateAlarmSheetProps {
  existingAlarm?: AlarmItem | null;
  onSave: (alarmData: {
    task: string;
    day: string;
    hour: string;
    minute: string;
    ampm: 'AM' | 'PM';
    ringtone: string;
    callContactName?: string;
    callContactNumber?: string;
    whatsappContactName?: string;
    whatsappContactNumber?: string;
    whatsappMessage?: string;
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
  const selectedRingtone = DEFAULT_RINGTONE;
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [taskError, setTaskError] = useState(false);

  const [contacts, setContacts] = useState<Array<{ name: string; phoneNumber: string }>>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Call Contact State
  const [callContactName, setCallContactName] = useState(existingAlarm?.callContactName || '');
  const [callContactNumber, setCallContactNumber] = useState(existingAlarm?.callContactNumber || '');
  const [showCallPicker, setShowCallPicker] = useState(false);
  const [callSearchQuery, setCallSearchQuery] = useState('');

  // WhatsApp Contact & Message State (empty default message)
  const [whatsappContactName, setWhatsappContactName] = useState(existingAlarm?.whatsappContactName || '');
  const [whatsappContactNumber, setWhatsappContactNumber] = useState(existingAlarm?.whatsappContactNumber || '');
  const [whatsappMessage, setWhatsappMessage] = useState(existingAlarm?.whatsappMessage || '');
  const [showWhatsappPicker, setShowWhatsappPicker] = useState(false);
  const [whatsappSearchQuery, setWhatsappSearchQuery] = useState('');

  useEffect(() => {
    loadDeviceContacts();
    return () => {
      audioEngine.stop();
    };
  }, []);

  const loadDeviceContacts = async () => {
    setLoadingContacts(true);
    try {
      await nativeAlarmService.requestContactsAndCall();
      const list = await nativeAlarmService.getDeviceContacts();
      setContacts(list);
    } catch (e) {
      console.error('Error loading contacts', e);
    } finally {
      setLoadingContacts(false);
    }
  };

  const filteredCallContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(callSearchQuery.toLowerCase()) ||
      c.phoneNumber.includes(callSearchQuery)
  );

  const filteredWhatsappContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(whatsappSearchQuery.toLowerCase()) ||
      c.phoneNumber.includes(whatsappSearchQuery)
  );

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
      callContactName,
      callContactNumber,
      whatsappContactName,
      whatsappContactNumber,
      whatsappMessage: whatsappMessage.trim(),
    });
  };

  const applyPreset = (preset: typeof QUICK_TASK_PRESETS[0]) => {
    setTask(preset.task);
    setTaskError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-4">
      <div className="bg-white border border-blue-200 rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-sm">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 font-['Orbitron',sans-serif] tracking-wide flex items-center gap-2">
              <span>{existingAlarm ? (isHindi ? 'अलार्म संशोधित करें' : 'Edit Alarm') : (isHindi ? 'नया अलार्म सेट करें' : 'Set New Alarm')}</span>
            </h2>
          </div>
          <button
            onClick={() => {
              audioEngine.stop();
              onClose();
            }}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Task Name Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">
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
              className={`w-full px-4 py-3 bg-slate-50 border ${
                taskError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'
              } rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm`}
            />
            {taskError && (
              <p className="text-red-600 text-xs mt-1">
                {isHindi ? 'कृपया काम का विवरण दर्ज करें' : 'Please specify the reminder task'}
              </p>
            )}
          </div>

          {/* Quick preset suggestions */}
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1 mb-2 font-mono">
              <Sparkles className="w-3 h-3 text-blue-600" />
              {isHindi ? 'जल्दी से चुनें (Quick Presets)' : 'Quick Presets'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TASK_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 transition-all cursor-pointer font-sans shadow-sm"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Call Feature Section */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-900 font-mono">
                    {isHindi ? 'ऑटो कॉल संपर्क (Call Contact)' : 'Auto-Call Contact'}
                  </label>
                  <p className="text-[10px] text-slate-500">
                    {isHindi ? 'अलार्म बजने पर इस नंबर पर कॉल लगेगा' : 'Outbound call when alarm triggers'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCallPicker(!showCallPicker)}
                className="text-xs font-bold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl transition-all cursor-pointer font-mono shadow-sm flex items-center gap-1.5"
              >
                <Phone className="w-3 h-3" />
                <span>{callContactName ? (isHindi ? 'बदलों' : 'Change') : (isHindi ? 'संपर्क चुनें' : 'Select Contact')}</span>
              </button>
            </div>

            {callContactName ? (
              <div className="flex items-center justify-between bg-blue-50/50 border border-blue-200 rounded-xl p-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{callContactName}</p>
                  <p className="text-[11px] text-blue-600 font-mono truncate">{callContactNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCallContactName('');
                    setCallContactNumber('');
                  }}
                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                  title="Remove call contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            {showCallPicker && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 animate-in fade-in shadow-sm">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={callSearchQuery}
                    onChange={(e) => setCallSearchQuery(e.target.value)}
                    placeholder={isHindi ? 'कॉल संपर्क खोजें...' : 'Search call contact...'}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {loadingContacts ? (
                    <p className="text-xs text-slate-500 text-center py-2 font-mono">Loading...</p>
                  ) : filteredCallContacts.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2 font-mono">No contacts</p>
                  ) : (
                    filteredCallContacts.map((c, idx) => {
                      const isSelected = callContactNumber === c.phoneNumber;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setCallContactName(c.name);
                            setCallContactNumber(c.phoneNumber);
                            setShowCallPicker(false);
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700'
                          }`}
                        >
                          <div>
                            <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{c.name}</p>
                            <p className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-blue-600'}`}>{c.phoneNumber}</p>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Feature Section */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <WhatsAppIcon size={16} className="text-blue-600" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-900 font-mono">
                    {isHindi ? 'WhatsApp संदेश संपर्क (WhatsApp Contact)' : 'WhatsApp Contact & Message'}
                  </label>
                  <p className="text-[10px] text-slate-500">
                    {isHindi ? 'अलार्म बजने पर इस नंबर पर WhatsApp संदेश भेजा जाएगा' : 'Automated WhatsApp message when alarm triggers'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsappPicker(!showWhatsappPicker)}
                className="text-xs font-bold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl transition-all cursor-pointer font-mono shadow-sm flex items-center gap-1.5"
              >
                <WhatsAppIcon size={14} className="text-blue-600" />
                <span>{whatsappContactName ? (isHindi ? 'बदलों' : 'Change') : (isHindi ? 'संपर्क चुनें' : 'Select Contact')}</span>
              </button>
            </div>

            {whatsappContactName ? (
              <div className="flex items-center justify-between bg-blue-50/50 border border-blue-200 rounded-xl p-2.5">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
                    <WhatsAppIcon size={14} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{whatsappContactName}</p>
                    <p className="text-[11px] text-blue-600 font-mono truncate">{whatsappContactNumber}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWhatsappContactName('');
                    setWhatsappContactNumber('');
                  }}
                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                  title="Remove WhatsApp contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            {showWhatsappPicker && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 animate-in fade-in shadow-sm">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={whatsappSearchQuery}
                    onChange={(e) => setWhatsappSearchQuery(e.target.value)}
                    placeholder={isHindi ? 'WhatsApp संपर्क खोजें...' : 'Search WhatsApp contact...'}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {loadingContacts ? (
                    <p className="text-xs text-slate-500 text-center py-2 font-mono">Loading...</p>
                  ) : filteredWhatsappContacts.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2 font-mono">No contacts</p>
                  ) : (
                    filteredWhatsappContacts.map((c, idx) => {
                      const isSelected = whatsappContactNumber === c.phoneNumber;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setWhatsappContactName(c.name);
                            setWhatsappContactNumber(c.phoneNumber);
                            setShowWhatsappPicker(false);
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700'
                          }`}
                        >
                          <div>
                            <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{c.name}</p>
                            <p className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-blue-600'}`}>{c.phoneNumber}</p>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Empty default WhatsApp message field */}
            {whatsappContactNumber && (
              <div className="space-y-1.5 animate-in fade-in pt-1">
                <label className="block text-xs font-semibold text-slate-700 font-mono">
                  {isHindi ? 'कस्टम WhatsApp संदेश (खाली छोड़ें या टाइप करें)' : 'Custom WhatsApp Message (Type from scratch)'}
                </label>
                <textarea
                  rows={2}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder={isHindi ? 'यहाँ अपना कस्टम WhatsApp संदेश टाइप करें...' : 'Type custom WhatsApp message here...'}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Manual Time Selection */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2 font-['Orbitron',sans-serif]">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{isHindi ? 'मैनुअल टाइम सिलेक्शन (Schedule & Time):' : 'Schedule & Time Selection:'}</span>
            </h3>

            <div className="mb-3">
              <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{isHindi ? 'दिन चुनें (Select Day)' : 'Select Day'}</span>
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 cursor-pointer shadow-sm"
              >
                {DAYS_LIST.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-mono">
                  {isHindi ? 'घंटा (Hour)' : 'Hour'}
                </label>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 cursor-pointer font-['Orbitron',monospace] shadow-sm"
                >
                  {HOURS_LIST.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-500 font-mono">
                    {isHindi ? 'मिनट (Minute)' : 'Minute'}
                  </label>
                  <span className="text-[10px] text-blue-600 font-mono">00-59</span>
                </div>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 cursor-pointer font-['Orbitron',monospace] shadow-sm"
                >
                  {MINUTES_LIST.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1 font-mono">
                  {isHindi ? 'प्रहर (AM/PM)' : 'AM / PM'}
                </label>
                <select
                  value={selectedAmPm}
                  onChange={(e) => setSelectedAmPm(e.target.value as 'AM' | 'PM')}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-blue-600 cursor-pointer font-mono shadow-sm"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fixed Default Ringtone */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-blue-600" />
                <label className="text-xs font-semibold text-slate-700 font-mono">
                  {isHindi ? 'रिंगटोन (Ringtone)' : 'Ringtone'}
                </label>
              </div>
              <button
                type="button"
                onClick={handleTestRingtone}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  isPlayingPreview
                    ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                    : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 shadow-sm'
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

            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm shadow-sm">
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="font-semibold text-slate-900 tracking-wide">
                  {DEFAULT_RINGTONE}
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200 font-mono">
                {isHindi ? 'डिफ़ॉल्ट फिक्स्ड' : 'Fixed Default'}
              </span>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold rounded-xl text-sm shadow-[0_4px_15px_rgba(37,99,235,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer font-['Orbitron',sans-serif] tracking-wider"
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
