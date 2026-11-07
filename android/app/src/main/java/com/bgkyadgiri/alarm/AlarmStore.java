package com.bgkyadgiri.alarm;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * Alarms are saved natively (SharedPreferences) and registered with the Android
 * system through AlarmManager.setAlarmClock(). This keeps working after the app
 * is swiped away, in Doze mode, and (via BootReceiver) after a restart.
 */
public class AlarmStore {
    private static final String PREFS = "bg_alarm_store";
    private static final String KEY = "alarms";
    public static final String ACTION_FIRE = "com.bgkyadgiri.alarm.FIRE";

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static synchronized JSONArray all(Context c) {
        try {
            return new JSONArray(prefs(c).getString(KEY, "[]"));
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    private static void saveAll(Context c, JSONArray arr) {
        prefs(c).edit().putString(KEY, arr.toString()).commit();
    }

    public static synchronized void put(Context c, JSONObject alarm) {
        int id = alarm.optInt("id");
        JSONArray old = all(c);
        JSONArray out = new JSONArray();
        for (int i = 0; i < old.length(); i++) {
            JSONObject o = old.optJSONObject(i);
            if (o != null && o.optInt("id") != id) out.put(o);
        }
        out.put(alarm);
        saveAll(c, out);
    }

    public static synchronized JSONObject get(Context c, int id) {
        JSONArray arr = all(c);
        for (int i = 0; i < arr.length(); i++) {
            JSONObject o = arr.optJSONObject(i);
            if (o != null && o.optInt("id") == id) return o;
        }
        return null;
    }

    public static synchronized void remove(Context c, int id) {
        JSONArray old = all(c);
        JSONArray out = new JSONArray();
        for (int i = 0; i < old.length(); i++) {
            JSONObject o = old.optJSONObject(i);
            if (o != null && o.optInt("id") != id) out.put(o);
        }
        saveAll(c, out);
    }

    private static PendingIntent firePendingIntent(Context c, int id, String label) {
        Intent i = new Intent(c, AlarmReceiver.class);
        i.setAction(ACTION_FIRE);
        i.putExtra("id", id);
        i.putExtra("label", label == null ? "" : label);
        return PendingIntent.getBroadcast(c, id, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Registers the alarm with the Android system clock. */
    public static void schedule(Context c, JSONObject alarm) {
        int id = alarm.optInt("id");
        long time = alarm.optLong("time");
        String label = alarm.optString("label", "");
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent open = new Intent(c, MainActivity.class);
        PendingIntent show = PendingIntent.getActivity(c, id, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        am.setAlarmClock(new AlarmManager.AlarmClockInfo(time, show), firePendingIntent(c, id, label));
    }

    public static void cancel(Context c, int id) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) {
            PendingIntent pi = firePendingIntent(c, id, "");
            am.cancel(pi);
            pi.cancel();
        }
        remove(c, id);
    }

    public static void cancelAll(Context c) {
        JSONArray arr = all(c);
        for (int i = 0; i < arr.length(); i++) {
            JSONObject o = arr.optJSONObject(i);
            if (o != null) cancel(c, o.optInt("id"));
        }
    }

    private static boolean containsDay(JSONArray days, int day) {
        for (int i = 0; i < days.length(); i++) {
            if (days.optInt(i) == day) return true;
        }
        return false;
    }

    /** Next time (after now) at the same time-of-day, on one of the given days (Calendar.SUNDAY=1..SATURDAY=7). */
    public static long nextOccurrence(long base, JSONArray days) {
        Calendar t = Calendar.getInstance();
        t.setTimeInMillis(base);
        int h = t.get(Calendar.HOUR_OF_DAY);
        int m = t.get(Calendar.MINUTE);

        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, h);
        c.set(Calendar.MINUTE, m);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);

        long now = System.currentTimeMillis();
        for (int d = 0; d < 15; d++) {
            if (c.getTimeInMillis() > now && containsDay(days, c.get(Calendar.DAY_OF_WEEK))) {
                return c.getTimeInMillis();
            }
            c.add(Calendar.DAY_OF_MONTH, 1);
        }
        return base;
    }

    /** Called after reboot / time change / app update. */
    public static void rescheduleAll(Context c) {
        JSONArray arr = all(c);
        long now = System.currentTimeMillis();
        for (int i = 0; i < arr.length(); i++) {
            JSONObject a = arr.optJSONObject(i);
            if (a == null) continue;
            try {
                JSONArray days = a.optJSONArray("repeatDays");
                boolean repeats = days != null && days.length() > 0;
                long time = a.optLong("time");
                if (time <= now) {
                    if (repeats) {
                        a.put("time", nextOccurrence(time, days));
                        put(c, a);
                    } else if (time < now - 60_000L) {
                        remove(c, a.optInt("id"));
                        continue;
                    }
                }
                schedule(c, a);
            } catch (Exception ignored) {
            }
        }
    }
}
