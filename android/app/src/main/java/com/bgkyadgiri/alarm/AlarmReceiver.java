package com.bgkyadgiri.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import androidx.core.content.ContextCompat;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        // 1. Acquire a temporary WakeLock to ensure the device stays awake 
        // while the service starts and takes over.
        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, 
                "BGK:AlarmReceiverWakeLock"
            );
            // Acquire for 10 seconds, enough to let AlarmService start and acquire its own lock
            wakeLock.acquire(10 * 1000L);
        }

        // 2. Extract extras safely
        String task = intent.getStringExtra("task");
        String alarmId = intent.getStringExtra("alarmId");

        // 3. Prepare service intent
        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.putExtra("task", task != null ? task : "Scheduled Reminder");
        serviceIntent.putExtra("alarmId", alarmId);

        // 4. Start foreground service
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
