package com.bgkyadgiri.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/** Re-registers all saved alarms after reboot, app update, or time/timezone change. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d("BGAlarm", "BootReceiver: " + intent.getAction());
        AlarmStore.rescheduleAll(context);
    }
}
