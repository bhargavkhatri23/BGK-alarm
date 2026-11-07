# BG Smart Alarm - सारी फाइलें (हर फाइल का पाथ उसके ऊपर लिखा है)

## `AndroidManifest-MERGE-THESE.xml`

```xml
<!--
  android/app/src/main/AndroidManifest.xml
  DO NOT replace your whole manifest. Merge these pieces into it:
  (A) the <uses-permission> lines go directly inside <manifest>, above <application>
  (B) the <receiver>/<service>/<activity> blocks go inside <application>, next to your existing MainActivity
  (C) DELETE any old entries that point to classes you removed (old AlarmService, AlarmPermissionPlugin, guardian, etc.)
-->

<!-- (A) permissions -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />

<!-- (B) components, inside <application> -->
<receiver
    android:name="com.bgkyadgiri.alarm.AlarmReceiver"
    android:exported="false" />

<receiver
    android:name="com.bgkyadgiri.alarm.BootReceiver"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
        <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
        <action android:name="android.intent.action.TIME_SET" />
        <action android:name="android.intent.action.TIMEZONE_CHANGED" />
    </intent-filter>
</receiver>

<service
    android:name="com.bgkyadgiri.alarm.AlarmService"
    android:exported="false"
    android:foregroundServiceType="mediaPlayback" />

<activity
    android:name="com.bgkyadgiri.alarm.AlarmActivity"
    android:exported="false"
    android:launchMode="singleInstance"
    android:excludeFromRecents="true"
    android:showWhenLocked="true"
    android:turnScreenOn="true"
    android:theme="@android:style/Theme.Material.NoActionBar" />

```

## `android/app/src/main/java/com/bgkyadgiri/alarm/AlarmActivity.java`

```java
package com.bgkyadgiri.alarm;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.content.ContextCompat;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Full-screen alarm screen shown over the lock screen. Built in code (no XML needed). */
public class AlarmActivity extends Activity {
    private int alarmId;
    private String label = "";

    private final BroadcastReceiver closeReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            finish();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && km != null) {
            km.requestDismissKeyguard(this, null);
        }

        readIntent(getIntent());
        buildUi();

        ContextCompat.registerReceiver(this, closeReceiver,
                new IntentFilter(AlarmService.ACTION_CLOSE_UI), ContextCompat.RECEIVER_NOT_EXPORTED);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        readIntent(intent);
    }

    private void readIntent(Intent i) {
        alarmId = i.getIntExtra("id", 0);
        String l = i.getStringExtra("label");
        label = l == null ? "" : l;
    }

    private int dp(int v) {
        return (int) (v * getResources().getDisplayMetrics().density);
    }

    private void buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(Color.parseColor("#0F172A"));
        root.setPadding(dp(24), dp(24), dp(24), dp(24));

        TextView icon = new TextView(this);
        icon.setText("⏰");
        icon.setTextSize(64);
        icon.setGravity(Gravity.CENTER);
        root.addView(icon);

        TextView time = new TextView(this);
        time.setText(new SimpleDateFormat("hh:mm a", Locale.getDefault()).format(new Date()));
        time.setTextColor(Color.WHITE);
        time.setTextSize(52);
        time.setTypeface(Typeface.DEFAULT_BOLD);
        time.setGravity(Gravity.CENTER);
        root.addView(time);

        TextView lbl = new TextView(this);
        lbl.setText(label.isEmpty() ? "अलार्म का समय हो गया" : label);
        lbl.setTextColor(Color.parseColor("#CBD5E1"));
        lbl.setTextSize(22);
        lbl.setGravity(Gravity.CENTER);
        lbl.setPadding(0, dp(12), 0, dp(40));
        root.addView(lbl);

        Button snooze = makeButton("स्नूज़ (5 मिनट)", "#F59E0B", Color.BLACK);
        snooze.setOnClickListener((View v) -> {
            send(AlarmService.ACTION_SNOOZE);
            finish();
        });
        root.addView(snooze);

        Button dismiss = makeButton("बंद करें", "#EF4444", Color.WHITE);
        dismiss.setOnClickListener((View v) -> {
            send(AlarmService.ACTION_DISMISS);
            finish();
        });
        root.addView(dismiss);

        setContentView(root);
    }

    private Button makeButton(String text, String bg, int fg) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextSize(20);
        b.setTextColor(fg);
        b.setAllCaps(false);
        b.setBackgroundColor(Color.parseColor(bg));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(72));
        lp.setMargins(0, dp(10), 0, dp(10));
        b.setLayoutParams(lp);
        return b;
    }

    private void send(String action) {
        Intent i = new Intent(this, AlarmService.class);
        i.setAction(action);
        i.putExtra("id", alarmId);
        i.putExtra("label", label);
        startService(i);
    }

    @Override
    protected void onDestroy() {
        try {
            unregisterReceiver(closeReceiver);
        } catch (Exception ignored) {
        }
        super.onDestroy();
    }
}

```

