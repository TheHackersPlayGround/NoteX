/**
 * syncManager.js
 * Replays the offline queue against the real API once the device is back online.
 * Imported by App.js — triggered on reconnect.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getQueue, saveQueue, isTempId, reconcileCache } from './offlineQueue';
import { getSession } from './api';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.32/api';

const URL_MAP = {
  task:     `${BASE_URL}/tasks.php`,
  note:     `${BASE_URL}/notes.php`,
  category: `${BASE_URL}/categories.php`,
};

const CACHE_MAP = {
  task:     '@cache_tasks',
  note:     '@cache_notes',
  category: '@cache_categories',
};

async function getHeaders() {
  const session = await getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

async function updateCacheItem(entity, updater) {
  const key = CACHE_MAP[entity];
  if (!key) return;
  const raw   = await AsyncStorage.getItem(key);
  const items = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(key, JSON.stringify(updater(items)));
}

/**
 * Process every pending operation in order.
 * Returns { synced, failed }
 */
export async function processQueue() {
  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const headers = await getHeaders();
  const idMap   = {};   // tempId -> real server id
  const remaining = [];
  let synced = 0;
  let failed = 0;

  for (const op of queue) {
    try {
      const url = URL_MAP[op.entity];
      if (!url) { remaining.push(op); continue; }

      // Resolve temp IDs in payload
      let data = { ...op.data };
      if (data.id          && idMap[data.id])          data.id          = idMap[data.id];
      if (data.category_id && idMap[data.category_id]) data.category_id = idMap[data.category_id];

      if (op.type === 'create') {
        const tempId         = op.data.id;
        const { id: _, ...body } = data;          // strip temp ID

        const res    = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const result = await res.json();

        idMap[tempId] = result.id;
        await reconcileCache(op.entity, tempId, result);   // replace temp item with server item

      } else if (op.type === 'update') {
        const res    = await fetch(url, { method: 'PUT',    headers, body: JSON.stringify(data) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const result = await res.json();
        await updateCacheItem(op.entity, items => items.map(i => i.id === result.id ? { ...i, ...result, _pendingSync: false } : i));

      } else if (op.type === 'delete') {
        const deleteId = idMap[data.id] ?? data.id;
        if (isTempId(deleteId)) { synced++; continue; }   // temp create was already cancelled
        const res = await fetch(url, { method: 'DELETE', headers, body: JSON.stringify({ id: deleteId }) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
      }

      synced++;
    } catch (e) {
      console.warn('[SyncManager] op failed:', op, e.message);
      failed++;
      remaining.push(op);
    }
  }

  await saveQueue(remaining);

  // Invalidate caches so fresh fetch on next load
  if (synced > 0) {
    await AsyncStorage.multiRemove(['@cache_tasks', '@cache_notes', '@cache_categories']);
  }

  return { synced, failed };
}
