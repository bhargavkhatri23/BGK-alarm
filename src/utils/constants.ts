import { AlarmItem } from '../types/alarm';

export const DAYS_LIST = [
  "प्रतिदिन (Every Day)",
  "सोमवार (Monday)",
  "मंगलवार (Tuesday)",
  "बुधवार (Wednesday)",
  "गुरुवार (Thursday)",
  "शुक्रवार (Friday)",
  "शनिवार (Saturday)",
  "रविवार (Sunday)",
];

export const HOURS_LIST = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

// Precise 1-minute interval strictly from "00" to "59"
export const MINUTES_LIST = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

// Fixed default ringtone permanently set to "क्लासिक डिजिटल बीप"
export const DEFAULT_RINGTONE = "क्लासिक डिजिटल बीप";

export const RINGTONES_LIST = [
  DEFAULT_RINGTONE,
];

export const QUICK_TASK_PRESETS = [
  { label: "💊 दवाई लेना (Medicine)", task: "दवाई लेना (Medicine Reminder)", category: "health" as const, ringtone: DEFAULT_RINGTONE },
  { label: "⛽ पेट्रोल भरवाना (Refuel)", task: "गाड़ी में पेट्रोल भरवाना", category: "fuel" as const, ringtone: DEFAULT_RINGTONE },
  { label: "💼 ऑफिस मीटिंग (Meeting)", task: "ऑफिस जरूरी मीटिंग", category: "work" as const, ringtone: DEFAULT_RINGTONE },
  { label: "📚 पढ़ाई का समय (Study)", task: "स्टडी व रिवीज़न का समय", category: "study" as const, ringtone: DEFAULT_RINGTONE },
  { label: "🧘 योग / कसरत (Workout)", task: "मॉर्निंग योग व एक्सरसाइज", category: "health" as const, ringtone: DEFAULT_RINGTONE },
  { label: "💧 पानी पीना (Hydration)", task: "ग्लास भर पानी पिएं", category: "health" as const, ringtone: DEFAULT_RINGTONE },
  { label: "⚡ बिल भरना (Pay Bill)", task: "बिजली / क्रेडिट कार्ड बिल भरना", category: "general" as const, ringtone: DEFAULT_RINGTONE },
];

// Clean initial empty database without hardcoded mock credentials
export const INITIAL_DEMO_USERS: Record<string, string> = {};

export const INITIAL_DEMO_ALARMS: Record<string, AlarmItem[]> = {};
