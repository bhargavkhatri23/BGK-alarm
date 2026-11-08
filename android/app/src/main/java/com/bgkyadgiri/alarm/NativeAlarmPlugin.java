package com.bgkyadgiri.alarm;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "NativeAlarm")
public class NativeAlarmPlugin extends Plugin {
    private static final String PREF_NAME = "bgk_alarms_pref";
    private static final String KEY_STORED_ALARMS = "stored_alarms";

    @PluginMethod
    public void canScheduleExact(PluginCall call) {
        Context context = getContext();
        boolean canExact = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am != null) {
                canExact = am.canScheduleExactAlarms();
            }
        }
        JSObject ret = new JSObject();
        ret.put("granted", canExact);
        call.resolve(ret);
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                    android.net.Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        String id = call.getString("id");
        Long timeMillis = call.getLong("timeMillis");
        String label = call.getString("label", "Alarm");
        String repeatDays = call.getString("repeatDays", "");

        if (id == null || timeMillis == null) {
            call.reject("id and timeMillis are required");
            return;
        }

        scheduleExactAlarmInternal(getContext(), id, timeMillis, label, repeatDays);
        saveAlarmToPrefs(getContext(), id, timeMillis, label, repeatDays);
        call.resolve();
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        String id = call.getString("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }
        cancelAlarmInternal(getContext(), id);
        removeAlarmFromPrefs(getContext(), id);
        call.resolve();
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        try {
            String jsonStr = prefs.getString(KEY_STORED_ALARMS, "[]");
            JSONArray arr = new JSONArray(jsonStr);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                cancelAlarmInternal(context, obj.getString("id"));
            }
        } catch (Exception ignored) {}
        prefs.edit().remove(KEY_STORED_ALARMS).apply();
        call.resolve();
    }

    public static void scheduleExactAlarmInternal(Context context, String id, long triggerTime, String label, String repeatDays) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("alarmId", id);
        intent.putExtra("task", label);
        intent.putExtra("repeatDays", repeatDays);
        intent.putExtra("timeMillis", triggerTime);

        int requestCode = Math.abs(id.hashCode());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);

        Intent showIntent = new Intent(context, AlarmActivity.class);
        showIntent.putExtra("id", id);
        showIntent.putExtra("label", label);
        PendingIntent showPendingIntent = PendingIntent.getActivity(context, requestCode, showIntent, flags);

        AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(triggerTime, showPendingIntent);
        am.setAlarmClock(clockInfo, pendingIntent);
    }

    public static void cancelAlarmInternal(Context context, String id) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent intent = new Intent(context, AlarmReceiver.class);
        int requestCode = Math.abs(id.hashCode());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);
        am.cancel(pendingIntent);
    }

    private static void saveAlarmToPrefs(Context context, String id, long timeMillis, String label, String repeatDays) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        try {
            JSONArray arr = new JSONArray(prefs.getString(KEY_STORED_ALARMS, "[]"));
            JSONArray newArr = new JSONArray();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                if (!obj.getString("id").equals(id)) {
                    newArr.put(obj);
                }
            }
            JSONObject newObj = new JSONObject();
            newObj.put("id", id);
            newObj.put("timeMillis", timeMillis);
            newObj.put("label", label);
            newObj.put("repeatDays", repeatDays);
            newArr.put(newObj);
            prefs.edit().putString(KEY_STORED_ALARMS, newArr.toString()).apply();
        } catch (Exception ignored) {}
    }

    private static void removeAlarmFromPrefs(Context context, String id) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        try {
            JSONArray arr = new JSONArray(prefs.getString(KEY_STORED_ALARMS, "[]"));
            JSONArray newArr = new JSONArray();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                if (!obj.getString("id").equals(id)) {
                    newArr.put(obj);
                }
            }
            prefs.edit().putString(KEY_STORED_ALARMS, newArr.toString()).apply();
        } catch (Exception ignored) {}
    }

    public static void rescheduleAllStoredAlarms(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        try {
            JSONArray arr = new JSONArray(prefs.getString(KEY_STORED_ALARMS, "[]"));
            long now = System.currentTimeMillis();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                long time = obj.getLong("timeMillis");
                String id = obj.getString("id");
                String label = obj.getString("label");
                String repeatDays = obj.getString("repeatDays");
                if (time > now) {
                    scheduleExactAlarmInternal(context, id, time, label, repeatDays);
                }
            }
        } catch (Exception ignored) {}
    }
}
