// src/nativeAlarm.ts  (put this in your web app's src folder)
// Call these functions from your alarm UI instead of any setTimeout/setInterval ringing logic.

import { registerPlugin, Capacitor } from '@capacitor/core';

export interface NativeAlarmPlugin {
  schedule(opts: { id: number; time: number; label?: string; repeatDays?: number[] }): Promise<void>;
  cancel(opts: { id: number }): Promise<void>;
  cancelAll(): Promise<void>;
  getStatus(): Promise<{ notifications: boolean; fullScreen: boolean }>;
  requestNotifications(): Promise<{ notifications: boolean; fullScreen: boolean }>;
  openFullScreenSettings(): Promise<void>;
  openNotificationSettings(): Promise<void>;
}

const NativeAlarm = registerPlugin<NativeAlarmPlugin>('NativeAlarm');

export const isNative = () => Capacitor.isNativePlatform();

/** Next Date for a given hour/minute (today if still ahead, else tomorrow). */
export function nextTime(hour: number, minute: number): number {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d.getTime();
}

/**
 * days: 1=Sunday ... 7=Saturday. Empty/undefined = one-time alarm.
 * id must be a unique integer per alarm (below 1,000,000,000).
 */
export async function scheduleAlarm(opts: {
  id: number; hour: number; minute: number; label?: string; days?: number[];
}) {
  if (!isNative()) return; // browser preview: nothing to do
  await NativeAlarm.schedule({
    id: opts.id,
    time: nextTime(opts.hour, opts.minute),
    label: opts.label ?? '',
    repeatDays: opts.days ?? [],
  });
}

export async function cancelAlarm(id: number) {
  if (!isNative()) return;
  await NativeAlarm.cancel({ id });
}

/** Call once on app start (and before creating the first alarm). */
export async function ensurePermissions(): Promise<{ ok: boolean; message?: string }> {
  if (!isNative()) return { ok: true };
  let s = await NativeAlarm.getStatus();
  if (!s.notifications) s = await NativeAlarm.requestNotifications();
  if (!s.notifications) {
    await NativeAlarm.openNotificationSettings();
    return { ok: false, message: 'अलार्म बजने के लिए नोटिफिकेशन की अनुमति ज़रूरी है।' };
  }
  if (!s.fullScreen) {
    await NativeAlarm.openFullScreenSettings();
    return { ok: false, message: 'लॉक स्क्रीन पर अलार्म दिखाने के लिए "Full screen notifications" चालू करें।' };
  }
  return { ok: true };
}

export default NativeAlarm;
