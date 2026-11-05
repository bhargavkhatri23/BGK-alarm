package com.bgkyadgiri.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String task = intent.getStringExtra("task");
        String alarmId = intent.getStringExtra("alarmId");

        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.putExtra("task", task);
        serviceIntent.putExtra("alarmId", alarmId);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
