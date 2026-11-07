package com.bgkyadgiri.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = null;
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "BGK:AlarmReceiverWakeLock");
            wakeLock.acquire(15 * 1000L); // 15 seconds
        }

        String id = intent.getStringExtra("id");
        String label = intent.getStringExtra("label");
        String repeatDays = intent.getStringExtra("repeatDays");
        long timeMillis = intent.getLongExtra("timeMillis", System.currentTimeMillis());

        // Start Foreground Service to play sound and show notification
        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.putExtra("id", id);
        serviceIntent.putExtra("label", label);
        serviceIntent.putExtra("repeatDays", repeatDays);
        serviceIntent.putExtra("timeMillis", timeMillis);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }

        // Also launch AlarmActivity directly for lockscreen appearance
        Intent activityIntent = new Intent(context, AlarmActivity.class);
        activityIntent.putExtra("id", id);
        activityIntent.putExtra("label", label);
        activityIntent.putExtra("repeatDays", repeatDays);
        activityIntent.putExtra("timeMillis", timeMillis);
        activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        context.startActivity(activityIntent);
    }
}
