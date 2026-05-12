import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Only show alerts for foreground notifications — local only, no remote push
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
});

// Check if we're running in Expo Go (local notifications still work, remote don't)
function isExpoGo() {
  return Constants.executionEnvironment === 'storeClient';
}

// Request permission for local notifications
export async function requestNotificationPermission() {
  if (!Device.isDevice) return false;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// Schedule a local notification at the task's due date/time
export async function scheduleTaskNotification(taskId, title, dueDate) {
  try {
    const trigger = new Date(dueDate.replace(' ', 'T')); // treat as local time, not UTC
    if (trigger <= new Date()) return null; // already past

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Due',
        body:  title,
        data:  { taskId },
        sound: true,
      },
      trigger,
    });

    return id;
  } catch {
    return null;
  }
}

// Cancel a specific scheduled notification
export async function cancelTaskNotification(notificationId) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {}
}

// Cancel all scheduled notifications (on logout)
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

// Fire an immediate local notification for network status changes
export async function sendNetworkNotification(isOnline) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: isOnline ? 'Back Online — Sync Now' : 'No Internet Connection',
        body:  isOnline
          ? 'Connection restored! Pull to refresh your Tasks & Notes to sync the latest data.'
          : 'You are offline. Tasks, Notes & Categories are still available from local cache.',
        sound: true,
        data:  { type: 'network', isOnline },
      },
      trigger: null, // immediate
    });
  } catch {}
}
