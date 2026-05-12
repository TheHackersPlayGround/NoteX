import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@notex_sync_queue';

const CACHE_MAP = {
  task:     '@cache_tasks',
  note:     '@cache_notes',
  category: '@cache_categories',
};

// ── Temp ID helpers ────────────────────────────────────────────────────────────
export function generateTempId() {
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
export function isTempId(id) {
  return typeof id === 'string' && id.startsWith('tmp_');
}

// ── Queue storage ──────────────────────────────────────────────────────────────
export async function getQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveQueue(q) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export async function clearQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function getPendingCount() {
  const q = await getQueue();
  return q.length;
}

/**
 * Add an operation to the queue with smart merging:
 * - UPDATE on a temp item → merge into its CREATE op (one round-trip)
 * - DELETE on a temp item → cancel the CREATE op (no round-trip needed)
 */
export async function enqueueOp(op) {
  const q = await getQueue();

  if (op.type === 'update' && isTempId(op.data.id)) {
    const idx = q.findIndex(o => o.type === 'create' && o.entity === op.entity && o.data.id === op.data.id);
    if (idx !== -1) {
      q[idx].data = { ...q[idx].data, ...op.data };
      await saveQueue(q);
      return;
    }
  }

  if (op.type === 'delete' && isTempId(op.data.id)) {
    const idx = q.findIndex(o => o.type === 'create' && o.entity === op.entity && o.data.id === op.data.id);
    if (idx !== -1) {
      q.splice(idx, 1);
      await saveQueue(q);
      return;
    }
  }

  q.push(op);
  await saveQueue(q);
}

// ── Optimistic cache update ────────────────────────────────────────────────────
export async function applyToCache(entity, type, data) {
  const key = CACHE_MAP[entity];
  if (!key) return;
  try {
    const raw   = await AsyncStorage.getItem(key);
    let items   = raw ? JSON.parse(raw) : [];

    if (type === 'create')       items = [data, ...items];
    else if (type === 'update')  items = items.map(i => i.id === data.id ? { ...i, ...data } : i);
    else if (type === 'delete')  items = items.filter(i => i.id !== data.id);

    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch {}
}

// Update cache with server result (replace temp ID or update existing)
export async function reconcileCache(entity, tempId, serverItem) {
  const key = CACHE_MAP[entity];
  if (!key) return;
  try {
    const raw   = await AsyncStorage.getItem(key);
    let items   = raw ? JSON.parse(raw) : [];
    items = items.map(i => i.id === tempId ? { ...serverItem, _pendingSync: false } : i);
    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch {}
}
