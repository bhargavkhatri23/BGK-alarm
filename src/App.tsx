/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlarmItem } from './types/alarm';
import { INITIAL_DEMO_USERS, INITIAL_DEMO_ALARMS, DEFAULT_RINGTONE } from './utils/constants';
import { audioEngine } from './utils/audioEngine';
import { backgroundTimer } from './utils/backgroundTimer';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { HomeScreen } from './components/HomeScreen';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { CreateAlarmSheet } from './components/CreateAlarmSheet';
import { AlarmRingingModal } from './components/AlarmRingingModal';
import { NativePermissionDialog } from './components/NativePermissionDialog';
import { DeviceFrameWrapper } from './components/DeviceFrameWrapper';
import { notificationService } from './utils/notificationService';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function App() {
  // Persistence in localStorage
  const [registeredUsers, setRegisteredUsers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('bgk_registered_users');
      return saved ? JSON.parse(saved) : INITIAL_DEMO_USERS;
    } catch {
      return INITIAL_DEMO_USERS;
    }
  });

  const [userAlarms, setUserAlarms] = useState<Record<string, AlarmItem[]>>(() => {
    try {
      const saved = localStorage.getItem('bgk_user_alarms');
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, AlarmItem[]>;
        const sanitized: Record<string, AlarmItem[]> = {};
        for (const [user, list] of Object.entries(parsed)) {
          sanitized[user] = list.map((a) => ({ ...a, ringtone: DEFAULT_RINGTONE }));
        }
        return sanitized;
      }
      return INITIAL_DEMO_ALARMS;
    } catch {
      return INITIAL_DEMO_ALARMS;
    }
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem('bgk_current_user') || null;
    } catch {
      return null;
    }
  });

  // Strict initial default to Login screen when not authenticated
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'home'>(() => {
    try {
      return localStorage.getItem('bgk_current_user') ? 'home' : 'login';
    } catch {
      return 'login';
    }
  });

  const [isHindi, setIsHindi] = useState<boolean>(true);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [isCreateAlarmOpen, setIsCreateAlarmOpen] = useState<boolean>(false);
  const [alarmToEdit, setAlarmToEdit] = useState<AlarmItem | null>(null);
  const [activeRingingAlarm, setActiveRingingAlarm] = useState<AlarmItem | null>(null);

  // Native system permission dialog prompt state
  const [showNativePermissionDialog, setShowNativePermissionDialog] = useState<boolean>(false);

  // Audio Context unlocker on user interaction
  useEffect(() => {
    const unlock = () => {
      audioEngine.initContext();
    };
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bgk_registered_users', JSON.stringify(registeredUsers));
    } catch {
      // Ignored
    }
  }, [registeredUsers]);

  useEffect(() => {
    try {
      localStorage.setItem('bgk_user_alarms', JSON.stringify(userAlarms));
    } catch {
      // Ignored
    }
  }, [userAlarms]);

  useEffect(() => {
    try {
      if (currentUserEmail) {
        localStorage.setItem('bgk_current_user', currentUserEmail);
      } else {
        localStorage.removeItem('bgk_current_user');
      }
    } catch {
      // Ignored
    }
  }, [currentUserEmail]);

  // Sync alarms with native OS notifications for closed-app execution
  useEffect(() => {
    if (currentUserEmail && userAlarms[currentUserEmail]) {
      notificationService.syncAlarms(userAlarms[currentUserEmail]);
    }
  }, [currentUserEmail, userAlarms]);

  // Listen for notification taps to open the app and trigger the ringing UI
  useEffect(() => {
    let sub: Promise<any>;
    sub = LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const alarmId = action.notification.extra?.alarmId;
      if (alarmId && currentUserEmail) {
        const alarm = (userAlarms[currentUserEmail] || []).find(a => a.id === alarmId);
        if (alarm) {
          setActiveRingingAlarm(alarm);
        }
      }
    });
    return () => {
      sub.then(s => s.remove());
    };
  }, [currentUserEmail, userAlarms]);

  // Request native permission dynamically
  const triggerNativePermissionCheck = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowNativePermissionDialog(true);
        try {
          Notification.requestPermission();
        } catch {
          // Ignored
        }
      }
    }
    try {
      backgroundTimer.requestWakeLock();
      audioEngine.initContext();
    } catch {
      // Ignored
    }
  };

  // ================= FOREGROUND / BACKGROUND PERSISTENCE & TIMER =================
  const triggeredAlarmsMapRef = useRef<Map<string, number>>(new Map());

  const checkAlarms = useCallback(() => {
    if (!currentUserEmail) return;

    const now = new Date();

    const dayIndex = now.getDay();
    const dayNames = [
      'रविवार (Sunday)',
      'सोमवार (Monday)',
      'मंगलवार (Tuesday)',
      'बुधवार (Wednesday)',
      'गुरुवार (Thursday)',
      'शुक्रवार (Friday)',
      'शनिवार (Saturday)',
    ];
    const currentDay = dayNames[dayIndex];
    const currentDayShort = currentDay.split(' ')[0];

    let hours = now.getHours();
    const ampm: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHour = hours.toString().padStart(2, '0');
    const formattedMinute = now.getMinutes().toString().padStart(2, '0');

    const currentList = userAlarms[currentUserEmail] || [];

    for (const alarm of currentList) {
      if (!alarm.enabled) continue;

      const matchesDay =
        alarm.day === 'प्रतिदिन (Every Day)' ||
        alarm.day === currentDay ||
        alarm.day.includes(currentDayShort);

      const matchesHour = alarm.hour === formattedHour;
      const matchesMinute = alarm.minute === formattedMinute;
      const matchesAmPm = alarm.ampm === ampm;

      if (matchesDay && matchesHour && matchesMinute && matchesAmPm) {
        const triggerKey = `${alarm.id}_${currentDayShort}_${formattedHour}:${formattedMinute}_${ampm}`;

        if (!triggeredAlarmsMapRef.current.has(triggerKey)) {
          triggeredAlarmsMapRef.current.set(triggerKey, Date.now());

          // 1. AUTO-TRIGGER: open ringing UI automatically
          setActiveRingingAlarm(alarm);

          // 2. Play the classic digital beep sound automatically
          audioEngine.play(DEFAULT_RINGTONE, true);

          // 3. Native system notification
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            try {
              new Notification(`BGK Yadgiri: ${alarm.task}`, {
                body: `समय: ${alarm.time} | क्लासिक डिजिटल बीप अलार्म बज रहा है!`,
                icon: '/favicon.ico',
                tag: triggerKey,
              });
            } catch {
              // Ignored
            }
          }

          break;
        }
      }
    }

    if (triggeredAlarmsMapRef.current.size > 40) {
      const purgeThreshold = Date.now() - 120000;
      for (const [key, timestamp] of triggeredAlarmsMapRef.current.entries()) {
        if (timestamp < purgeThreshold) {
          triggeredAlarmsMapRef.current.delete(key);
        }
      }
    }
  }, [currentUserEmail, userAlarms]);

  // Subscribe backgroundTimer service (Web Worker + Main Thread dual tick)
  useEffect(() => {
    const unsubscribe = backgroundTimer.subscribe(checkAlarms);
    return () => {
      unsubscribe();
    };
  }, [checkAlarms]);

  // Authentication Handlers
  const handleLogin = (email: string, pass: string): boolean => {
    const cleanEmail = email.trim();
    if (registeredUsers[cleanEmail] && registeredUsers[cleanEmail] === pass) {
      setCurrentUserEmail(cleanEmail);
      if (!userAlarms[cleanEmail]) {
        setUserAlarms((prev) => ({
          ...prev,
          [cleanEmail]: [],
        }));
      }
      setCurrentScreen('home');

      // Trigger standard native permission prompt on login
      setTimeout(() => {
        triggerNativePermissionCheck();
      }, 500);

      return true;
    }
    return false;
  };

  const handleRegister = (email: string, pass: string): boolean => {
    const cleanEmail = email.trim();
    if (registeredUsers[cleanEmail]) {
      return false;
    }
    setRegisteredUsers((prev) => ({
      ...prev,
      [cleanEmail]: pass,
    }));
    setUserAlarms((prev) => ({
      ...prev,
      [cleanEmail]: [],
    }));
    return true;
  };

  const handleSavePassword = (email: string, newPass: string) => {
    setRegisteredUsers((prev) => ({
      ...prev,
      [email]: newPass,
    }));
  };

  const handleLogout = () => {
    audioEngine.stop();
    setActiveRingingAlarm(null);
    setCurrentUserEmail(null);
    setCurrentScreen('login');
  };

  // Alarm Management Handlers
  const currentAlarms = currentUserEmail ? userAlarms[currentUserEmail] || [] : [];

  const handleSaveAlarm = (alarmData: {
    task: string;
    day: string;
    hour: string;
    minute: string;
    ampm: 'AM' | 'PM';
    ringtone: string;
  }) => {
    if (!currentUserEmail) return;

    const timeString = `${alarmData.day}, ${alarmData.hour}:${alarmData.minute} ${alarmData.ampm}`;

    if (alarmToEdit) {
      setUserAlarms((prev) => {
        const list = prev[currentUserEmail] || [];
        const updated = list.map((item) =>
          item.id === alarmToEdit.id
            ? {
                ...item,
                ...alarmData,
                ringtone: DEFAULT_RINGTONE,
                time: timeString,
              }
            : item
        );
        return { ...prev, [currentUserEmail]: updated };
      });
    } else {
      const newAlarm: AlarmItem = {
        id: `alarm-${Date.now()}`,
        task: alarmData.task,
        time: timeString,
        day: alarmData.day,
        hour: alarmData.hour,
        minute: alarmData.minute,
        ampm: alarmData.ampm,
        ringtone: DEFAULT_RINGTONE,
        enabled: true,
        createdAt: Date.now(),
      };

      setUserAlarms((prev) => {
        const list = prev[currentUserEmail] || [];
        return {
          ...prev,
          [currentUserEmail]: [newAlarm, ...list],
        };
      });
    }

    setIsCreateAlarmOpen(false);
    setAlarmToEdit(null);

    // Prompt native permission when user sets an alarm if not already granted
    triggerNativePermissionCheck();
  };

  // Quick helper to schedule an alarm for 1 minute in the future
  const handleQuickAddOneMinAlarm = () => {
    if (!currentUserEmail) return;
    const now = new Date();
    const nextMin = new Date(now.getTime() + 60 * 1000);

    let hours = nextMin.getHours();
    const ampm: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hourStr = hours.toString().padStart(2, '0');
    const minuteStr = nextMin.getMinutes().toString().padStart(2, '0');

    const dayIndex = nextMin.getDay();
    const dayNames = [
      'रविवार (Sunday)',
      'सोमवार (Monday)',
      'मंगलवार (Tuesday)',
      'बुधवार (Wednesday)',
      'गुरुवार (Thursday)',
      'शुक्रवार (Friday)',
      'शनिवार (Saturday)',
    ];
    const dayStr = dayNames[dayIndex];
    const timeString = `प्रतिदिन (Every Day), ${hourStr}:${minuteStr} ${ampm}`;

    const newAlarm: AlarmItem = {
      id: `auto-test-${Date.now()}`,
      task: `⚡ ऑटो टेस्ट रिमाइंडर (${hourStr}:${minuteStr} ${ampm})`,
      time: timeString,
      day: 'प्रतिदिन (Every Day)',
      hour: hourStr,
      minute: minuteStr,
      ampm: ampm,
      ringtone: DEFAULT_RINGTONE,
      enabled: true,
      createdAt: Date.now(),
    };

    setUserAlarms((prev) => {
      const list = prev[currentUserEmail] || [];
      return {
        ...prev,
        [currentUserEmail]: [newAlarm, ...list],
      };
    });

    triggerNativePermissionCheck();
  };

  const handleEditAlarm = (alarm: AlarmItem) => {
    setAlarmToEdit(alarm);
    setIsCreateAlarmOpen(true);
  };

  const handleDeleteAlarm = (alarmId: string) => {
    if (!currentUserEmail) return;
    setUserAlarms((prev) => {
      const list = prev[currentUserEmail] || [];
      return {
        ...prev,
        [currentUserEmail]: list.filter((a) => a.id !== alarmId),
      };
    });
  };

  const handleToggleAlarm = (alarmId: string) => {
    if (!currentUserEmail) return;
    setUserAlarms((prev) => {
      const list = prev[currentUserEmail] || [];
      return {
        ...prev,
        [currentUserEmail]: list.map((a) =>
          a.id === alarmId ? { ...a, enabled: !a.enabled } : a
        ),
      };
    });
  };

  const handleTriggerTestAlarm = (specificAlarm?: AlarmItem) => {
    const alarmToRing =
      specificAlarm ||
      (currentAlarms.length > 0 ? currentAlarms[0] : null) || {
        id: 'test-emergency-alarm',
        task: 'दवाई लेना व पेट्रोल भरवाना (अलार्म टेस्ट)',
        time: 'आज, अभी',
        day: 'प्रतिदिन (Every Day)',
        hour: '12',
        minute: '00',
        ampm: 'PM',
        ringtone: DEFAULT_RINGTONE,
        enabled: true,
        createdAt: Date.now(),
      };
    setActiveRingingAlarm(alarmToRing);
  };

  // Snooze and Dismiss actions
  const handleSnooze = (alarmId: string, snoozeMinutes: number = 5) => {
    audioEngine.stop();
    setActiveRingingAlarm(null);

    if (!currentUserEmail) return;

    const now = new Date();
    const snoozedTime = new Date(now.getTime() + snoozeMinutes * 60 * 1000);

    let hours = snoozedTime.getHours();
    const ampm: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const newHour = hours.toString().padStart(2, '0');
    const newMinute = snoozedTime.getMinutes().toString().padStart(2, '0');

    const dayIndex = snoozedTime.getDay();
    const dayNames = [
      'रविवार (Sunday)',
      'सोमवार (Monday)',
      'मंगलवार (Tuesday)',
      'बुधवार (Wednesday)',
      'गुरुवार (Thursday)',
      'शुक्रवार (Friday)',
      'शनिवार (Saturday)',
    ];
    const newDay = dayNames[dayIndex];

    setUserAlarms((prev) => {
      const list = prev[currentUserEmail] || [];
      const updated = list.map((a) => {
        if (a.id === alarmId) {
          const newTimeString = `${a.day === 'प्रतिदिन (Every Day)' ? 'प्रतिदिन (Every Day)' : newDay}, ${newHour}:${newMinute} ${ampm}`;
          return {
            ...a,
            hour: newHour,
            minute: newMinute,
            ampm: ampm,
            time: newTimeString,
            enabled: true,
          };
        }
        return a;
      });
      return { ...prev, [currentUserEmail]: updated };
    });

    setTimeout(() => {
      setUserAlarms((currentMap) => {
        if (!currentUserEmail) return currentMap;
        const list = currentMap[currentUserEmail] || [];
        const found = list.find((a) => a.id === alarmId);
        if (found && found.enabled) {
          setActiveRingingAlarm(found);
          audioEngine.play(DEFAULT_RINGTONE, true);
        }
        return currentMap;
      });
    }, snoozeMinutes * 60 * 1000);
  };

  const handleDismiss = () => {
    audioEngine.stop();
    setActiveRingingAlarm(null);
  };

  return (
    <DeviceFrameWrapper
      isHindi={isHindi}
      onTriggerTestAlarm={() => handleTriggerTestAlarm()}
    >
      {currentScreen === 'login' && (
        <LoginScreen
          onLogin={handleLogin}
          onNavigateToRegister={() => setCurrentScreen('register')}
          onNavigateToForgotPassword={() => setShowForgotPassword(true)}
          isHindi={isHindi}
          onToggleLanguage={() => setIsHindi(!isHindi)}
        />
      )}

      {currentScreen === 'register' && (
        <RegisterScreen
          onRegister={handleRegister}
          onBackToLogin={() => setCurrentScreen('login')}
          isHindi={isHindi}
        />
      )}

      {currentScreen === 'home' && currentUserEmail && (
        <HomeScreen
          userEmail={currentUserEmail}
          alarms={currentAlarms}
          onAddAlarm={() => {
            setAlarmToEdit(null);
            setIsCreateAlarmOpen(true);
          }}
          onEditAlarm={handleEditAlarm}
          onDeleteAlarm={handleDeleteAlarm}
          onToggleAlarm={handleToggleAlarm}
          onTriggerTestAlarm={handleTriggerTestAlarm}
          onQuickAddOneMinAlarm={handleQuickAddOneMinAlarm}
          onLogout={handleLogout}
          isHindi={isHindi}
          onToggleLanguage={() => setIsHindi(!isHindi)}
        />
      )}

      {/* Standard Native System Permission Dialog (like WhatsApp/Instagram/Gemini) */}
      <NativePermissionDialog
        isOpen={showNativePermissionDialog}
        onClose={() => setShowNativePermissionDialog(false)}
        isHindi={isHindi}
      />

      {/* Forgot Password Modal with 6-digit verification code */}
      {showForgotPassword && (
        <ForgotPasswordModal
          registeredUsers={registeredUsers}
          onSavePassword={handleSavePassword}
          onClose={() => setShowForgotPassword(false)}
          isHindi={isHindi}
        />
      )}

      {/* Create / Edit Alarm Bottom Sheet */}
      {isCreateAlarmOpen && (
        <CreateAlarmSheet
          existingAlarm={alarmToEdit}
          onSave={handleSaveAlarm}
          onClose={() => {
            setIsCreateAlarmOpen(false);
            setAlarmToEdit(null);
          }}
          isHindi={isHindi}
        />
      )}

      {/* Real-world Auto-Triggered Alarm Ringing Modal */}
      {activeRingingAlarm && (
        <AlarmRingingModal
          alarm={activeRingingAlarm}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
          isHindi={isHindi}
        />
      )}
    </DeviceFrameWrapper>
  );
}