## `android/app/src/main/java/com/bgkyadgiri/alarm/AlarmReceiver.java`

```java
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

```

## `android/app/src/main/java/com/bgkyadgiri/alarm/AlarmService.java`

```java
package com.bgkyadgiri.alarm;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

/** Plays the alarm sound + vibration and shows the full-screen alarm notification. */
public class AlarmService extends Service {
    private static final String TAG = "BGAlarm";

    public static final String ACTION_RING = "com.bgkyadgiri.alarm.RING";
    public static final String ACTION_SNOOZE = "com.bgkyadgiri.alarm.SNOOZE";
    public static final String ACTION_DISMISS = "com.bgkyadgiri.alarm.DISMISS";
    public static final String ACTION_CLOSE_UI = "com.bgkyadgiri.alarm.CLOSE_UI";

    private static final String CHANNEL_ID = "bg_alarm_ring";
    private static final int NOTIF_ID = 7001;
    private static final int SNOOZE_MINUTES = 5;
    private static final int SNOOZE_ID_BASE = 1_000_000_000;
    private static final long AUTO_STOP_MS = 3 * 60 * 1000L;

    private MediaPlayer player;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable autoStop = this::stopRinging;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;

        if (ACTION_SNOOZE.equals(action)) {
            snooze(intent.getIntExtra("id", 0), intent.getStringExtra("label"));
            return START_NOT_STICKY;
        }
        if (ACTION_DISMISS.equals(action)) {
            stopRinging();
            return START_NOT_STICKY;
        }

        int id = intent != null ? intent.getIntExtra("id", 0) : 0;
        String label = intent != null ? intent.getStringExtra("label") : "";
        if (label == null) label = "";

        createChannel();
        Notification n = buildNotification(id, label);
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIF_ID, n);
        }

        acquireWakeLock();
        startSound();
        startVibration();
        handler.removeCallbacks(autoStop);
        handler.postDelayed(autoStop, AUTO_STOP_MS);
        return START_NOT_STICKY;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "अलार्म", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("अलार्म बजने की सूचना");
            ch.setSound(null, null);
            ch.enableVibration(false);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(ch);
        }
    }

    private Notification buildNotification(int id, String label) {
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;

        Intent full = new Intent(this, AlarmActivity.class);
        full.putExtra("id", id);
        full.putExtra("label", label);
        full.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent fullPi = PendingIntent.getActivity(this, 10, full, piFlags);

        Intent sn = new Intent(this, AlarmService.class);
        sn.setAction(ACTION_SNOOZE);
        sn.putExtra("id", id);
        sn.putExtra("label", label);
        PendingIntent snPi = PendingIntent.getService(this, 11, sn, piFlags);

        Intent dm = new Intent(this, AlarmService.class);
        dm.setAction(ACTION_DISMISS);
        PendingIntent dmPi = PendingIntent.getService(this, 12, dm, piFlags);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("⏰ अलार्म")
                .setContentText(label.isEmpty() ? "अलार्म का समय हो गया" : label)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setFullScreenIntent(fullPi, true)
                .setContentIntent(fullPi)
                .addAction(0, "स्नूज़ (" + SNOOZE_MINUTES + " मिनट)", snPi)
                .addAction(0, "बंद करें", dmPi)
                .build();
    }

    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null && (wakeLock == null || !wakeLock.isHeld())) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BGAlarm:ring");
                wakeLock.acquire(AUTO_STOP_MS + 10_000L);
            }
        } catch (Exception e) {
            Log.e(TAG, "wakelock", e);
        }
    }

    private void startSound() {
        try {
            AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            try {
                int max = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                int cur = am.getStreamVolume(AudioManager.STREAM_ALARM);
                int min = Math.max(1, (int) (max * 0.7f));
                if (cur < min) am.setStreamVolume(AudioManager.STREAM_ALARM, min, 0);
            } catch (Exception ignored) {
            }

            Uri uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);

            releasePlayer();
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            player.setDataSource(this, uri);
            player.setLooping(true);
            player.prepare();
            player.start();
        } catch (Exception e) {
            Log.e(TAG, "sound failed", e);
        }
    }

    private void startVibration() {
        try {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator == null) return;
            long[] pattern = {0, 800, 600};
            if (Build.VERSION.SDK_INT >= 28) {
                AudioAttributes attrs = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM).build();
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0), attrs);
            } else if (Build.VERSION.SDK_INT >= 26) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
            } else {
                vibrator.vibrate(pattern, 0);
            }
        } catch (Exception e) {
            Log.e(TAG, "vibration failed", e);
        }
    }

    private void snooze(int id, String label) {
        try {
            int snoozeId = id >= SNOOZE_ID_BASE ? id : SNOOZE_ID_BASE + id;
            JSONObject a = new JSONObject();
            a.put("id", snoozeId);
            a.put("time", System.currentTimeMillis() + SNOOZE_MINUTES * 60_000L);
            a.put("label", label == null ? "" : label);
            a.put("repeatDays", new JSONArray());
            AlarmStore.put(this, a);
            AlarmStore.schedule(this, a);
        } catch (Exception e) {
            Log.e(TAG, "snooze failed", e);
        }
        stopRinging();
    }

    private void releasePlayer() {
        if (player != null) {
            try {
                if (player.isPlaying()) player.stop();
            } catch (Exception ignored) {
            }
            player.release();
            player = null;
        }
    }

    private void stopRinging() {
        handler.removeCallbacks(autoStop);
        releasePlayer();
        try {
            if (vibrator != null) vibrator.cancel();
        } catch (Exception ignored) {
        }
        try {
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        } catch (Exception ignored) {
        }
        sendBroadcast(new Intent(ACTION_CLOSE_UI).setPackage(getPackageName()));
        if (Build.VERSION.SDK_INT >= 24) {
            stopForeground(Service.STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        stopSelf();
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(autoStop);
        releasePlayer();
        try {
            if (vibrator != null) vibrator.cancel();
        } catch (Exception ignored) {
        }
        try {
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        } catch (Exception ignored) {
        }
        super.onDestroy();
    }
}

```

