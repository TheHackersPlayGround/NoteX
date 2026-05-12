import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Returns { isConnected, isInternetReachable }
 * isConnected       — device is on a network (WiFi/mobile)
 * isInternetReachable — the network actually reaches the internet
 *
 * null means "not yet determined". Treat null as connected to avoid
 * flashing the banner on first render.
 */
export default function useNetworkStatus() {
  const [status, setStatus] = useState({ isConnected: true, isInternetReachable: true });

  useEffect(() => {
    // Fetch current state immediately
    NetInfo.fetch().then(state => {
      setStatus({
        isConnected:        state.isConnected        ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
      });
    });

    // Subscribe to future changes
    const unsub = NetInfo.addEventListener(state => {
      setStatus({
        isConnected:        state.isConnected        ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
      });
    });

    return unsub;
  }, []);

  const offline = status.isConnected === false || status.isInternetReachable === false;

  return { ...status, offline };
}
