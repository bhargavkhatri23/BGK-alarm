import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { AlarmItem } from '../types/alarm';

interface IAlarmPermissionPlugin {
  requestBatteryOptimization(): Promise<void>;
  requestExactAlarm(): Promise<void>;
  requestOverlayPermission(): Promise<void>;
  setBackgroundProtection(options: { enabled: boolean }): Promise<void>;
  scheduleAlarm(options: { alarmId: string, task: string, triggerTime: number }): Promise<void>;
  cancelAlarm(options: { alarmId: string }): Promise<void>;
  checkStatus(): Promise<{ 
    batteryOptimizationIgnored: boolean, 
    canScheduleExactAlarms: boolean,
    notificationsGranted: boolean,
    overlayPermissionGranted: boolean 
  }>;
}

const AlarmPermission = registerPlugin<IAlarmPermissionPlugin>('AlarmPermission');

class NotificationService {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Diagnoses the system health for background alarms.
   */
  public async checkSystemStatus() {
    if (!this.isNative) {
      return { 
        batteryOptimizationIgnored: true, 
        canScheduleExactAlarms: true,
        notificationsGranted: true,
        overlayPermissionGranted: true 
      };
    }
    try {
      return await AlarmPermission.checkStatus();
    } catch (e) {
      console.error('Failed to check native alarm status', e);
      return { 
        batteryOptimizationIgnored: true, 
        canScheduleExactAlarms: true,
        notificationsGranted: true,
        overlayPermissionGranted: true 
      };
    }
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
   * Directly trigger the native Android Overlay Permission (Display over other apps) intent
   */
  public async triggerOverlayPermission() {
    if (!this.isNative) return;
    try {
      await AlarmPermission.requestOverlayPermission();
    } catch (e) {
      console.error('Failed to trigger overlay permission intent', e);
    }
  }

  /**
   * Toggle the persistent background protection service
   */
  public async enableBackgroundProtection(enabled: boolean) {
    if (!this.isNative) return;
    try {
      await AlarmPermission.setBackgroundProtection({ enabled });
    } catch (e) {
      console.error('Failed to toggle background protection', e);
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
    if (scheduleDate.getTime() <= Date.now()) {
      if (alarm.day === 'प्रतिदिन (Every Day)') {
        scheduleDate.setDate(scheduleDate.getDate() + 1);
      } else {
        return; // Skip if specific day passed
      }
    }

    // 1. Schedule Native AlarmManager trigger (Wakes app/plays sound even when closed)
    try {
      await AlarmPermission.scheduleAlarm({
        alarmId: alarm.id,
        task: alarm.task,
        triggerTime: scheduleDate.getTime()
      });
    } catch (e) {
      console.error('Failed to schedule native alarm trigger', e);
    }

    // 2. Also schedule Local Notification as secondary UI alert
    const notificationId = this.stringToHash(alarm.id);
    const options: ScheduleOptions = {
      notifications: [
        {
          title: `BGK SMART ALARM: ${alarm.task}`,
          body: `समय: ${alarm.time} | अलार्म बज रहा है!`,
          id: notificationId,
          schedule: { at: scheduleDate, allowWhileIdle: true },
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
    
    // 1. Cancel native AlarmManager trigger
    try {
      await AlarmPermission.cancelAlarm({ alarmId });
    } catch (e) {
      console.error('Failed to cancel native alarm trigger', e);
    }

    // 2. Cancel Local Notification
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
