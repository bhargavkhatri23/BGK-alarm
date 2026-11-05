import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { AlarmItem } from '../types/alarm';

interface IAlarmPermissionPlugin {
  requestBatteryOptimization(): Promise<void>;
  requestExactAlarm(): Promise<void>;
}

const AlarmPermission = registerPlugin<IAlarmPermissionPlugin>('AlarmPermission');

class NotificationService {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Request permissions for local notifications
   */
  public async requestPermissions(): Promise<boolean> {
    if (!this.isNative) return false;
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (e) {
      console.warn('LocalNotifications not available', e);
      return false;
    }
  }

  /**
   * Directly trigger the native Android Battery Optimization exemption dialog
   */
  public async triggerBatteryOptimization() {
    if (!this.isNative) return;
    try {
      await AlarmPermission.requestBatteryOptimization();
    } catch (e) {
      console.error('Failed to trigger battery optimization intent', e);
    }
  }

  /**
   * Directly trigger the native Android Exact Alarm permission intent
   */
  public async triggerExactAlarm() {
    if (!this.isNative) return;
    try {
      await AlarmPermission.requestExactAlarm();
    } catch (e) {
      console.error('Failed to trigger exact alarm intent', e);
    }
  }

  /**
   * Schedule a native OS-level notification for a specific alarm.
   * This ensures the alarm triggers even if the app is closed or minimized.
   */
  public async scheduleAlarm(alarm: AlarmItem) {
    if (!this.isNative || !alarm.enabled) return;

    // Convert alarm time to a Date object
    const scheduleDate = this.parseAlarmToDate(alarm);
    if (!scheduleDate) return;

    // If the time has already passed today, don't schedule it for today
    // (though in a real app you might schedule for tomorrow)
    if (scheduleDate.getTime() <= Date.now()) {
      // For daily alarms, we could add 24 hours, but for simplicity we'll just skip if past
      // In this app, we assume scheduling for the next occurrence.
      if (alarm.day === 'प्रतिदिन (Every Day)') {
        scheduleDate.setDate(scheduleDate.getDate() + 1);
      } else {
        return; // Skip if specific day passed
      }
    }

    // Use an integer ID for the notification
    const notificationId = this.stringToHash(alarm.id);

    const options: ScheduleOptions = {
      notifications: [
        {
          title: `BGK Yadgiri: ${alarm.task}`,
          body: `समय: ${alarm.time} | अलार्म बज रहा है!`,
          id: notificationId,
          schedule: { at: scheduleDate, allowWhileIdle: true },
          sound: 'beep.wav', // We'll try to provide this natively
          extra: { alarmId: alarm.id },
          channelId: 'alarms',
        },
      ],
    };

    try {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
      await LocalNotifications.schedule(options);
      console.log(`Scheduled notification for alarm ${alarm.id} at ${scheduleDate}`);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  /**
   * Cancel a scheduled notification
   */
  public async cancelAlarm(alarmId: string) {
    if (!this.isNative) return;
    const id = this.stringToHash(alarmId);
    await LocalNotifications.cancel({ notifications: [{ id }] });
  }

  /**
   * Sync all active alarms with native notifications
   */
  public async syncAlarms(alarms: AlarmItem[]) {
    if (!this.isNative) return;
    // Clear all existing and re-schedule
    // This is safer than individual updates for consistency
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }

    for (const alarm of alarms) {
      if (alarm.enabled) {
        await this.scheduleAlarm(alarm);
      }
    }
  }

  /**
   * Helper to parse our custom time string into a Date
   */
  private parseAlarmToDate(alarm: AlarmItem): Date | null {
    const now = new Date();
    const date = new Date();
    
    let hours = parseInt(alarm.hour);
    if (alarm.ampm === 'PM' && hours < 12) hours += 12;
    if (alarm.ampm === 'AM' && hours === 12) hours = 0;

    date.setHours(hours, parseInt(alarm.minute), 0, 0);

    // Handle day logic
    if (alarm.day !== 'प्रतिदिन (Every Day)') {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDayIndex = dayNames.findIndex(d => alarm.day.includes(d));
      
      if (targetDayIndex !== -1) {
        let daysUntil = (targetDayIndex - now.getDay() + 7) % 7;
        // If it's today but the time passed, set for next week
        if (daysUntil === 0 && date.getTime() <= now.getTime()) {
          daysUntil = 7;
        }
        date.setDate(date.getDate() + daysUntil);
      }
    }

    return date;
  }

  private stringToHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

export const notificationService = new NotificationService();
