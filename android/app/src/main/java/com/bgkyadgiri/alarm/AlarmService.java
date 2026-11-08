package com.bgkyadgiri.alarm;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;

public class AlarmService extends Service {
    private AudioTrack audioTrack;
    private boolean isPlaying = false;
    private PowerManager.WakeLock wakeLock;
    private Vibrator vibrator;
    
    private static final String CHANNEL_ID = "bgk_native_alarm_channel";
    private static final String GUARDIAN_CHANNEL_ID = "bgk_guardian_channel";
    private static final int NOTIFICATION_ID = 3001;
    private static final int GUARDIAN_NOTIFICATION_ID = 3002;

    public static final String ACTION_STOP = "ACTION_STOP";
    public static final String ACTION_SNOOZE = "ACTION_SNOOZE";
    public static final String ACTION_START_GUARDIAN = "com.bgkyadgiri.alarm.ACTION_START_GUARDIAN";
    public static final String ACTION_STOP_GUARDIAN = "com.bgkyadgiri.alarm.ACTION_STOP_GUARDIAN";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        createGuardianNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;

        if (ACTION_STOP_GUARDIAN.equals(action)) {
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        if (ACTION_START_GUARDIAN.equals(action)) {
            String nextTask = intent.getStringExtra("nextTask");
            String nextTime = intent.getStringExtra("nextTime");
            String contentText = "Active Alarm Guard protecting alarms";
            if (nextTask != null && !nextTask.isEmpty()) {
                contentText = "Next: " + nextTask + (nextTime != null ? " at " + nextTime : "");
            }

            int flagsPending = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                flagsPending |= PendingIntent.FLAG_IMMUTABLE;
            } else {
                flagsPending |= PendingIntent.FLAG_MUTABLE;
            }

            Intent mainIntent = new Intent(this, MainActivity.class);
            PendingIntent mainPendingIntent = PendingIntent.getActivity(this, 0, mainIntent, flagsPending);

            Notification guardianNotification = new NotificationCompat.Builder(this, GUARDIAN_CHANNEL_ID)
                    .setContentTitle("BGK Smart Alarm: Background protection active")
                    .setContentText(contentText)
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                    .setContentIntent(mainPendingIntent)
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .setOngoing(true)
                    .setAutoCancel(false)
                    .build();

            startForeground(GUARDIAN_NOTIFICATION_ID, guardianNotification);
            return START_STICKY;
        }

        if (ACTION_STOP.equals(action)) {
            stopAlarmAndService();
            return START_NOT_STICKY;
        } else if (ACTION_SNOOZE.equals(action)) {
            String id = intent.getStringExtra("id");
            String label = intent.getStringExtra("label");
            String repeatDays = intent.getStringExtra("repeatDays");
            snoozeAlarm(id, label, repeatDays);
            stopAlarmAndService();
            return START_NOT_STICKY;
        }

        String id = intent != null ? intent.getStringExtra("id") : "alarm";
        String label = intent != null ? intent.getStringExtra("label") : "BGK Smart Alarm";
        String repeatDays = intent != null ? intent.getStringExtra("repeatDays") : "";
        long timeMillis = intent != null ? intent.getLongExtra("timeMillis", System.currentTimeMillis()) : System.currentTimeMillis();

        // Handle repeat re-scheduling
        handleRepeatRescheduling(id, label, repeatDays, timeMillis);

