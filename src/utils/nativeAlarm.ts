import { registerPlugin, Capacitor } from '@capacitor/core';
import { AlarmItem } from '../types/alarm';

interface INativeAlarmPlugin {
  schedule(options: { id: string; timeMillis: number; label: string; repeatDays?: string }): Promise<void>;
  cancel(options: { id: string }): Promise<void>;
  cancelAll(): Promise<void>;
  canScheduleExact(): Promise<{ granted: boolean }>;
  openExactAlarmSettings(): Promise<void>;
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

  public async scheduleAlarm(alarm: AlarmItem) {
    if (!this.isNative || !alarm.enabled) return;
    const timeMillis = this.parseAlarmToMillis(alarm);
    if (!timeMillis || timeMillis <= Date.now()) return;

    try {
      await NativeAlarm.schedule({
        id: alarm.id,
        timeMillis: timeMillis,
        label: alarm.task,
        repeatDays: alarm.day
      });
      console.log(`NativeAlarm scheduled for ${alarm.task} at ${new Date(timeMillis)}`);
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
