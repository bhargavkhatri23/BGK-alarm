package com.bgkyadgiri.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        // 1. Acquire temporary WakeLock
        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, 
                "BGK:AlarmReceiverWakeLock"
            );
            wakeLock.acquire(10 * 1000L);
        }

        // 2. Safely extract intent extras
        String task = intent.getStringExtra("task");
        String alarmId = intent.getStringExtra("alarmId");

        // 3. Launch/Upgrade AlarmService to Ringing mode
        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.setAction(AlarmService.ACTION_START_ALARM);
        serviceIntent.putExtra("task", task != null ? task : "Scheduled Reminder");
        serviceIntent.putExtra("alarmId", alarmId);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
