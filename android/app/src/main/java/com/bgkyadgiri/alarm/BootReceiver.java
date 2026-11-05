package com.bgkyadgiri.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            // Note: In a fully native app, we'd query the DB here.
            // In a hybrid app, we might just start the app in background or wait for user.
            // For now, we'll just log it. Reliable rescheduling usually requires 
            // a persistent local DB (like Room) that syncs with Firestore.
        }
    }
}
