package com.bgkyadgiri.alarm;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.WindowManager;
import android.app.AlarmManager;
import android.app.PendingIntent;
import java.util.Calendar;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Ensure the app can show over the lock screen and turn the screen on for alarms
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true);
      setTurnScreenOn(true);
    } else {
      getWindow().addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
      );
    }
  }
}

/**
 * Custom Capacitor Plugin to handle Native Android Permissions and Alarms
 */
@CapacitorPlugin(name = "AlarmPermission")
class AlarmPermissionPlugin extends Plugin {

  @PluginMethod
  public void checkStatus(PluginCall call) {
    Context context = getContext();
    JSObject ret = new JSObject();
    
    // Check Battery Optimization
    boolean batteryIgnored = true;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
      batteryIgnored = pm.isIgnoringBatteryOptimizations(context.getPackageName());
    }
    ret.put("batteryOptimizationIgnored", batteryIgnored);

    // Check Exact Alarm
    boolean canExact = true;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      android.app.AlarmManager alarmManager = (android.app.AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
      canExact = alarmManager.canScheduleExactAlarms();
    }
    ret.put("canScheduleExactAlarms", canExact);

    // Check Notification Permission
    boolean notificationGranted = true;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        notificationGranted = context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }
    ret.put("notificationsGranted", notificationGranted);

    call.resolve(ret);
  }

  @PluginMethod
  public void requestBatteryOptimization(PluginCall call) {
    Context context = getContext();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      String packageName = context.getPackageName();
      PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
      if (!pm.isIgnoringBatteryOptimizations(packageName)) {
        Intent intent = new Intent();
        intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
        intent.setData(Uri.parse("package:" + packageName));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
        call.resolve();
      } else {
        call.resolve();
      }
    } else {
      call.resolve();
    }
  }

  @PluginMethod
  public void requestExactAlarm(PluginCall call) {
    Context context = getContext();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      android.app.AlarmManager alarmManager = (android.app.AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
      if (!alarmManager.canScheduleExactAlarms()) {
        Intent intent = new Intent();
        intent.setAction(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
        intent.setData(Uri.parse("package:" + context.getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
        call.resolve();
      } else {
        call.resolve();
      }
    } else {
      call.resolve();
    }
  }

  @PluginMethod
  public void scheduleAlarm(PluginCall call) {
    String alarmId = call.getString("alarmId");
    String task = call.getString("task");
    Long triggerTime = call.getLong("triggerTime"); // Expects timestamp in milliseconds

    if (alarmId == null || triggerTime == null) {
      call.reject("alarmId and triggerTime are required");
      return;
    }

    Context context = getContext();
    AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    
    Intent intent = new Intent(context, AlarmReceiver.class);
    intent.putExtra("alarmId", alarmId);
    intent.putExtra("task", task);

    // Use a unique request code based on the alarmId string hash
    int requestCode = Math.abs(alarmId.hashCode());
    PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0));

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
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
    PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0));

    alarmManager.cancel(pendingIntent);
    call.resolve();
  }
}
