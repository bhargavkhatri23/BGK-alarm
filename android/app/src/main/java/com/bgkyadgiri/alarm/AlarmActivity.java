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
