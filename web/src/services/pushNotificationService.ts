// Push Notification Service for HeyDoc Doctor Portal
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import type { Messaging } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase';

// VAPID key for web push (get this from Firebase Console > Project Settings > Cloud Messaging)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

let messaging: Messaging | null = null;

/**
 * Initialize Firebase Messaging
 */
function getMessagingInstance(): Messaging | null {
  if (messaging) return messaging;

  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return null;
  }

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('Failed to initialize Firebase Messaging:', error);
    return null;
  }
}

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const messagingInstance = getMessagingInstance();
    if (!messagingInstance) return null;

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered:', registration);

    // Get FCM token
    const token = await getToken(messagingInstance, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('FCM token obtained');
      // Register token with backend
      await registerTokenWithBackend(token);
      return token;
    }

    console.warn('No FCM token received');
    return null;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
}

/**
 * Register FCM token with backend
 */
async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    const functions = getFunctions();
    const registerFCMToken = httpsCallable(functions, 'registerFCMToken');
    await registerFCMToken({ token });
    console.log('FCM token registered with backend');
  } catch (error) {
    console.error('Failed to register FCM token with backend:', error);
  }
}

/**
 * Unregister FCM token (call on logout)
 */
export async function unregisterNotifications(token: string): Promise<void> {
  try {
    const functions = getFunctions();
    const unregisterFCMToken = httpsCallable(functions, 'unregisterFCMToken');
    await unregisterFCMToken({ token });
    console.log('FCM token unregistered');
  } catch (error) {
    console.error('Failed to unregister FCM token:', error);
  }
}

/**
 * Set up foreground message handler
 */
export function setupForegroundMessageHandler(
  onNotification: (payload: { title: string; body: string; data?: Record<string, string> }) => void
): () => void {
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) return () => {};

  const unsubscribe = onMessage(messagingInstance, (payload) => {
    console.log('Foreground message received:', payload);

    onNotification({
      title: payload.notification?.title || 'HeyDoc Notification',
      body: payload.notification?.body || 'You have a new notification',
      data: payload.data as Record<string, string>,
    });
  });

  return unsubscribe;
}

/**
 * Check if notifications are supported and enabled
 */
export function getNotificationStatus(): 'supported' | 'denied' | 'granted' | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  return 'supported';
}

/**
 * Check if push notifications are available
 */
export function isPushNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}
