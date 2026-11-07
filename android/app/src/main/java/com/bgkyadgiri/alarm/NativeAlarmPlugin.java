package com.bgkyadgiri.alarm;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(
        name = "NativeAlarm",
        permissions = {
                @Permission(strings = {Manifest.permission.POST_NOTIFICATIONS}, alias = "notifications")
        }
)
public class NativeAlarmPlugin extends Plugin {

    private JSObject status() {
        JSObject r = new JSObject();
        r.put("notifications", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
        boolean fullScreen = true;
        if (Build.VERSION.SDK_INT >= 34) {
            android.app.NotificationManager nm = (android.app.NotificationManager)
                    getContext().getSystemService(android.content.Context.NOTIFICATION_SERVICE);
            fullScreen = nm.canUseFullScreenIntent();
        }
        r.put("fullScreen", fullScreen);
        return r;
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        Integer id = call.getInt("id");
        Long time = call.getLong("time");
        if (id == null || time == null) {
            call.reject("id and time are required");
            return;
        }
        try {
            JSArray daysIn = call.getArray("repeatDays", new JSArray());
            JSONArray days = new JSONArray();
            for (int i = 0; i < daysIn.length(); i++) days.put(daysIn.getInt(i));

            JSONObject a = new JSONObject();
            a.put("id", id);
            a.put("time", time);
            a.put("label", call.getString("label", ""));
            a.put("repeatDays", days);

            AlarmStore.put(getContext(), a);
            AlarmStore.schedule(getContext(), a);
            call.resolve();
        } catch (Exception e) {
            call.reject("schedule failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        Integer id = call.getInt("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }
        AlarmStore.cancel(getContext(), id);
        call.resolve();
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        AlarmStore.cancelAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void requestNotifications(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33
                && !NotificationManagerCompat.from(getContext()).areNotificationsEnabled()) {
            requestPermissionForAlias("notifications", call, "notifCallback");
        } else {
            call.resolve(status());
        }
    }

    @PermissionCallback
    private void notifCallback(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void openFullScreenSettings(PluginCall call) {
        try {
            Intent i;
            if (Build.VERSION.SDK_INT >= 34) {
                i = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                        Uri.parse("package:" + getContext().getPackageName()));
            } else {
                i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                        .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
            }
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("cannot open settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName())
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("cannot open settings: " + e.getMessage());
        }
    }
}
