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
    private static final String CHANNEL_ID = "bgk_alarm_service_channel";
    private static final int NOTIFICATION_ID = 1001;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if ("STOP_ALARM".equals(action)) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String task = intent != null ? intent.getStringExtra("task") : "Scheduled Reminder";

        // 1. Acquire Service WakeLock to keep CPU running while alarm rings
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BGK:AlarmServiceWakeLock");
            wakeLock.acquire(10 * 60 * 1000L /*10 minutes max*/);
        }

        // 2. Prepare PendingIntents with correct Mutability flags for Android 12+
        int pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            pendingIntentFlags |= PendingIntent.FLAG_MUTABLE;
        }

        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, pendingIntentFlags);

        Intent stopIntent = new Intent(this, AlarmService.class);
        stopIntent.setAction("STOP_ALARM");
        PendingIntent stopPendingIntent = PendingIntent.getService(this, 0, stopIntent, pendingIntentFlags);

        // 3. Build High-Priority Notification for Lock Screen & Heads-up
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("BGK SMART ALARM: " + task)
                .setContentText("अलार्म बज रहा है! (Alarm Ringing)")
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(pendingIntent, true) // Crucial for Android 14+ background launch
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "DISMISS / बंद करें", stopPendingIntent)
                .setOngoing(true)
                .setAutoCancel(false)
                .build();

        // 4. Start Foreground with specific type if on Android 14+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            // Android 14 requirements are handled via manifest property_special_use_fgs_subtype
            startForeground(NOTIFICATION_ID, notification);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        startAlarmSound();

        return START_STICKY;
    }

    private void startAlarmSound() {
        if (isPlaying) return;
        isPlaying = true;
        
        new Thread(new Runnable() {
            @Override
            public void run() {
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
                            
                            if ((i + 1) % bufferSize == 0) {
                                audioTrack.write(buffer, 0, bufferSize);
                            }
                        }
                        if (beepSamples % bufferSize != 0) {
                            audioTrack.write(buffer, 0, beepSamples % bufferSize);
                        }
                        try { Thread.sleep(50); } catch (InterruptedException e) {}
                    }
                    try { Thread.sleep(600); } catch (InterruptedException e) {}
                }
            }
        }).start();
    }

    @Override
    public void onDestroy() {
        isPlaying = false;
        if (audioTrack != null) {
            try {
                audioTrack.stop();
                audioTrack.release();
            } catch (Exception e) {}
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Alarm Service Channel",
                    NotificationManager.IMPORTANCE_HIGH
            );
            serviceChannel.setDescription("Ensures alarms ring even when app is closed.");
            serviceChannel.setSound(null, null); 
            serviceChannel.enableVibration(true);
            serviceChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
}