## `android/app/src/main/java/com/bgkyadgiri/alarm/AlarmStore.java`

```java
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

```

## `android/app/src/main/java/com/bgkyadgiri/alarm/BootReceiver.java`

```java
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

```

## `android/app/src/main/java/com/bgkyadgiri/alarm/MainActivity.java`

```java
package com.bgkyadgiri.alarm;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Must be registered BEFORE super.onCreate
        registerPlugin(NativeAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

```

## `android/app/src/main/java/com/bgkyadgiri/alarm/NativeAlarmPlugin.java`

```java
package com.bgkyadgiri.alarm;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(
        name = "NativeAlarm",
        permissions = {
                @Permission(strings = {Manifest.permission.POST_NOTIFICATIONS}, alias = "notifications")
        }
)
public class NativeAlarmPlugin extends Plugin {

    private JSObject status() {
        JSObject r = new JSObject();
        r.put("notifications", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
        boolean fullScreen = true;
        if (Build.VERSION.SDK_INT >= 34) {
            android.app.NotificationManager nm = (android.app.NotificationManager)
                    getContext().getSystemService(android.content.Context.NOTIFICATION_SERVICE);
            fullScreen = nm.canUseFullScreenIntent();
        }
        r.put("fullScreen", fullScreen);
        return r;
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        Integer id = call.getInt("id");
        Long time = call.getLong("time");
        if (id == null || time == null) {
            call.reject("id and time are required");
            return;
        }
        try {
            JSArray daysIn = call.getArray("repeatDays", new JSArray());
            JSONArray days = new JSONArray();
            for (int i = 0; i < daysIn.length(); i++) days.put(daysIn.getInt(i));

            JSONObject a = new JSONObject();
            a.put("id", id);
            a.put("time", time);
            a.put("label", call.getString("label", ""));
            a.put("repeatDays", days);

            AlarmStore.put(getContext(), a);
            AlarmStore.schedule(getContext(), a);
            call.resolve();
        } catch (Exception e) {
            call.reject("schedule failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        Integer id = call.getInt("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }
        AlarmStore.cancel(getContext(), id);
        call.resolve();
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        AlarmStore.cancelAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void requestNotifications(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33
                && !NotificationManagerCompat.from(getContext()).areNotificationsEnabled()) {
            requestPermissionForAlias("notifications", call, "notifCallback");
        } else {
            call.resolve(status());
        }
    }

    @PermissionCallback
    private void notifCallback(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void openFullScreenSettings(PluginCall call) {
        try {
            Intent i;
            if (Build.VERSION.SDK_INT >= 34) {
                i = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                        Uri.parse("package:" + getContext().getPackageName()));
            } else {
                i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                        .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
            }
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("cannot open settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName())
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("cannot open settings: " + e.getMessage());
        }
    }
}

```

