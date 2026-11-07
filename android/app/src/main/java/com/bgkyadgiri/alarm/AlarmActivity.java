package com.bgkyadgiri.alarm;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AlarmActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Wake up screen and show over keyguard
        Window window = getWindow();
        window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (keyguardManager != null) {
                keyguardManager.requestDismissKeyguard(this, null);
            }
        }

        // Set up Ben 10 dark neon green theme UI in Hindi
        setContentView(createAlarmView());
    }

    private View createAlarmView() {
        android.widget.LinearLayout layout = new android.widget.LinearLayout(this);
        layout.setOrientation(android.widget.LinearLayout.VERTICAL);
        layout.setBackgroundColor(0xFF070B12); // Dark Omnitrix background
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setPadding(48, 48, 48, 48);

        Intent intent = getIntent();
        String label = intent != null ? intent.getStringExtra("label") : "अलार्म";
        if (label == null) label = "रिमाइंडर";

        // Title
        TextView title = new TextView(this);
        title.setText("⚡ BGK SMART ALARM ⚡");
        title.setTextColor(0xFF00FF66); // Neon green
        title.setTextSize(22);
        title.setGravity(android.view.Gravity.CENTER);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        layout.addView(title);

        // Time display
        TextView timeView = new TextView(this);
        SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
        timeView.setText(sdf.format(new Date()));
        timeView.setTextColor(0xFFFFFFFF);
        timeView.setTextSize(48);
        timeView.setGravity(android.view.Gravity.CENTER);
        timeView.setPadding(0, 32, 0, 32);
        layout.addView(timeView);

        // Label / Task
        TextView labelView = new TextView(this);
        labelView.setText("काम / रिमाइंडर: " + label);
        labelView.setTextColor(0xFF94A3B8);
        labelView.setTextSize(18);
        labelView.setGravity(android.view.Gravity.CENTER);
        labelView.setPadding(0, 0, 0, 64);
        layout.addView(labelView);

        // Snooze Button (+5 min)
        Button snoozeBtn = new Button(this);
        snoozeBtn.setText("स्नूज़ +5 मिनट (Snooze)");
        snoozeBtn.setTextColor(0xFF000000);
        snoozeBtn.setTextSize(16);
        snoozeBtn.setBackgroundColor(0xFF00FF66);
        snoozeBtn.setPadding(32, 32, 32, 32);
        android.widget.LinearLayout.LayoutParams params = new android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, 0, 0, 24);
        snoozeBtn.setLayoutParams(params);
        snoozeBtn.setOnClickListener(v -> {
            Intent snoozeIntent = new Intent(this, AlarmService.class);
            snoozeIntent.setAction(AlarmService.ACTION_SNOOZE);
            snoozeIntent.putExtra("label", label);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(snoozeIntent);
            } else {
                startService(snoozeIntent);
            }
            finish();
        });
        layout.addView(snoozeBtn);

        // Dismiss Button
        Button dismissBtn = new Button(this);
        dismissBtn.setText("बंद करें / Dismiss");
        dismissBtn.setTextColor(0xFFFFFFFF);
        dismissBtn.setTextSize(16);
        dismissBtn.setBackgroundColor(0xFFEF4444); // Red
        dismissBtn.setPadding(32, 32, 32, 32);
        dismissBtn.setLayoutParams(params);
        dismissBtn.setOnClickListener(v -> {
            Intent stopIntent = new Intent(this, AlarmService.class);
            stopIntent.setAction(AlarmService.ACTION_STOP);
            startService(stopIntent);
            finish();
        });
        layout.addView(dismissBtn);

        return layout;
    }

    @Override
    public void onBackPressed() {
        // Prevent accidental dismissal with back button
    }
}
