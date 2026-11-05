package com.bgkyadgiri.alarm;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

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
 * Custom Capacitor Plugin to handle Native Android Permissions for Alarms
 */
@CapacitorPlugin(name = "AlarmPermission")
class AlarmPermissionPlugin extends Plugin {

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
}
