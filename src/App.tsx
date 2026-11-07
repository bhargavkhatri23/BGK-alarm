/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlarmItem } from './types/alarm';
import { DEFAULT_RINGTONE } from './utils/constants';
import { audioEngine } from './utils/audioEngine';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { HomeScreen } from './components/HomeScreen';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { CreateAlarmSheet } from './components/CreateAlarmSheet';
import { DeviceFrameWrapper } from './components/DeviceFrameWrapper';
import { scheduleAlarm, cancelAlarm, ensurePermissions, isNative } from './nativeAlarm';
import NativeAlarm from './nativeAlarm';

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

/** Helper to generate unique integer id below 1,000,000,000 */
export function getNumericAlarmId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 999999999;
  }
  return Math.abs(hash) || 1;
}

/** Convert day selection string to array of numbers (1=Sunday ... 7=Saturday; empty = one-time) */
export function parseDaysToNumbers(dayString: string): number[] {
  if (dayString === 'प्रतिदिन (Every Day)') {
    return [1, 2, 3, 4, 5, 6, 7];
  }
  const map: { [key: string]: number } = {
    Sunday: 1,
    Monday: 2,
    Tuesday: 3,
    Wednesday: 4,
    Thursday: 5,
    Friday: 6,
    Saturday: 7,
  };
  for (const [key, val] of Object.entries(map)) {
    if (dayString.includes(key)) {
      return [val];
    }
  }
  return [];
}

/** Convert 12h + AM/PM to 24h */
export function parse24Hour(hourStr: string, ampm: 'AM' | 'PM'): number {
  let h = parseInt(hourStr, 10);
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h;
}

