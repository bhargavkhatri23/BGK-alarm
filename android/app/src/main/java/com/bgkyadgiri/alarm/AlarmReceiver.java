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
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BGK:AlarmReceiverWakeLock");
            wakeLock.acquire(60 * 1000L); // 1 min lock
        }

        String alarmId = intent.getStringExtra("alarmId");
        String task = intent.getStringExtra("task");
        String callContactName = intent.getStringExtra("callContactName");
        String callContactNumber = intent.getStringExtra("callContactNumber");
        String whatsappContactName = intent.getStringExtra("whatsappContactName");
        String whatsappContactNumber = intent.getStringExtra("whatsappContactNumber");
        String whatsappMessage = intent.getStringExtra("whatsappMessage");

        // Start Foreground AlarmService
        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.putExtra("id", alarmId);
        serviceIntent.putExtra("label", task);
        serviceIntent.putExtra("callContactName", callContactName);
        serviceIntent.putExtra("callContactNumber", callContactNumber);
        serviceIntent.putExtra("whatsappContactName", whatsappContactName);
        serviceIntent.putExtra("whatsappContactNumber", whatsappContactNumber);
        serviceIntent.putExtra("whatsappMessage", whatsappMessage);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }

        // Open full-screen lockscreen activity
        Intent activityIntent = new Intent(context, AlarmActivity.class);
        activityIntent.putExtra("id", alarmId);
        activityIntent.putExtra("label", task);
        activityIntent.putExtra("callContactName", callContactName);
        activityIntent.putExtra("callContactNumber", callContactNumber);
        activityIntent.putExtra("whatsappContactName", whatsappContactName);
        activityIntent.putExtra("whatsappContactNumber", whatsappContactNumber);
        activityIntent.putExtra("whatsappMessage", whatsappMessage);
        activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        context.startActivity(activityIntent);

        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
        }
    }
}