## `src/nativeAlarm.ts`

```ts
// src/nativeAlarm.ts  (put this in your web app's src folder)
// Call these functions from your alarm UI instead of any setTimeout/setInterval ringing logic.

import { registerPlugin, Capacitor } from '@capacitor/core';

export interface NativeAlarmPlugin {
  schedule(opts: { id: number; time: number; label?: string; repeatDays?: number[] }): Promise<void>;
  cancel(opts: { id: number }): Promise<void>;
  cancelAll(): Promise<void>;
  getStatus(): Promise<{ notifications: boolean; fullScreen: boolean }>;
  requestNotifications(): Promise<{ notifications: boolean; fullScreen: boolean }>;
  openFullScreenSettings(): Promise<void>;
  openNotificationSettings(): Promise<void>;
}

const NativeAlarm = registerPlugin<NativeAlarmPlugin>('NativeAlarm');

export const isNative = () => Capacitor.isNativePlatform();

/** Next Date for a given hour/minute (today if still ahead, else tomorrow). */
export function nextTime(hour: number, minute: number): number {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d.getTime();
}

/**
 * days: 1=Sunday ... 7=Saturday. Empty/undefined = one-time alarm.
 * id must be a unique integer per alarm (below 1,000,000,000).
 */
export async function scheduleAlarm(opts: {
  id: number; hour: number; minute: number; label?: string; days?: number[];
}) {
  if (!isNative()) return; // browser preview: nothing to do
  await NativeAlarm.schedule({
    id: opts.id,
    time: nextTime(opts.hour, opts.minute),
    label: opts.label ?? '',
    repeatDays: opts.days ?? [],
  });
}

export async function cancelAlarm(id: number) {
  if (!isNative()) return;
  await NativeAlarm.cancel({ id });
}

/** Call once on app start (and before creating the first alarm). */
export async function ensurePermissions(): Promise<{ ok: boolean; message?: string }> {
  if (!isNative()) return { ok: true };
  let s = await NativeAlarm.getStatus();
  if (!s.notifications) s = await NativeAlarm.requestNotifications();
  if (!s.notifications) {
    await NativeAlarm.openNotificationSettings();
    return { ok: false, message: 'अलार्म बजने के लिए नोटिफिकेशन की अनुमति ज़रूरी है।' };
  }
  if (!s.fullScreen) {
    await NativeAlarm.openFullScreenSettings();
    return { ok: false, message: 'लॉक स्क्रीन पर अलार्म दिखाने के लिए "Full screen notifications" चालू करें।' };
  }
  return { ok: true };
}

export default NativeAlarm;

```

