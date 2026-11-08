package com.bgkyadgiri.alarm;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register native plugins before super.onCreate
        registerPlugin(NativeAlarmPlugin.class);
        registerPlugin(AlarmPermissionPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
