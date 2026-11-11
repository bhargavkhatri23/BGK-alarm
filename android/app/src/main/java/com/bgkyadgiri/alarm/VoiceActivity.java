package com.bgkyadgiri.alarm;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.speech.tts.TextToSpeech;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Locale;

public class VoiceActivity extends AppCompatActivity {
    private TextToSpeech tts;
    private ActivityResultLauncher<Intent> speechLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        speechLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    ArrayList<String> matches = result.getData().getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                    if (matches != null && !matches.isEmpty()) {
                        processVoiceCommand(matches.get(0));
                        return;
                    }
                }
                finish();
            }
        );

        launchSpeechRecognizer();
    }

    private void launchSpeechRecognizer() {
        try {
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN");
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "hi-IN");
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "BGK अलार्म: बोलिए (जैसे 'BGK 9:00 बजे का अलार्म लगाओ')");
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
            speechLauncher.launch(intent);
        } catch (Exception e) {
            Toast.makeText(this, "Speech recognizer unavailable", Toast.LENGTH_SHORT).show();
            finish();
        }
    }

    private void processVoiceCommand(String rawTranscript) {
        if (rawTranscript == null || rawTranscript.trim().isEmpty()) {
            finish();
            return;
        }

        String lower = rawTranscript.toLowerCase();
        int hour = -1;
        int minute = 0;
        String ampm = "AM";

        boolean hasPM = lower.contains("pm") || lower.contains("पीएम") || lower.contains("शाम") || lower.contains("रात") || lower.contains("दोपहर");
        boolean hasAM = lower.contains("am") || lower.contains("एएम") || lower.contains("सुबह");

        // Digital format like 9:30 or 9.30
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d{1,2})[:.](\\d{2})").matcher(rawTranscript);
        if (m.find()) {
            try {
                hour = Integer.parseInt(m.group(1));
                minute = Integer.parseInt(m.group(2));
            } catch (Exception ignored) {}
        }

        // Baje format like 9 बजे
        if (hour == -1) {
            java.util.regex.Matcher bajeM = java.util.regex.Pattern.compile("(\\d{1,2})\\s*(?:बजे|baje)").matcher(rawTranscript);
            if (bajeM.find()) {
                try {
                    hour = Integer.parseInt(bajeM.group(1));
                    if (lower.contains("साढ़े") || lower.contains("sadhe")) minute = 30;
                    else if (lower.contains("सवा") || lower.contains("sawa")) minute = 15;
                    else if (lower.contains("पौने") || lower.contains("paune")) minute = 45;
                } catch (Exception ignored) {}
            }
        }

        // Word numbers fallback
        if (hour == -1) {
            if (lower.contains("एक बजे")) hour = 1;
            else if (lower.contains("दो बजे")) hour = 2;
            else if (lower.contains("तीन बजे")) hour = 3;
            else if (lower.contains("चार बजे")) hour = 4;
            else if (lower.contains("पांच बजे") || lower.contains("पाँच बजे")) hour = 5;
            else if (lower.contains("छह बजे") || lower.contains("छः बजे")) hour = 6;
            else if (lower.contains("सात बजे")) hour = 7;
            else if (lower.contains("आठ बजे")) hour = 8;
            else if (lower.contains("नौ बजे")) hour = 9;
            else if (lower.contains("दस बजे")) hour = 10;
            else if (lower.contains("ग्यारह बजे")) hour = 11;
            else if (lower.contains("बारह बजे")) hour = 12;
        }

        if (hour != -1) {
            if (hour >= 13 && hour <= 23) {
                hour = hour - 12;
                ampm = "PM";
            } else if (hasPM) {
                ampm = "PM";
            } else if (hasAM) {
                ampm = "AM";
            } else {
                Calendar cal = Calendar.getInstance();
                int currentHour = cal.get(Calendar.HOUR_OF_DAY);
                if (currentHour >= 12 && hour < 12) {
                    ampm = "PM";
                } else {
                    ampm = "AM";
                }
            }

            Calendar triggerCal = Calendar.getInstance();
            int h24 = hour;
            if (ampm.equals("PM") && h24 < 12) h24 += 12;
            if (ampm.equals("AM") && h24 == 12) h24 = 0;

            triggerCal.set(Calendar.HOUR_OF_DAY, h24);
            triggerCal.set(Calendar.MINUTE, minute);
            triggerCal.set(Calendar.SECOND, 0);
            triggerCal.set(Calendar.MILLISECOND, 0);

            if (triggerCal.getTimeInMillis() <= System.currentTimeMillis()) {
                triggerCal.add(Calendar.DAY_OF_YEAR, 1);
            }

            String alarmId = "alarm_" + System.currentTimeMillis();
            String task = "BGK वॉयस अलार्म (" + String.format(Locale.US, "%02d:%02d %s", hour, minute, ampm) + ")";
            NativeAlarmPlugin.scheduleExactAlarmInternal(this, alarmId, triggerCal.getTimeInMillis(), task, "प्रतिदिन (Every Day)", "", "", "", "", "");

            String confirmationMsg = "बीजीके: " + hour + " बज के " + minute + " मिनट " + ampm + " का अलार्म सेट कर दिया गया है!";
            Toast.makeText(this, confirmationMsg, Toast.LENGTH_LONG).show();

            speakAndFinish(confirmationMsg);
        } else {
            Toast.makeText(this, "समय समझ नहीं आया: " + rawTranscript, Toast.LENGTH_SHORT).show();
            finish();
        }
    }

    private void speakAndFinish(String text) {
        tts = new TextToSpeech(getApplicationContext(), status -> {
            if (status == TextToSpeech.SUCCESS) {
                tts.setLanguage(new Locale("hi", "IN"));
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "BGK_VOICE_CONFIRM");
                // Allow speech to start, then finish activity
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                    try {
                        if (tts != null) {
                            tts.stop();
                            tts.shutdown();
                        }
                    } catch (Exception ignored) {}
                    finish();
                }, 2800);
            } else {
                finish();
            }
        });
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            try {
                tts.stop();
                tts.shutdown();
            } catch (Exception ignored) {}
        }
        super.onDestroy();
    }
}
