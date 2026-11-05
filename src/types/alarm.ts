export interface AlarmItem {
  id: string;
  userId?: string;
  task: string;
  time: string; // e.g., "सोमवार (Monday), 12:00 AM" or "प्रतिदिन (Every Day), 08:30 AM"
  day: string;
  hour: string;
  minute: string;
  ampm: 'AM' | 'PM';
  ringtone: string;
  enabled: boolean;
  category?: 'health' | 'work' | 'fuel' | 'study' | 'general';
  createdAt: number;
}

export interface UserAccount {
  email: string;
  password: string;
  name?: string;
  createdAt: number;
}

export type AppLanguage = 'hi' | 'en';
