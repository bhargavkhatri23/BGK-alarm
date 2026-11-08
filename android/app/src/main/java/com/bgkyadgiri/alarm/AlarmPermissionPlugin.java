package com.bgkyadgiri.alarm;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.app.AlarmManager;
import android.app.PendingIntent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AlarmPermission")
public class AlarmPermissionPlugin extends Plugin {

  @PluginMethod
  public void checkStatus(PluginCall call) {
    Context context = getContext();
    JSObject ret = new JSObject();

    // 1. Check Notification Permission
    boolean notificationGranted = true;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        notificationGranted = context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }
    ret.put("notificationsGranted", notificationGranted);

    // 2. Check Display Over Other Apps (Overlay) Permission
    boolean overlayGranted = true;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        overlayGranted = Settings.canDrawOverlays(context);
    }
    ret.put("overlayPermissionGranted", overlayGranted);

    // Both mandatory permissions status
    ret.put("allMandatoryGranted", notificationGranted && overlayGranted);

    call.resolve(ret);
  }

  @PluginMethod
  public void requestOverlayPermission(PluginCall call) {
    Context context = getContext();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (!Settings.canDrawOverlays(context)) {
        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + context.getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
      }
    }
    call.resolve();
  }

  @PluginMethod
  public void scheduleAlarm(PluginCall call) {
    String alarmId = call.getString("alarmId");
    String task = call.getString("task");
    Long triggerTime = call.getLong("triggerTime");

    if (alarmId == null || triggerTime == null) {
      call.reject("alarmId and triggerTime are required");
      return;
    }

    Context context = getContext();
    AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    
    Intent intent = new Intent(context, AlarmReceiver.class);
    intent.putExtra("alarmId", alarmId);
    intent.putExtra("task", task);

    int requestCode = Math.abs(alarmId.hashCode());
    
    int flags = PendingIntent.FLAG_UPDATE_CURRENT;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        flags |= PendingIntent.FLAG_MUTABLE;
    }

    PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        AlarmManager.AlarmClockInfo alarmClockInfo = new AlarmManager.AlarmClockInfo(triggerTime, pendingIntent);
        alarmManager.setAlarmClock(alarmClockInfo, pendingIntent);
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
    } else {
        alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
    }

    call.resolve();
  }

  @PluginMethod
  public void cancelAlarm(PluginCall call) {
    String alarmId = call.getString("alarmId");
    if (alarmId == null) {
      call.reject("alarmId is required");
      return;
    }

    Context context = getContext();
    AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    
    Intent intent = new Intent(context, AlarmReceiver.class);
    int requestCode = Math.abs(alarmId.hashCode());
    
    int flags = PendingIntent.FLAG_UPDATE_CURRENT;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        flags |= PendingIntent.FLAG_MUTABLE;
    }

    PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);

    alarmManager.cancel(pendingIntent);
    call.resolve();
  }

  @PluginMethod
  public void setBackgroundProtection(PluginCall call) {
    boolean enabled = call.getBoolean("enabled", true);
    String nextTask = call.getString("nextTask");
    String nextTime = call.getString("nextTime");
    
    Context context = getContext();
    Intent intent = new Intent(context, AlarmService.class);

    if (enabled) {
      intent.setAction(AlarmService.ACTION_START_GUARDIAN);
      intent.putExtra("nextTask", nextTask);
      intent.putExtra("nextTime", nextTime);
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent);
      } else {
        context.startService(intent);
      }
    } else {
      intent.setAction(AlarmService.ACTION_STOP_GUARDIAN);
      context.startService(intent);
    }
    call.resolve();
  }
}
