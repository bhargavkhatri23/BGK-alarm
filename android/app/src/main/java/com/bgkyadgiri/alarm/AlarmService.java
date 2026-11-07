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
        dm.putExtra("id", id);
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
