/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlarmItem } from './types/alarm';
import { DEFAULT_RINGTONE } from './utils/constants';
import { audioEngine } from './utils/audioEngine';
import { backgroundTimer } from './utils/backgroundTimer';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { HomeScreen } from './components/HomeScreen';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { CreateAlarmSheet } from './components/CreateAlarmSheet';
import { AlarmRingingModal } from './components/AlarmRingingModal';
import { DeviceFrameWrapper } from './components/DeviceFrameWrapper';
import { MandatoryPermissionModal } from './components/MandatoryPermissionModal';
import { notificationService, PermissionStatusResult } from './utils/notificationService';
import { nativeAlarmService } from './utils/nativeAlarm';
import { whatsappApiService } from './utils/whatsappApiService';
import { WhatsAppApiSettingsModal } from './components/WhatsAppApiSettingsModal';
import { LocalNotifications } from '@capacitor/local-notifications';

// Firebase Imports
import { auth } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { firebaseService } from './utils/firebaseService';

export default function App() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentAlarms, setCurrentAlarms] = useState<AlarmItem[]>([]);
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'home'>('login');
  const [isHindi, setIsHindi] = useState<boolean>(true);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [isCreateAlarmOpen, setIsCreateAlarmOpen] = useState<boolean>(false);
  const [alarmToEdit, setAlarmToEdit] = useState<AlarmItem | null>(null);
  const [activeRingingAlarm, setActiveRingingAlarm] = useState<AlarmItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deviceContacts, setDeviceContacts] = useState<Array<{ name: string; phoneNumber: string }>>([]);

  useEffect(() => {
    nativeAlarmService.getDeviceContacts().then((list) => {
      if (list && list.length > 0) {
        setDeviceContacts(list);
      }
    }).catch(() => {});
  }, []);

  // 2 Mandatory Permissions: Notification & Display Over Other Apps
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatusResult>({
    notificationsGranted: false,
    overlayPermissionGranted: false,
    allMandatoryGranted: false,
  });

  const checkPermissions = useCallback(async (): Promise<PermissionStatusResult> => {
    const status = await notificationService.checkSystemStatus();
    setPermissionStatus(status);
    return status;
  }, []);

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserEmail(user.email);
        setCurrentScreen('home');
        // Fetch Alarms from Firestore
        const alarms = await firebaseService.getUserAlarms();
        setCurrentAlarms(alarms);
        // Verify mandatory permissions
        await checkPermissions();
        if (alarms.some(a => a.enabled)) {
          notificationService.enableBackgroundProtection(true);
        }
      } else {
        setCurrentUserEmail(null);
        setCurrentScreen('login');
        setCurrentAlarms([]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [checkPermissions]);

  // Handle App Focus / Resume to re-check permissions immediately when user returns from Settings
  useEffect(() => {
    const onVisibilityOrFocusChange = () => {
      if (currentUserEmail) {
        checkPermissions();
      }
    };
    window.addEventListener('focus', onVisibilityOrFocusChange);
    document.addEventListener('visibilitychange', onVisibilityOrFocusChange);
    return () => {
      window.removeEventListener('focus', onVisibilityOrFocusChange);
      document.removeEventListener('visibilitychange', onVisibilityOrFocusChange);
    };
  }, [currentUserEmail, checkPermissions]);

  // Audio Context unlocker
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

  // Sync alarms with native OS notifications
  useEffect(() => {
    if (currentUserEmail && currentAlarms.length >= 0) {
      notificationService.syncAlarms(currentAlarms);
      // Enable persistent protection if there are any alarms
      if (currentAlarms.some(a => a.enabled)) {
        notificationService.enableBackgroundProtection(true);
      }
    }
  }, [currentUserEmail, currentAlarms]);

  // Listen for notification taps
  useEffect(() => {
    let sub: Promise<any>;
    sub = LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const alarmId = action.notification.extra?.alarmId;
      if (alarmId && currentUserEmail) {
        const alarm = currentAlarms.find(a => a.id === alarmId);
        if (alarm) {
          setActiveRingingAlarm(alarm);
        }
      }
    });
    return () => {
      sub.then(s => s.remove());
    };
  }, [currentUserEmail, currentAlarms]);

  const handleRequestNotifications = async () => {
    await notificationService.requestNotificationPermission();
    setTimeout(() => {
      checkPermissions();
    }, 800);
  };

  const handleRequestOverlay = async () => {
    await notificationService.triggerOverlayPermission();
    setTimeout(() => {
      checkPermissions();
    }, 1500);
  };

  // ================= FOREGROUND / BACKGROUND PERSISTENCE & TIMER =================
  const triggeredAlarmsMapRef = useRef<Map<string, number>>(new Map());

  const checkAlarms = useCallback(() => {
    if (!currentUserEmail) return;

    const now = new Date();
    const dayIndex = now.getDay();
    const dayNames = [
      'रविवार (Sunday)', 'सोमवार (Monday)', 'मंगलवार (Tuesday)', 'बुधवार (Wednesday)',
      'गुरुवार (Thursday)', 'शुक्रवार (Friday)', 'शनिवार (Saturday)',
    ];
    const currentDay = dayNames[dayIndex];
    const currentDayShort = currentDay.split(' ')[0];

    let hours = now.getHours();
    const ampm: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHour = hours.toString().padStart(2, '0');
    const formattedMinute = now.getMinutes().toString().padStart(2, '0');

    for (const alarm of currentAlarms) {
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
          setActiveRingingAlarm(alarm);
          audioEngine.play(DEFAULT_RINGTONE, true);

          // Automated WhatsApp Message API Dispatch (Without Manual User Intervention)
          if (alarm.whatsappContactNumber && alarm.whatsappMessage) {
            whatsappApiService.sendAutomatedWhatsAppMessage({
              phoneNumber: alarm.whatsappContactNumber,
              message: alarm.whatsappMessage,
              recipientName: alarm.whatsappContactName,
              alarmTask: alarm.task,
            }).then(result => {
              if (result.success) {
                console.log(`WhatsApp API message sent automatically to ${alarm.whatsappContactNumber} via ${result.provider}`);
              } else {
                console.warn('WhatsApp API message automated dispatch notice:', result.error);
              }
            });
          }

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`BGK SMART ALARM: ${alarm.task}`, {
                body: `समय: ${alarm.time} | अलार्म बज रहा है!`,
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
  }, [currentUserEmail, currentAlarms]);

  useEffect(() => {
    const unsubscribe = backgroundTimer.subscribe(checkAlarms);
    return () => unsubscribe();
  }, [checkAlarms]);

  // Authentication Handlers
  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      await firebaseService.saveUser(email.trim());
      // Recheck permissions after login
      await checkPermissions();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const handleRegister = async (email: string, pass: string): Promise<boolean> => {
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await firebaseService.saveUser(email.trim());
      await checkPermissions();
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const handleSavePassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    audioEngine.stop();
    setActiveRingingAlarm(null);
    notificationService.enableBackgroundProtection(false);
    await signOut(auth);
  };

  // Alarm Management Handlers
  const handleSaveAlarm = async (alarmData: {
    task: string;
    day: string;
    hour: string;
    minute: string;
    ampm: 'AM' | 'PM';
    ringtone: string;
    callContactName?: string;
    callContactNumber?: string;
    whatsappContactName?: string;
    whatsappContactNumber?: string;
    whatsappMessage?: string;
  }) => {
    if (!currentUserEmail) return;

    // Verify mandatory permissions before saving
    const currentPerm = await checkPermissions();
    if (!currentPerm.allMandatoryGranted) {
      return;
    }

    const timeString = `${alarmData.day}, ${alarmData.hour}:${alarmData.minute} ${alarmData.ampm}`;

    if (alarmToEdit) {
      const updatedAlarm: AlarmItem = {
        ...alarmToEdit,
        ...alarmData,
        ringtone: DEFAULT_RINGTONE,
        time: timeString,
        callContactName: alarmData.callContactName || '',
        callContactNumber: alarmData.callContactNumber || '',
        whatsappContactName: alarmData.whatsappContactName || '',
        whatsappContactNumber: alarmData.whatsappContactNumber || '',
        whatsappMessage: alarmData.whatsappMessage || '',
      };
      await firebaseService.saveAlarm(updatedAlarm);
      setCurrentAlarms(prev => prev.map(a => a.id === updatedAlarm.id ? updatedAlarm : a));
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
        callContactName: alarmData.callContactName || '',
        callContactNumber: alarmData.callContactNumber || '',
        whatsappContactName: alarmData.whatsappContactName || '',
        whatsappContactNumber: alarmData.whatsappContactNumber || '',
        whatsappMessage: alarmData.whatsappMessage || '',
        createdAt: Date.now(),
      };
      await firebaseService.saveAlarm(newAlarm);
      setCurrentAlarms(prev => [newAlarm, ...prev]);
    }

    setIsCreateAlarmOpen(false);
    setAlarmToEdit(null);
  };

  const handleQuickAddOneMinAlarm = async () => {
    if (!currentUserEmail) return;

    const currentPerm = await checkPermissions();
    if (!currentPerm.allMandatoryGranted) {
      return;
    }

    const now = new Date();
    const nextMin = new Date(now.getTime() + 60 * 1000);

    let hours = nextMin.getHours();
    const ampm: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hourStr = hours.toString().padStart(2, '0');
    const minuteStr = nextMin.getMinutes().toString().padStart(2, '0');

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

    await firebaseService.saveAlarm(newAlarm);
    setCurrentAlarms(prev => [newAlarm, ...prev]);
  };

  const handleEditAlarm = (alarm: AlarmItem) => {
    if (!permissionStatus.allMandatoryGranted) return;
    setAlarmToEdit(alarm);
    setIsCreateAlarmOpen(true);
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    if (!currentUserEmail) return;
    await firebaseService.deleteAlarm(alarmId);
    setCurrentAlarms(prev => prev.filter(a => a.id !== alarmId));
  };

  const handleToggleAlarm = async (alarmId: string) => {
    if (!currentUserEmail) return;
    if (!permissionStatus.allMandatoryGranted) {
      await checkPermissions();
      return;
    }
    const alarm = currentAlarms.find(a => a.id === alarmId);
    if (!alarm) return;
    
    const newStatus = !alarm.enabled;
    await firebaseService.updateAlarmToggle(alarmId, newStatus);
    setCurrentAlarms(prev => prev.map(a => a.id === alarmId ? { ...a, enabled: newStatus } : a));
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

  const handleSnooze = async (alarmId: string, snoozeMinutes: number = 5) => {
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
      'रविवार (Sunday)', 'सोमवार (Monday)', 'मंगलवार (Tuesday)', 'बुधवार (Wednesday)',
      'गुरुवार (Thursday)', 'शुक्रवार (Friday)', 'शनिवार (Saturday)',
    ];
    const newDay = dayNames[dayIndex];

    const updatedAlarm: AlarmItem = {
      ...currentAlarms.find(a => a.id === alarmId)!,
      hour: newHour,
      minute: newMinute,
      ampm: ampm,
      time: `${currentAlarms.find(a => a.id === alarmId)!.day === 'प्रतिदिन (Every Day)' ? 'प्रतिदिन (Every Day)' : newDay}, ${newHour}:${newMinute} ${ampm}`,
      enabled: true,
    };

    await firebaseService.saveAlarm(updatedAlarm);
    setCurrentAlarms(prev => prev.map(a => a.id === alarmId ? updatedAlarm : a));
  };

  const handleDismiss = () => {
    audioEngine.stop();
    setActiveRingingAlarm(null);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#070B12] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00FF66] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DeviceFrameWrapper>
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
        <>
          {/* If mandatory permissions are NOT granted yet, show blocking popup and disable home interaction */}
          {!permissionStatus.allMandatoryGranted && (
            <MandatoryPermissionModal
              status={permissionStatus}
              onRequestNotifications={handleRequestNotifications}
              onRequestOverlay={handleRequestOverlay}
              onRecheck={async () => {
                await checkPermissions();
              }}
              isHindi={isHindi}
            />
          )}

          <HomeScreen
            userEmail={currentUserEmail}
            alarms={currentAlarms}
            permissionStatus={permissionStatus}
            contacts={deviceContacts}
            onSaveVoiceAlarm={handleSaveAlarm}
            onAddAlarm={() => {
              if (!permissionStatus.allMandatoryGranted) {
                checkPermissions();
                return;
              }
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
            activeRingingAlarm={activeRingingAlarm}
            onDismissRingingAlarm={handleDismiss}
          />
        </>
      )}

      {showForgotPassword && (
        <ForgotPasswordModal
          registeredUsers={{}}
          onSavePassword={handleSavePassword}
          onClose={() => setShowForgotPassword(false)}
          isHindi={isHindi}
        />
      )}

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
