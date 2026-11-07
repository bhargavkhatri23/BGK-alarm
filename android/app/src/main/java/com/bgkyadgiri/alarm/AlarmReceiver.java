package com.bgkyadgiri.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONObject;

/** Fired by the Android system at alarm time, even if the app is closed. */
public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "BGAlarm";

    @Override
    public void onReceive(Context context, Intent intent) {
        int id = intent.getIntExtra("id", 0);
        String label = intent.getStringExtra("label");
        if (label == null) label = "";
        Log.d(TAG, "Alarm fired id=" + id);

        // Repeating alarm: schedule the next occurrence. One-time alarm: remove it.
        try {
            JSONObject a = AlarmStore.get(context, id);
            if (a != null) {
                JSONArray days = a.optJSONArray("repeatDays");
                if (days != null && days.length() > 0) {
                    a.put("time", AlarmStore.nextOccurrence(a.optLong("time"), days));
                    AlarmStore.put(context, a);
                    AlarmStore.schedule(context, a);
                } else {
                    AlarmStore.remove(context, id);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "reschedule failed", e);
        }

        Intent svc = new Intent(context, AlarmService.class);
        svc.setAction(AlarmService.ACTION_RING);
        svc.putExtra("id", id);
        svc.putExtra("label", label);
        ContextCompat.startForegroundService(context, svc);
    }
}
