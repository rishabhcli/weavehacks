import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { api } from '@/lib/api/client';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Check current permission status
    checkPermissionStatus();

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // Handle notification tap - could navigate to specific run
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setIsEnabled(status === 'granted');

      if (status === 'granted') {
        const token = await registerForPushNotifications();
        setExpoPushToken(token);
      }
    } catch (err) {
      console.error('Error checking permission:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const registerForPushNotifications = async (): Promise<string | null> => {
    if (!Device.isDevice) {
      setError('Push notifications require a physical device');
      return null;
    }

    try {
      // Get the project ID from expo-constants
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn('No EAS project ID found, using default');
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: projectId || undefined,
      });

      // Register token with our backend
      await api.registerPushToken(token, Platform.OS);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
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

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setError('Permission not granted');
        setIsEnabled(false);
        return false;
      }

      const token = await registerForPushNotifications();
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
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Immediate
  });
}
