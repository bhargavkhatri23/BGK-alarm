import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { AlarmItem } from '../types/alarm';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firebaseService = {
  async saveUser(email: string) {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}`;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
      } else {
        await updateDoc(userRef, {
          lastLogin: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getUserAlarms(): Promise<AlarmItem[]> {
    if (!auth.currentUser) return [];
    const path = `users/${auth.currentUser.uid}/alarms`;
    try {
      const alarmsRef = collection(db, 'users', auth.currentUser.uid, 'alarms');
      const q = query(alarmsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as AlarmItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async saveAlarm(alarm: AlarmItem) {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/alarms/${alarm.id}`;
    try {
      const alarmRef = doc(db, 'users', auth.currentUser.uid, 'alarms', alarm.id);
      await setDoc(alarmRef, {
        ...alarm,
        userId: auth.currentUser.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteAlarm(alarmId: string) {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/alarms/${alarmId}`;
    try {
      const alarmRef = doc(db, 'users', auth.currentUser.uid, 'alarms', alarmId);
      await deleteDoc(alarmRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async updateAlarmToggle(alarmId: string, enabled: boolean) {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/alarms/${alarmId}`;
    try {
      const alarmRef = doc(db, 'users', auth.currentUser.uid, 'alarms', alarmId);
      await updateDoc(alarmRef, { enabled });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};