export default function App() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentAlarms, setCurrentAlarms] = useState<AlarmItem[]>([]);
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'home'>('login');
  const [isHindi, setIsHindi] = useState<boolean>(true);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [isCreateAlarmOpen, setIsCreateAlarmOpen] = useState<boolean>(false);
  const [alarmToEdit, setAlarmToEdit] = useState<AlarmItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [permissionStatus, setPermissionStatus] = useState({
    notifications: true,
    fullScreen: true,
  });
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);

  const checkAndEnsurePermissions = async (): Promise<boolean> => {
    if (!isNative()) {
      setPermissionStatus({ notifications: true, fullScreen: true });
      return true;
    }
    try {
      const res = await ensurePermissions();
      const status = await NativeAlarm.getStatus();
      setPermissionStatus(status);
      if (!res.ok) {
        setPermissionMessage(res.message || 'अलार्म के लिए अनुमति आवश्यक है।');
        return false;
      }
      setPermissionMessage(null);
      return true;
    } catch (e) {
      console.error(e);
      return true;
    }
  };

  // 1. Firebase Auth Listener & Permissions on App Start
  useEffect(() => {
    checkAndEnsurePermissions();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserEmail(user.email);
        setCurrentScreen('home');
        // Fetch Alarms from Firestore
        const alarms = await firebaseService.getUserAlarms();
        setCurrentAlarms(alarms);
        // Sync active alarms with native Android scheduler
        for (const a of alarms) {
          if (a.enabled) {
            const numId = getNumericAlarmId(a.id);
            const hour24 = parse24Hour(a.hour, a.ampm);
            const minute = parseInt(a.minute, 10);
            const days = parseDaysToNumbers(a.day);
            scheduleAlarm({
              id: numId,
              hour: hour24,
              minute: minute,
              label: a.task,
              days: days,
            }).catch(console.error);
          }
        }
      } else {
        setCurrentUserEmail(null);
        setCurrentScreen('login');
        setCurrentAlarms([]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Audio Context unlocker for preview tones
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

  // Authentication Handlers
  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      await firebaseService.saveUser(email.trim());
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
  }) => {
    if (!currentUserEmail) return;

    // Check permissions before creating/saving
    const ok = await checkAndEnsurePermissions();
    if (!ok) {
      return;
    }

    const timeString = `${alarmData.day}, ${alarmData.hour}:${alarmData.minute} ${alarmData.ampm}`;
    const hour24 = parse24Hour(alarmData.hour, alarmData.ampm);
    const minute = parseInt(alarmData.minute, 10);
    const days = parseDaysToNumbers(alarmData.day);

    if (alarmToEdit) {
      const updatedAlarm: AlarmItem = {
        ...alarmToEdit,
        ...alarmData,
        ringtone: DEFAULT_RINGTONE,
        time: timeString,
        enabled: true,
      };
      await firebaseService.saveAlarm(updatedAlarm);
      setCurrentAlarms(prev => prev.map(a => a.id === updatedAlarm.id ? updatedAlarm : a));

      // Native schedule
      const numId = getNumericAlarmId(updatedAlarm.id);
      await scheduleAlarm({
        id: numId,
        hour: hour24,
        minute: minute,
        label: updatedAlarm.task,
        days: days,
      });
    } else {
      const newId = `alarm-${Date.now()}`;
      const newAlarm: AlarmItem = {
        id: newId,
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
      await firebaseService.saveAlarm(newAlarm);
      setCurrentAlarms(prev => [newAlarm, ...prev]);

      // Native schedule
      const numId = getNumericAlarmId(newId);
      await scheduleAlarm({
        id: numId,
        hour: hour24,
        minute: minute,
        label: newAlarm.task,
        days: days,
      });
    }

    setIsCreateAlarmOpen(false);
    setAlarmToEdit(null);
  };

  const handleQuickAddOneMinAlarm = async () => {
    if (!currentUserEmail) return;

    const ok = await checkAndEnsurePermissions();
    if (!ok) return;

    const now = new Date();
    const nextMin = new Date(now.getTime() + 60 * 1000);

    let hours = nextMin.getHours();
    const ampm: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
    const hour24 = hours;
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hourStr = hours.toString().padStart(2, '0');
    const minuteStr = nextMin.getMinutes().toString().padStart(2, '0');
    const minute = nextMin.getMinutes();

    const timeString = `प्रतिदिन (Every Day), ${hourStr}:${minuteStr} ${ampm}`;
    const newId = `auto-test-${Date.now()}`;

    const newAlarm: AlarmItem = {
      id: newId,
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

    // Native schedule
    const numId = getNumericAlarmId(newId);
    await scheduleAlarm({
      id: numId,
      hour: hour24,
      minute: minute,
      label: newAlarm.task,
      days: [1, 2, 3, 4, 5, 6, 7],
    });
  };

  const handleEditAlarm = (alarm: AlarmItem) => {
    setAlarmToEdit(alarm);
    setIsCreateAlarmOpen(true);
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    if (!currentUserEmail) return;
    await firebaseService.deleteAlarm(alarmId);
    setCurrentAlarms(prev => prev.filter(a => a.id !== alarmId));

    // Native cancel
    const numId = getNumericAlarmId(alarmId);
    await cancelAlarm(numId);
  };

  const handleToggleAlarm = async (alarmId: string) => {
    if (!currentUserEmail) return;
    const alarm = currentAlarms.find(a => a.id === alarmId);
    if (!alarm) return;
    
    const newStatus = !alarm.enabled;
    await firebaseService.updateAlarmToggle(alarmId, newStatus);
    setCurrentAlarms(prev => prev.map(a => a.id === alarmId ? { ...a, enabled: newStatus } : a));

    const numId = getNumericAlarmId(alarmId);
    if (newStatus) {
      const ok = await checkAndEnsurePermissions();
      if (!ok) return;

      const hour24 = parse24Hour(alarm.hour, alarm.ampm);
      const minute = parseInt(alarm.minute, 10);
      const days = parseDaysToNumbers(alarm.day);
      await scheduleAlarm({
        id: numId,
        hour: hour24,
        minute: minute,
        label: alarm.task,
        days: days,
      });
    } else {
      await cancelAlarm(numId);
    }
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
      {/* Block Notification Permission Banner if required */}
      {permissionMessage && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 p-3 text-amber-300 text-xs text-center flex items-center justify-between z-50">
          <span>{permissionMessage}</span>
          <button
            onClick={() => checkAndEnsurePermissions()}
            className="px-2.5 py-1 bg-amber-500 text-black font-bold rounded-lg ml-2 shrink-0 cursor-pointer text-[11px]"
          >
            {isHindi ? 'अनुमति दें' : 'Allow'}
          </button>
        </div>
      )}

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
          permissionStatus={permissionStatus}
          onRefreshPermissions={checkAndEnsurePermissions}
          onAddAlarm={async () => {
            const ok = await checkAndEnsurePermissions();
            if (ok) {
              setAlarmToEdit(null);
              setIsCreateAlarmOpen(true);
            }
          }}
          onEditAlarm={async (alarm) => {
            const ok = await checkAndEnsurePermissions();
            if (ok) {
              setAlarmToEdit(alarm);
              setIsCreateAlarmOpen(true);
            }
          }}
          onDeleteAlarm={handleDeleteAlarm}
          onToggleAlarm={handleToggleAlarm}
          onQuickAddOneMinAlarm={handleQuickAddOneMinAlarm}
          onLogout={handleLogout}
          isHindi={isHindi}
          onToggleLanguage={() => setIsHindi(!isHindi)}
        />
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
    </DeviceFrameWrapper>
  );
}
