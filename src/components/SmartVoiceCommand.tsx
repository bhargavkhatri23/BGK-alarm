import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Send, Volume2, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { parseVoiceAlarmCommand, containsWakeWord, ParsedVoiceCommand } from '../utils/voiceCommandParser';
import { nativeAlarmService } from '../utils/nativeAlarm';
import { AlarmItem } from '../types/alarm';
import { DEFAULT_RINGTONE } from '../utils/constants';

interface SmartVoiceCommandProps {
  onAddAlarm: (alarmData: {
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
  }) => Promise<void>;
  contacts: Array<{ name: string; phoneNumber: string }>;
  isHindi: boolean;
}

export const SmartVoiceCommand: React.FC<SmartVoiceCommandProps> = ({
  onAddAlarm,
  contacts,
  isHindi,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isContinuousListening, setIsContinuousListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastActionStatus, setLastActionStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize SpeechRecognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = isHindi ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptChunk;
          } else {
            interim += transcriptChunk;
          }
        }

        const currentText = (final || interim).trim();
        setLiveTranscript(currentText);

        // If final utterance detected or speech has the BGK wake word
        if (final && final.trim().length > 0) {
          handleExecuteVoiceCommand(final.trim());
        } else if (interim && containsWakeWord(interim) && (interim.includes('बजे') || interim.includes('alarm') || interim.includes('अलार्म'))) {
          // If user stopped talking or phrase is clear
          clearTimeout(restartTimerRef.current as any);
          restartTimerRef.current = setTimeout(() => {
            handleExecuteVoiceCommand(interim.trim());
          }, 1200);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech Recognition notice:', event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // If continuous wake-word listening mode is enabled, keep listening in background
        if (isContinuousListening) {
          try {
            recognition.start();
          } catch (e) {
            // Already active or error
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
    };
  }, [isContinuousListening, isHindi, contacts]);

  const toggleVoiceListening = async () => {
    // 1. If running on native Android app, open standard Android Google Speech Recognizer dialog
    if (Capacitor.isNativePlatform()) {
      setIsListening(true);
      setLastActionStatus({
        type: 'info',
        message: isHindi
          ? 'Google माइक खुल रहा है... बोलिए: "BGK 9:00 बजे का अलार्म लगाओ"'
          : 'Opening Google speech recognizer... Speak: "BGK 9:00 AM"',
      });

      try {
        const result = await nativeAlarmService.startSpeechRecognition(isHindi ? 'hi-IN' : 'en-IN');
        setIsListening(false);

        if (result && result.transcript && result.transcript.trim().length > 0) {
          setInputText(result.transcript);
          setLiveTranscript(result.transcript);
          await handleExecuteVoiceCommand(result.transcript, true, result.alternatives || []);
        } else if (result && result.cancelled) {
          setLastActionStatus({
            type: 'info',
            message: isHindi ? 'माइक बंद किया गया।' : 'Voice input cancelled.',
          });
        }
      } catch (err: any) {
        setIsListening(false);
        setLastActionStatus({
          type: 'error',
          message: isHindi
            ? 'माइक शुरू करने में समस्या आई। कृपया नीचे टाइप करें।'
            : 'Could not open voice recognizer. Please type below.',
        });
      }
      return;
    }

    // 2. Web browser fallback
    if (!recognitionRef.current) {
      setLastActionStatus({
        type: 'info',
        message: isHindi
          ? 'ब्राउज़र में सीधे "बीजीके 9:00 बजे" लिखकर "लागू करें" दबाएं (Android ऐप में यह Google माइक ओपन करता है)।'
          : 'Speech recognition is not active in browser. Please type below.',
      });
      return;
    }

    if (isListening) {
      setIsContinuousListening(false);
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      setIsContinuousListening(true);
      try {
        recognitionRef.current.start();
        setLiveTranscript('');
        setLastActionStatus({
          type: 'info',
          message: isHindi
            ? 'सुन रहा हूँ... बोलिए: "BGK 9:00 बजे का अलार्म लगाओ"'
            : 'Listening... Say: "BGK set alarm for 9:00 AM"',
        });
      } catch (e) {
        console.error('Recognition start error', e);
      }
    }
  };

  const handleExecuteVoiceCommand = async (
    command: string,
    isDirectTrigger: boolean = true,
    alternatives: string[] = []
  ) => {
    if (!command.trim()) return;

    const parsed: ParsedVoiceCommand = parseVoiceAlarmCommand(
      command,
      contacts,
      isDirectTrigger,
      alternatives
    );

    if (!parsed.hasWakeWord) {
      setLastActionStatus({
        type: 'error',
        message: isHindi
          ? 'कृपया "BGK" या "बीजीके" बोलकर कमांड दें। उदाहरण: "BGK 9:00 बजे का अलार्म लगाओ"'
          : 'Please include wake word "BGK". Example: "BGK set alarm for 9:00 AM"',
      });
      return;
    }

    if (!parsed.isValid) {
      setLastActionStatus({
        type: 'error',
        message: parsed.feedbackMessage,
      });
      return;
    }

    try {
      await onAddAlarm({
        task: parsed.task,
        day: parsed.day,
        hour: parsed.hour,
        minute: parsed.minute,
        ampm: parsed.ampm,
        ringtone: DEFAULT_RINGTONE,
        callContactName: parsed.matchedContactName || '',
        callContactNumber: parsed.matchedContactNumber || '',
        whatsappContactName: parsed.matchedContactName || '',
        whatsappContactNumber: parsed.matchedContactNumber || '',
        whatsappMessage: parsed.whatsappMessage || '',
      });

      // Voice Feedback (Text to Speech if available)
      speakConfirmation(parsed);

      setLastActionStatus({
        type: 'success',
        message: parsed.feedbackMessage,
      });

      setInputText('');
      setLiveTranscript('');
    } catch (error) {
      setLastActionStatus({
        type: 'error',
        message: isHindi ? 'अलार्म सेट करने में समस्या आई।' : 'Failed to schedule alarm.',
      });
    }
  };

  const speakConfirmation = (parsed: ParsedVoiceCommand) => {
    if ('speechSynthesis' in window) {
      try {
        const text = isHindi
          ? `बीजीके: ${parsed.hour} बज के ${parsed.minute} मिनट ${parsed.ampm} का अलार्म सेट कर दिया गया है।`
          : `BGK: Alarm set for ${parsed.hour}:${parsed.minute} ${parsed.ampm}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = isHindi ? 'hi-IN' : 'en-US';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleExecuteVoiceCommand(inputText.trim());
    }
  };

  return (
    <div className="bg-white border border-blue-200 rounded-3xl p-4 sm:p-5 mb-5 shadow-sm relative overflow-hidden transition-all">
      {/* Background soft glow when listening */}
      {isListening && (
        <div className="absolute inset-0 bg-blue-500/5 pointer-events-none animate-pulse" />
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isListening ? 'bg-blue-600 text-white shadow-md animate-bounce' : 'bg-blue-50 text-blue-600 border border-blue-200'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 font-['Orbitron',sans-serif]">
              <span>BGK SMART AI VOICE COMMAND</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                WAKE WORD: "BGK"
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              {isHindi
                ? 'बोलें: "BGK 9:00 बजे का अलार्म लगाओ" या "बीजीके शाम 7 बजे दवाई का अलार्म सेट करो"'
                : 'Say: "BGK set alarm for 9:00 AM" or "BGK 7:30 PM medicine reminder"'}
            </p>
          </div>
        </div>

        {/* Round Mic Button - Only Mic Icon, No Text */}
        <button
          type="button"
          onClick={toggleVoiceListening}
          aria-label={isListening ? (isHindi ? 'माइक बंद करें' : 'Stop listening') : (isHindi ? 'बोलकर अलार्म सेट करें' : 'Voice input')}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md active:scale-95 ${
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-200 hover:shadow-lg'
          }`}
          title={isListening ? (isHindi ? 'माइक बंद करें' : 'Stop Listening') : (isHindi ? 'बोलकर अलार्म सेट करें' : 'Speak to set alarm')}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Live Voice Transcript Display */}
      {isListening && (
        <div className="mb-3 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-900 font-mono animate-in fade-in">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600" />
          </span>
          <span className="truncate">
            {liveTranscript ? `"${liveTranscript}"` : (isHindi ? 'बोलिए, सुन रहा हूँ (BGK...)' : 'Listening for BGK...')}
          </span>
        </div>
      )}

      {/* Input / Command Form */}
      <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isHindi
                ? 'जैसे: बीजीके 9:00 बजे का अलार्म लगाओ'
                : 'e.g. BGK 9:00 AM set alarm'
            }
            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm transition-all"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isHindi ? 'लागू करें' : 'Apply'}</span>
        </button>
      </form>

      {/* Feedback & Confirmation Banner */}
      {lastActionStatus && (
        <div
          className={`mt-2.5 p-2.5 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in ${
            lastActionStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : lastActionStatus.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          {lastActionStatus.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          {lastActionStatus.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          {lastActionStatus.type === 'info' && (
            <Volume2 className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
          )}
          <span className="flex-1">{lastActionStatus.message}</span>
          <button
            type="button"
            onClick={() => setLastActionStatus(null)}
            className="text-[11px] text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Example Chips */}
      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
        <span className="font-semibold text-slate-600 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-blue-600" />
          {isHindi ? 'क्विक क्लिक टेस्ट:' : 'Quick examples:'}
        </span>
        <button
          type="button"
          onClick={() => handleExecuteVoiceCommand('BGK 9:00 बजे का अलार्म लगाओ')}
          className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-colors cursor-pointer"
        >
          BGK 9:00 बजे
        </button>
        <button
          type="button"
          onClick={() => handleExecuteVoiceCommand('BGK 7:30 AM दवाई का अलार्म')}
          className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-colors cursor-pointer"
        >
          BGK 7:30 AM दवाई
        </button>
        <button
          type="button"
          onClick={() => handleExecuteVoiceCommand('बीजीके रात 10 बजे मीटिंग अलार्म सेट करो')}
          className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-colors cursor-pointer"
        >
          बीजीके रात 10 बजे
        </button>
      </div>
    </div>
  );
};
