import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { AlarmItem } from '../types/alarm';

interface IAlarmPermissionPlugin {
  requestBatteryOptimization(): Promise<void>;
  requestExactAlarm(): Promise<void>;
  requestOverlayPermission(): Promise<void>;
  setBackgroundProtection(options: { enabled: boolean, nextTask?: string, nextTime?: string }): Promise<void>;
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
      return { 
        batteryOptimizationIgnored: true, 
        canScheduleExactAlarms: true,
        notificationsGranted: true,
        overlayPermissionGranted: true 
      };
    }
  }

  public async requestPermissions(): Promise<boolean> {
    if (!this.isNative) return false;
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (e) {
      return false;
    }
  }

  public async triggerBatteryOptimization() {
    if (!this.isNative) return;
    try { await AlarmPermission.requestBatteryOptimization(); } catch (e) {}
  }

  public async triggerExactAlarm() {
    if (!this.isNative) return;
    try { await AlarmPermission.requestExactAlarm(); } catch (e) {}
  }

  public async triggerOverlayPermission() {
    if (!this.isNative) return;
    try { await AlarmPermission.requestOverlayPermission(); } catch (e) {}
  }

  public async enableBackgroundProtection(enabled: boolean, nextTask?: string, nextTime?: string) {
    if (!this.isNative) return;
    try {
      await AlarmPermission.setBackgroundProtection({ enabled, nextTask, nextTime });
    } catch (e) {
      console.error('Failed to toggle background protection', e);
    }
  }

  public async scheduleAlarm(alarm: AlarmItem) {
    if (!this.isNative || !alarm.enabled) return;
    const scheduleDate = this.parseAlarmToDate(alarm);
    if (!scheduleDate) return;

    if (scheduleDate.getTime() <= Date.now()) {
      if (alarm.day === 'प्रतिदिन (Every Day)') {
        scheduleDate.setDate(scheduleDate.getDate() + 1);
      } else {
        return;
      }
    }

    try {
      await AlarmPermission.scheduleAlarm({
        alarmId: alarm.id,
        task: alarm.task,
        triggerTime: scheduleDate.getTime()
      });
    } catch (e) {}

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
    } catch (error) {}
  }

  public async cancelAlarm(alarmId: string) {
    if (!this.isNative) return;
    try { await AlarmPermission.cancelAlarm({ alarmId }); } catch (e) {}
    const id = this.stringToHash(alarmId);
    await LocalNotifications.cancel({ notifications: [{ id }] });
  }

  public async syncAlarms(alarms: AlarmItem[]) {
    if (!this.isNative) return;
    
    const enabledAlarms = alarms.filter(a => a.enabled);
    
    // Clear all existing and re-schedule
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }

    let soonestAlarm: AlarmItem | null = null;
    let soonestTime = Infinity;

    for (const alarm of enabledAlarms) {
      await this.scheduleAlarm(alarm);
      
      const date = this.parseAlarmToDate(alarm);
      if (date) {
        const time = date.getTime();
        if (time < soonestTime) {
          soonestTime = time;
          soonestAlarm = alarm;
        }
      }
    }

    // Instantly trigger the native background protection service with the next active alarm
    if (soonestAlarm) {
      await this.enableBackgroundProtection(true, soonestAlarm.task, soonestAlarm.time);
    } else if (alarms.length > 0) {
      await this.enableBackgroundProtection(true, alarms[0].task, alarms[0].time);
    } else {
      await this.enableBackgroundProtection(true, "Active Alarm Guard", "No alarms set");
    }
  }

  private parseAlarmToDate(alarm: AlarmItem): Date | null {
    const now = new Date();
    const date = new Date();
    let hours = parseInt(alarm.hour);
    if (alarm.ampm === 'PM' && hours < 12) hours += 12;
    if (alarm.ampm === 'AM' && hours === 12) hours = 0;
    date.setHours(hours, parseInt(alarm.minute), 0, 0);

    if (alarm.day !== 'प्रतिदिन (Every Day)') {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDayIndex = dayNames.findIndex(d => alarm.day.includes(d));
      if (targetDayIndex !== -1) {
        let daysUntil = (targetDayIndex - now.getDay() + 7) % 7;
        if (daysUntil === 0 && date.getTime() <= now.getTime()) daysUntil = 7;
        date.setDate(date.getDate() + daysUntil);
      }
    }
    return date;
  }

  private stringToHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export const notificationService = new NotificationService();
