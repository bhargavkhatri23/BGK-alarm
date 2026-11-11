import { registerPlugin, Capacitor } from '@capacitor/core';
import { AlarmItem } from '../types/alarm';

interface INativeAlarmPlugin {
  schedule(options: { 
    id: string; 
    timeMillis: number; 
    label: string; 
    repeatDays?: string;
    callContactName?: string;
    callContactNumber?: string;
    whatsappContactName?: string;
    whatsappContactNumber?: string;
    whatsappMessage?: string;
  }): Promise<void>;
  cancel(options: { id: string }): Promise<void>;
  cancelAll(): Promise<void>;
  canScheduleExact(): Promise<{ granted: boolean }>;
  openExactAlarmSettings(): Promise<void>;
  getContacts(): Promise<{ contacts: Array<{ name: string; phoneNumber: string }> }>;
  requestContactsAndCallPermissions(): Promise<void>;
  startSpeechRecognition(options?: { language?: string }): Promise<{
    transcript: string;
    alternatives?: string[];
    cancelled?: boolean;
    error?: string;
  }>;
  saveWhatsAppApiConfig(options: {
    enabled: boolean;
    provider: string;
    phoneNumberId?: string;
    accessToken?: string;
    endpointUrl?: string;
    apiKey?: string;
  }): Promise<void>;
}

const NativeAlarm = registerPlugin<INativeAlarmPlugin>('NativeAlarm');

class NativeAlarmService {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  public async canScheduleExactAlarms(): Promise<boolean> {
    if (!this.isNative) return true;
    try {
      const res = await NativeAlarm.canScheduleExact();
      return res.granted;
    } catch {
      return true;
    }
  }

  public async openExactSettings() {
    if (!this.isNative) return;
    try {
      await NativeAlarm.openExactAlarmSettings();
    } catch {}
  }

  public async requestContactsAndCall() {
    if (!this.isNative) return;
    try {
      await NativeAlarm.requestContactsAndCallPermissions();
    } catch {}
  }

  public async getDeviceContacts(): Promise<Array<{ name: string; phoneNumber: string }>> {
    if (!this.isNative) {
      return [
        { name: 'Dr. Sharma (Cardio)', phoneNumber: '+919876543210' },
        { name: 'Dad (Family)', phoneNumber: '+919123456789' },
        { name: 'Office Manager', phoneNumber: '+919988776655' },
        { name: 'Pharmacy Store', phoneNumber: '+919811223344' }
      ];
    }
    try {
      const res = await NativeAlarm.getContacts();
      return res.contacts || [];
    } catch {
      return [];
    }
  }

  public async startSpeechRecognition(language: string = 'hi-IN'): Promise<{
    transcript: string;
    alternatives?: string[];
    cancelled?: boolean;
    error?: string;
  }> {
    if (!this.isNative) {
      return { transcript: '', cancelled: false };
    }
    try {
      return await NativeAlarm.startSpeechRecognition({ language });
    } catch (err: any) {
      console.warn('Native speech recognition call failed', err);
      return { transcript: '', cancelled: true, error: err?.message || 'Failed' };
    }
  }

  public async syncWhatsAppApiConfig(config: any) {
    if (!this.isNative) return;
    try {
      await NativeAlarm.saveWhatsAppApiConfig({
        enabled: Boolean(config.enabled),
        provider: config.provider || 'meta_cloud',
        phoneNumberId: config.metaCloud?.phoneNumberId || '',
        accessToken: config.metaCloud?.accessToken || '',
        endpointUrl: config.gatewayRest?.endpointUrl || '',
        apiKey: config.gatewayRest?.apiKey || '',
      });
    } catch (e) {
      console.warn('Failed to sync WhatsApp API config to NativeAlarm', e);
    }
  }

  public async scheduleAlarm(alarm: AlarmItem) {
    if (!this.isNative || !alarm.enabled) return;
    const timeMillis = this.parseAlarmToMillis(alarm);
    if (!timeMillis || timeMillis <= Date.now()) return;

    try {
      await NativeAlarm.schedule({
        id: alarm.id,
        timeMillis: timeMillis,
        label: alarm.task,
        repeatDays: alarm.day,
        callContactName: alarm.callContactName || '',
        callContactNumber: alarm.callContactNumber || '',
        whatsappContactName: alarm.whatsappContactName || '',
        whatsappContactNumber: alarm.whatsappContactNumber || '',
        whatsappMessage: alarm.whatsappMessage || ''
      });
      console.log(`NativeAlarm scheduled for ${alarm.task} with independent call & whatsapp contacts`);
    } catch (e) {
      console.error('Failed to schedule native alarm', e);
    }
  }

  public async cancelAlarm(alarmId: string) {
    if (!this.isNative) return;
    try {
      await NativeAlarm.cancel({ id: alarmId });
    } catch (e) {
      console.error('Failed to cancel native alarm', e);
    }
  }

  public async syncAlarms(alarms: AlarmItem[]) {
    if (!this.isNative) return;
    try {
      await NativeAlarm.cancelAll();
      for (const alarm of alarms) {
        if (alarm.enabled) {
          await this.scheduleAlarm(alarm);
        }
      }
    } catch (e) {
      console.error('Failed to sync native alarms', e);
    }
  }

  private parseAlarmToMillis(alarm: AlarmItem): number | null {
    const now = new Date();
    const date = new Date();
    let hours = parseInt(alarm.hour, 10);
    if (alarm.ampm === 'PM' && hours < 12) hours += 12;
    if (alarm.ampm === 'AM' && hours === 12) hours = 0;
    date.setHours(hours, parseInt(alarm.minute, 10), 0, 0);

    if (alarm.day !== 'प्रतिदिन (Every Day)') {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDayIndex = dayNames.findIndex(d => alarm.day.includes(d));
      if (targetDayIndex !== -1) {
        let daysUntil = (targetDayIndex - now.getDay() + 7) % 7;
        if (daysUntil === 0 && date.getTime() <= now.getTime()) {
          daysUntil = 7;
        }
        date.setDate(date.getDate() + daysUntil);
      }
    } else {
      if (date.getTime() <= now.getTime()) {
        date.setDate(date.getDate() + 1);
      }
    }

    return date.getTime();
  }
}

export const nativeAlarmService = new NativeAlarmService();
