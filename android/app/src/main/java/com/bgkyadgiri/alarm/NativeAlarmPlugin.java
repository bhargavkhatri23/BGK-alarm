package com.bgkyadgiri.alarm;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.util.Iterator;

@CapacitorPlugin(name = "NativeAlarm")
public class NativeAlarmPlugin extends Plugin {

    private static final String PREF_NAME = "bgk_native_alarms";

    @PluginMethod
    public void canScheduleExact(PluginCall call) {
        Context context = getContext();
        boolean granted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            granted = am != null && am.canScheduleExactAlarms();
        }
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                    Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        String id = call.getString("id");
        Long timeMillis = call.getLong("timeMillis");
        String label = call.getString("label", "BGK Smart Alarm");
        String repeatDays = call.getString("repeatDays", "");

        if (id == null || timeMillis == null) {
            call.reject("id and timeMillis are required");
            return;
        }

        Context context = getContext();
        
        // Save to SharedPreferences for boot persistence
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        try {
            JSONObject json = new JSONObject();
            json.put("id", id);
            json.put("timeMillis", timeMillis);
            json.put("label", label);
            json.put("repeatDays", repeatDays);
            prefs.edit().putString(id, json.toString()).apply();
        } catch (Exception e) {
            e.printStackTrace();
        }

        scheduleExactAlarmInternal(context, id, timeMillis, label, repeatDays);
        call.resolve();
    }

    public static void scheduleExactAlarmInternal(Context context, String id, long timeMillis, String label, String repeatDays) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("id", id);
        intent.putExtra("label", label);
        intent.putExtra("repeatDays", repeatDays);
        intent.putExtra("timeMillis", timeMillis);

        int requestCode = Math.abs(id.hashCode());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        } else {
            flags |= PendingIntent.FLAG_MUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);

        // Show intent for AlarmClockInfo
        Intent showIntent = new Intent(context, AlarmActivity.class);
        showIntent.putExtra("id", id);
        showIntent.putExtra("label", label);
        PendingIntent showPendingIntent = PendingIntent.getActivity(context, requestCode, showIntent, flags);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            AlarmManager.AlarmClockInfo alarmClockInfo = new AlarmManager.AlarmClockInfo(timeMillis, showPendingIntent);
            alarmManager.setAlarmClock(alarmClockInfo, pendingIntent);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeMillis, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, timeMillis, pendingIntent);
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        String id = call.getString("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().remove(id).apply();

        cancelInternal(context, id);
        call.resolve();
    }

    public static void cancelInternal(Context context, String id) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, AlarmReceiver.class);
        int requestCode = Math.abs(id.hashCode());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        } else {
            flags |= PendingIntent.FLAG_MUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);
        alarmManager.cancel(pendingIntent);
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        for (String id : prefs.getAll().keySet()) {
            cancelInternal(context, id);
        }
        prefs.edit().clear().apply();
        call.resolve();
    }
}
