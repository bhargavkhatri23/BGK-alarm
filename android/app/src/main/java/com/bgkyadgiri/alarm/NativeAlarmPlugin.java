package com.bgkyadgiri.alarm;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;
import android.provider.ContactsContract;
import android.database.Cursor;

import android.speech.RecognizerIntent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import java.util.ArrayList;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import androidx.core.app.ActivityCompat;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(
    name = "NativeAlarm",
    permissions = {
        @Permission(
            alias = "contacts",
            strings = { android.Manifest.permission.READ_CONTACTS }
        ),
        @Permission(
            alias = "phone",
            strings = { android.Manifest.permission.CALL_PHONE }
        ),
        @Permission(
            alias = "audio",
            strings = { android.Manifest.permission.RECORD_AUDIO }
        )
    }
)
public class NativeAlarmPlugin extends Plugin {
    private static final String PREF_NAME = "bgk_alarms_pref";
    private static final String KEY_STORED_ALARMS = "stored_alarms";

    @PluginMethod
    public void canScheduleExact(PluginCall call) {
        Context context = getContext();
        boolean canExact = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am != null) {
                canExact = am.canScheduleExactAlarms();
            }
        }
        JSObject ret = new JSObject();
        ret.put("granted", canExact);
        call.resolve(ret);
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                    android.net.Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void requestContactsAndCallPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && getActivity() != null) {
            ActivityCompat.requestPermissions(
                getActivity(),
                new String[]{
                    android.Manifest.permission.READ_CONTACTS,
                    android.Manifest.permission.CALL_PHONE
                },
                9988
            );
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void startSpeechRecognition(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && getActivity() != null) {
            if (ActivityCompat.checkSelfPermission(getContext(), android.Manifest.permission.RECORD_AUDIO) 
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[]{ android.Manifest.permission.RECORD_AUDIO },
                    7788
                );
            }
        }

        try {
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            String lang = call.getString("language", "hi-IN");
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang);
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "BGK अलार्म: बोलिए (जैसे 'BGK 9:00 बजे का अलार्म लगाओ')");
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);

            startActivityForResult(call, intent, "speechResultCallback");
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("transcript", "");
            ret.put("cancelled", true);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    @ActivityCallback
    private void speechResultCallback(PluginCall call, ActivityResult result) {
        if (call == null) return;
        try {
            if (result != null && result.getResultCode() == android.app.Activity.RESULT_OK && result.getData() != null) {
                ArrayList<String> matches = result.getData().getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                if (matches != null && !matches.isEmpty()) {
                    JSObject ret = new JSObject();
                    ret.put("transcript", matches.get(0));
                    JSONArray altArr = new JSONArray();
                    for (String m : matches) {
                        altArr.put(m);
                    }
                    ret.put("alternatives", altArr);
                    ret.put("cancelled", false);
                    call.resolve(ret);
                    return;
                }
            }
        } catch (Exception ignored) {}

        JSObject ret = new JSObject();
        ret.put("transcript", "");
        ret.put("cancelled", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getContacts(PluginCall call) {
        Context context = getContext();
        JSONArray contactArray = new JSONArray();
        Cursor cursor = null;
        try {
            cursor = context.getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[]{
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                    ContactsContract.CommonDataKinds.Phone.NUMBER
                },
                null, null,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
            );

            if (cursor != null) {
                int nameIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int numIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                
                while (cursor.moveToNext()) {
                    String name = nameIdx != -1 ? cursor.getString(nameIdx) : "";
                    String number = numIdx != -1 ? cursor.getString(numIdx) : "";
                    if (name != null && number != null && !number.trim().isEmpty()) {
                        JSONObject obj = new JSONObject();
                        obj.put("name", name);
                        obj.put("phoneNumber", number);
                        contactArray.put(obj);
                    }
                }
            }
        } catch (Exception e) {
            // Ignored
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }

        JSObject ret = new JSObject();
        ret.put("contacts", contactArray);
        call.resolve(ret);
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        String id = call.getString("id");
        Long timeMillis = call.getLong("timeMillis");
        String label = call.getString("label", "Alarm");
        String repeatDays = call.getString("repeatDays", "");
        String callContactName = call.getString("callContactName", "");
        String callContactNumber = call.getString("callContactNumber", "");
        String whatsappContactName = call.getString("whatsappContactName", "");
        String whatsappContactNumber = call.getString("whatsappContactNumber", "");
        String whatsappMessage = call.getString("whatsappMessage", "");

        if (id == null || timeMillis == null) {
            call.reject("id and timeMillis are required");
            return;
        }

        scheduleExactAlarmInternal(getContext(), id, timeMillis, label, repeatDays, callContactName, callContactNumber, whatsappContactName, whatsappContactNumber, whatsappMessage);
        saveAlarmToPrefs(getContext(), id, timeMillis, label, repeatDays, callContactName, callContactNumber, whatsappContactName, whatsappContactNumber, whatsappMessage);
        call.resolve();
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        String id = call.getString("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }
        cancelAlarmInternal(getContext(), id);
        removeAlarmFromPrefs(getContext(), id);
        call.resolve();
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        try {
            String jsonStr = prefs.getString(KEY_STORED_ALARMS, "[]");
            JSONArray arr = new JSONArray(jsonStr);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                cancelAlarmInternal(context, obj.getString("id"));
            }
        } catch (Exception ignored) {}
        prefs.edit().remove(KEY_STORED_ALARMS).apply();
        call.resolve();
    }

    public static void scheduleExactAlarmInternal(Context context, String id, long triggerTime, String label, String repeatDays, String callContactName, String callContactNumber, String whatsappContactName, String whatsappContactNumber, String whatsappMessage) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("alarmId", id);
        intent.putExtra("task", label);
        intent.putExtra("repeatDays", repeatDays);
        intent.putExtra("timeMillis", triggerTime);
        intent.putExtra("callContactName", callContactName != null ? callContactName : "");
        intent.putExtra("callContactNumber", callContactNumber != null ? callContactNumber : "");
        intent.putExtra("whatsappContactName", whatsappContactName != null ? whatsappContactName : "");
        intent.putExtra("whatsappContactNumber", whatsappContactNumber != null ? whatsappContactNumber : "");
        intent.putExtra("whatsappMessage", whatsappMessage != null ? whatsappMessage : "");

        int requestCode = Math.abs(id.hashCode());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);

        Intent showIntent = new Intent(context, AlarmActivity.class);
        showIntent.putExtra("id", id);
        showIntent.putExtra("label", label);
        showIntent.putExtra("callContactName", callContactName != null ? callContactName : "");
        showIntent.putExtra("callContactNumber", callContactNumber != null ? callContactNumber : "");
        showIntent.putExtra("whatsappContactName", whatsappContactName != null ? whatsappContactName : "");
        showIntent.putExtra("whatsappContactNumber", whatsappContactNumber != null ? whatsappContactNumber : "");
        showIntent.putExtra("whatsappMessage", whatsappMessage != null ? whatsappMessage : "");
        PendingIntent showPendingIntent = PendingIntent.getActivity(context, requestCode, showIntent, flags);

        AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(triggerTime, showPendingIntent);
        am.setAlarmClock(clockInfo, pendingIntent);
    }

    public static void cancelAlarmInternal(Context context, String id) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent intent = new Intent(context, AlarmReceiver.class);
        int requestCode = Math.abs(id.hashCode());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);
        am.cancel(pendingIntent);
    }

    private static void saveAlarmToPrefs(Context context, String id, long timeMillis, String label, String repeatDays, String callContactName, String callContactNumber, String whatsappContactName, String whatsappContactNumber, String whatsappMessage) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        try {
            JSONArray arr = new JSONArray(prefs.getString(KEY_STORED_ALARMS, "[]"));
            JSONArray newArr = new JSONArray();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                if (!obj.getString("id").equals(id)) {
                    newArr.put(obj);
                }
            }
            JSONObject newObj = new JSONObject();
            newObj.put("id", id);
            newObj.put("timeMillis", timeMillis);
            newObj.put("label", label);
            newObj.put("repeatDays", repeatDays);
            newObj.put("callContactName", callContactName != null ? callContactName : "");
            newObj.put("callContactNumber", callContactNumber != null ? callContactNumber : "");
            newObj.put("whatsappContactName", whatsappContactName != null ? whatsappContactName : "");
            newObj.put("whatsappContactNumber", whatsappContactNumber != null ? whatsappContactNumber : "");
            newObj.put("whatsappMessage", whatsappMessage != null ? whatsappMessage : "");
            newArr.put(newObj);
            prefs.edit().putString(KEY_STORED_ALARMS, newArr.toString()).apply();
        } catch (Exception ignored) {}
    }

    private static void removeAlarmFromPrefs(Context context, String id) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        try {
            JSONArray arr = new JSONArray(prefs.getString(KEY_STORED_ALARMS, "[]"));
            JSONArray newArr = new JSONArray();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                if (!obj.getString("id").equals(id)) {
                    newArr.put(obj);
                }
            }
            prefs.edit().putString(KEY_STORED_ALARMS, newArr.toString()).apply();
        } catch (Exception ignored) {}
    }

    public static void rescheduleAllStoredAlarms(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        try {
            JSONArray arr = new JSONArray(prefs.getString(KEY_STORED_ALARMS, "[]"));
            long now = System.currentTimeMillis();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                long time = obj.getLong("timeMillis");
                String id = obj.getString("id");
                String label = obj.getString("label");
                String repeatDays = obj.getString("repeatDays");
                String callContactName = obj.optString("callContactName", "");
                String callContactNumber = obj.optString("callContactNumber", "");
                String whatsappContactName = obj.optString("whatsappContactName", "");
                String whatsappContactNumber = obj.optString("whatsappContactNumber", "");
                String whatsappMessage = obj.optString("whatsappMessage", "");
                if (time > now) {
                    scheduleExactAlarmInternal(context, id, time, label, repeatDays, callContactName, callContactNumber, whatsappContactName, whatsappContactNumber, whatsappMessage);
                }
            }
        } catch (Exception ignored) {}
    }
}
