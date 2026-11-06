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
import android.media.AudioTrack;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;

public class AlarmService extends Service {
    private AudioTrack audioTrack;
    private boolean isPlaying = false;
    private PowerManager.WakeLock wakeLock;
    
    private static final String CHANNEL_ALARM_ID = "bgk_alarm_service_channel";
    private static final String CHANNEL_GUARDIAN_ID = "bgk_guardian_channel";
    
    private static final int NOTIFICATION_ALARM_ID = 1001;
    private static final int NOTIFICATION_GUARDIAN_ID = 2001;

    public static final String ACTION_START_ALARM = "START_ALARM";
    public static final String ACTION_STOP_ALARM = "STOP_ALARM";
    public static final String ACTION_START_GUARDIAN = "START_GUARDIAN";
    public static final String ACTION_STOP_GUARDIAN = "STOP_GUARDIAN";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;

        if (ACTION_START_ALARM.equals(action)) {
            handleStartAlarm(intent);
        } else if (ACTION_STOP_ALARM.equals(action)) {
            handleStopAlarm();
        } else if (ACTION_START_GUARDIAN.equals(action)) {
            showGuardianNotification();
        } else if (ACTION_STOP_GUARDIAN.equals(action)) {
            stopForeground(true);
            stopSelf();
        } else if (action == null) {
            // Service was likely restarted by the system (START_STICKY)
            showGuardianNotification();
        }

        return START_STICKY;
    }

    private void showGuardianNotification() {
        // Stop alarm sound if it was playing
        stopAlarmSound();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }

        Intent notificationIntent = new Intent(this, MainActivity.class);
        int pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            pendingIntentFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, pendingIntentFlags);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_GUARDIAN_ID)
                .setContentTitle("BGK SMART ALARM")
                .setContentText("Background alarm protection active")
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setOngoing(true)
                .setSilent(true)
                .build();

        startForeground(NOTIFICATION_GUARDIAN_ID, notification);
    }

    private void handleStartAlarm(Intent intent) {
        String task = intent != null ? intent.getStringExtra("task") : "Scheduled Reminder";

        // 1. Acquire Service WakeLock
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            if (wakeLock == null) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BGK:AlarmServiceWakeLock");
            }
            if (!wakeLock.isHeld()) {
                wakeLock.acquire(10 * 60 * 1000L); // 10 minutes max
            }
        }

        int pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            pendingIntentFlags |= PendingIntent.FLAG_MUTABLE;
        }

        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, pendingIntentFlags);

        Intent stopIntent = new Intent(this, AlarmService.class);
        stopIntent.setAction(ACTION_STOP_ALARM);
        PendingIntent stopPendingIntent = PendingIntent.getService(this, 0, stopIntent, pendingIntentFlags);

        // 2. Build High-Priority Notification
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ALARM_ID)
                .setContentTitle("BGK SMART ALARM: " + task)
                .setContentText("अलार्म बज रहा है! (Alarm Ringing)")
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(pendingIntent, true)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "DISMISS / बंद करें", stopPendingIntent)
                .setOngoing(true)
                .setAutoCancel(false)
                .build();

        startForeground(NOTIFICATION_ALARM_ID, notification);
        startAlarmSound();
    }

    private void handleStopAlarm() {
        stopAlarmSound();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        // Instead of stopping the service, downgrade to Guardian mode
        showGuardianNotification();
    }

    private void startAlarmSound() {
        if (isPlaying) return;
        isPlaying = true;
        
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
                        buffer[i % bufferSize] = (short) (Math.sin(angle) > 0 ? 8000 : -8000);
                        if ((i + 1) % bufferSize == 0) audioTrack.write(buffer, 0, bufferSize);
                    }
                    if (beepSamples % bufferSize != 0) {
                        audioTrack.write(buffer, 0, beepSamples % bufferSize);
                    }
                    try { Thread.sleep(50); } catch (InterruptedException ignored) {}
                }
                try { Thread.sleep(600); } catch (InterruptedException ignored) {}
            }
        }).start();
    }

    private void stopAlarmSound() {
        isPlaying = false;
        if (audioTrack != null) {
            try {
                audioTrack.stop();
                audioTrack.release();
            } catch (Exception ignored) {}
            audioTrack = null;
        }
    }

    @Override
    public void onDestroy() {
        stopAlarmSound();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                // 1. High Priority Alarm Channel
                NotificationChannel alarmChannel = new NotificationChannel(
                        CHANNEL_ALARM_ID, "Alarm Alerts", NotificationManager.IMPORTANCE_HIGH
                );
                alarmChannel.setDescription("Shows active ringing alarms.");
                alarmChannel.setSound(null, null); 
                alarmChannel.enableVibration(true);
                alarmChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                manager.createNotificationChannel(alarmChannel);

                // 2. Low Priority Guardian Channel
                NotificationChannel guardianChannel = new NotificationChannel(
                        CHANNEL_GUARDIAN_ID, "Background Protection", NotificationManager.IMPORTANCE_LOW
                );
                guardianChannel.setDescription("Ensures the app remains active for background alarms.");
                guardianChannel.setSound(null, null);
                guardianChannel.enableVibration(false);
                manager.createNotificationChannel(guardianChannel);
            }
        }
    }
}
