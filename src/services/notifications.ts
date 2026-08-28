/** Notification center & preferences service. */
import { ENV } from '../config/env';
import type { AppNotification, NotificationPrefs } from '../models/types';
import { demo } from './firebase/demoDb';
import * as fb from './firebase/firebaseClient';
import { updateUser } from './auth';

export function subscribeNotifications(uid: string, cb: (n: AppNotification[]) => void): () => void {
  if (ENV.isDemo) {
    void demo.ready().then(() => cb(demo.notificationsFor(uid)));
    return demo.subscribe('notifications:' + uid, () => cb(demo.notificationsFor(uid)));
  }
  return fb.fbSubscribeNotifications(uid, cb);
}

export async function markNotificationRead(uid: string, id: string): Promise<void> {
  if (ENV.isDemo) {
    demo.markNotificationRead(uid, id);
    return;
  }
  await fb.fbMarkNotificationRead(id);
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  if (ENV.isDemo) {
    demo.markAllNotificationsRead(uid);
    return;
  }
  await fb.fbMarkAllNotificationsRead(uid);
}

export async function saveNotificationPrefs(uid: string, prefs: NotificationPrefs): Promise<void> {
  await updateUser(uid, { notificationPrefs: prefs });
}
