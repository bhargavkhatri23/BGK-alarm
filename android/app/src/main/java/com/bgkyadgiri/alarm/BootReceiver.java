package com.bgkyadgiri.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import org.json.JSONObject;

public class BootReceiver extends BroadcastReceiver {
    private static final String PREF_NAME = "bgk_native_alarms";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        if (action != null && (
                action.equals(Intent.ACTION_BOOT_COMPLETED) ||
                action.equals("android.intent.action.QUICKBOOT_POWERON") ||
                action.equals(Intent.ACTION_MY_PACKAGE_REPLACED) ||
                action.equals(Intent.ACTION_TIME_CHANGED) ||
                action.equals(Intent.ACTION_TIMEZONE_CHANGED) ||
                action.equals("android.intent.action.LOCKED_BOOT_COMPLETED"))) {

            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            long now = System.currentTimeMillis();

            for (String id : prefs.getAll().keySet()) {
                String jsonStr = prefs.getString(id, null);
                if (jsonStr != null) {
                    try {
                        JSONObject json = new JSONObject(jsonStr);
                        long timeMillis = json.getLong("timeMillis");
                        String label = json.getString("label");
                        String repeatDays = json.optString("repeatDays", "");

                        // Only re-schedule future alarms
                        if (timeMillis > now) {
                            NativeAlarmPlugin.scheduleExactAlarmInternal(context, id, timeMillis, label, repeatDays);
                        } else if (!repeatDays.isEmpty() && !repeatDays.equals("None")) {
                            // If it's a repeating alarm that passed while phone was off, push to next day
                            long nextTime = timeMillis + 24L * 60L * 60L * 1000L;
                            while (nextTime <= now) {
                                nextTime += 24L * 60L * 60L * 1000L;
                            }
                            NativeAlarmPlugin.scheduleExactAlarmInternal(context, id, nextTime, label, repeatDays);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    }
}
