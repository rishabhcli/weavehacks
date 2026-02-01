import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { api } from '@/lib/api/client';

type NotificationsModule = typeof import('expo-notifications');

interface UsePushNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  toggle: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<import('expo-notifications').Notification | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<import('expo-notifications').Subscription>();
  const responseListener = useRef<import('expo-notifications').Subscription>();

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsLoading(false);
      return;
    }

    let notifications: NotificationsModule | null = null;

    async function initialize() {
      notifications = await import('expo-notifications');

      // Configure notification handler
      notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Check current permission status
      checkPermissionStatus(notifications);

      // Set up notification listeners
      notificationListener.current = notifications.addNotificationReceivedListener((incoming) => {
        setNotification(incoming);
      });

      responseListener.current = notifications.addNotificationResponseReceivedListener((response) => {
        // Handle notification tap - could navigate to specific run
        const data = response.notification.request.content.data;
        console.log('Notification tapped:', data);
      });
    }

    initialize();

    return () => {
      if (!notifications) return;
      if (notificationListener.current) {
        notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const checkPermissionStatus = async (notifications?: NotificationsModule) => {
    try {
      const module = notifications ?? (await import('expo-notifications'));
      const { status } = await module.getPermissionsAsync();
      setIsEnabled(status === 'granted');

      if (status === 'granted') {
        const token = await registerForPushNotifications(module);
        setExpoPushToken(token);
      }
    } catch (err) {
      console.error('Error checking permission:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const registerForPushNotifications = async (
    notifications?: NotificationsModule
  ): Promise<string | null> => {
    if (!Device.isDevice) {
      setError('Push notifications require a physical device');
      return null;
    }

    try {
      const module = notifications ?? (await import('expo-notifications'));
      // Get the project ID from expo-constants
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn('No EAS project ID found, using default');
      }

      const { data: token } = await module.getExpoPushTokenAsync({
        projectId: projectId || undefined,
      });

      // Register token with our backend
      await api.registerPushToken(token, Platform.OS);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await module.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: module.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7c3aed',
        });
      }

      return token;
    } catch (err) {
      console.error('Error registering for push:', err);
      setError('Failed to register for push notifications');
      return null;
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const notifications = await import('expo-notifications');
      const { status: existingStatus } = await notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setError('Permission not granted');
        setIsEnabled(false);
        return false;
      }

      const token = await registerForPushNotifications(notifications);
      setExpoPushToken(token);
      setIsEnabled(true);
      return true;
    } catch (err) {
      console.error('Permission request error:', err);
      setError('Failed to request permission');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (isEnabled) {
      // Disable notifications (just update state, can't revoke permission)
      setIsEnabled(false);
      setExpoPushToken(null);
    } else {
      await requestPermission();
    }
  }, [isEnabled, requestPermission]);

  return {
    expoPushToken,
    notification,
    isEnabled,
    isLoading,
    error,
    toggle,
    requestPermission,
  };
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const notifications = await import('expo-notifications');
  await notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Immediate
  });
}