        // Acquire WakeLock
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BGK:AlarmServiceLock");
            wakeLock.acquire(10 * 60 * 1000L); // 10 mins
        }

        // Set alarm volume to max or reasonable level
        AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (am != null) {
            int maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
            am.setStreamVolume(AudioManager.STREAM_ALARM, maxVol, 0);
        }

        // Start Foreground Notification
        Intent fullScreenIntent = new Intent(this, AlarmActivity.class);
        fullScreenIntent.putExtra("id", id);
        fullScreenIntent.putExtra("label", label);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        int flagsPending = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flagsPending |= PendingIntent.FLAG_IMMUTABLE;
        } else {
            flagsPending |= PendingIntent.FLAG_MUTABLE;
        }

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, Math.abs(id.hashCode()), fullScreenIntent, flagsPending);

        Intent stopIntent = new Intent(this, AlarmService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getService(this, 0, stopIntent, flagsPending);

        Intent snoozeIntent = new Intent(this, AlarmService.class);
        snoozeIntent.setAction(ACTION_SNOOZE);
        snoozeIntent.putExtra("id", id);
        snoozeIntent.putExtra("label", label);
        snoozeIntent.putExtra("repeatDays", repeatDays);
        PendingIntent snoozePendingIntent = PendingIntent.getService(this, 0, snoozeIntent, flagsPending);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("अलार्म बज रहा है: " + label)
                .setContentText("समय हो गया है! (Time to wake up)")
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "बंद करें (Dismiss)", stopPendingIntent)
                .addAction(android.R.drawable.ic_menu_recent_history, "स्नूज़ +5 मि (Snooze)", snoozePendingIntent)
                .setOngoing(true)
                .setAutoCancel(false)
                .build();

        startForeground(NOTIFICATION_ID, notification);

        startAlarmSoundAndVibration();

        return START_STICKY;
    }

    private void handleRepeatRescheduling(String id, String label, String repeatDays, long originalTime) {
        if (repeatDays != null && !repeatDays.isEmpty() && !repeatDays.equals("None")) {
            long nextTime = originalTime + 24L * 60L * 60L * 1000L; // Next day
            NativeAlarmPlugin.scheduleExactAlarmInternal(this, id, nextTime, label, repeatDays);
        }
    }

    private void snoozeAlarm(String id, String label, String repeatDays) {
        long snoozeTime = System.currentTimeMillis() + 5L * 60L * 1000L; // +5 mins
        NativeAlarmPlugin.scheduleExactAlarmInternal(this, id + "_snooze", snoozeTime, label + " (Snooze)", repeatDays);
    }

    private void startAlarmSoundAndVibration() {
        if (isPlaying) return;
        isPlaying = true;

        // Vibration
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null) {
            long[] pattern = {0, 1000, 1000};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
            } else {
                vibrator.vibrate(pattern, 0);
            }
        }

        // Sound AudioTrack (C6 square wave beep loop)
        new Thread(() -> {
            int sampleRate = 44100;
            int bufferSize = AudioTrack.getMinBufferSize(sampleRate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT);
            
            audioTrack = new AudioTrack.Builder()
                    .setAudioAttributes(new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build())
                    .setAudioFormat(new AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(sampleRate)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build())
                    .setBufferSizeInBytes(bufferSize)
                    .setTransferMode(AudioTrack.MODE_STREAM)
                    .build();

            audioTrack.play();
            double freq = 1046.5; // C6
            short[] buffer = new short[bufferSize];

            while (isPlaying) {
                for (int b = 0; b < 4; b++) {
                    if (!isPlaying) break;
                    int beepSamples = (int) (sampleRate * 0.1);
                    for (int i = 0; i < beepSamples; i++) {
                        double angle = 2.0 * Math.PI * i * freq / sampleRate;
                        buffer[i % bufferSize] = (short) (Math.sin(angle) > 0 ? 10000 : -10000);
                        if ((i + 1) % bufferSize == 0) {
                            audioTrack.write(buffer, 0, bufferSize);
                        }
                    }
                    if (beepSamples % bufferSize != 0) {
                        audioTrack.write(buffer, 0, beepSamples % bufferSize);
                    }
                    try { Thread.sleep(100); } catch (InterruptedException ignored) {}
                }
                try { Thread.sleep(500); } catch (InterruptedException ignored) {}
            }
        }).start();
    }

    private void stopAlarmAndService() {
        isPlaying = false;
        if (audioTrack != null) {
            try {
                audioTrack.stop();
                audioTrack.release();
            } catch (Exception ignored) {}
            audioTrack = null;
        }
        if (vibrator != null) {
            vibrator.cancel();
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        stopAlarmAndService();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "BGK Alarm Ringing Channel",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Playing active alarms with maximum priority");
                channel.enableVibration(true);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void createGuardianNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                NotificationChannel channel = new NotificationChannel(
                        GUARDIAN_CHANNEL_ID,
                        "BGK Guardian Channel",
                        NotificationManager.IMPORTANCE_LOW
                );
                channel.setDescription("Keeps background protection active for reliable alarms");
                manager.createNotificationChannel(channel);
            }
        }
    }
}
