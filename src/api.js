import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { generateTempId, enqueueOp, applyToCache } from './offlineQueue';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.32/api';

// ── Connectivity check ────────────────────────────────────────────────────────
async function isOnline() {
  try {
    const s = await NetInfo.fetch();
    return s.isConnected === true && s.isInternetReachable !== false;
  } catch { return true; }
}

// ── Token helpers ─────────────────────────────────────────────────────────────
export async function getSession() {
  const raw = await AsyncStorage.getItem('@notex_session');
  return raw ? JSON.parse(raw) : null;
}

async function saveSession(session) {
  await AsyncStorage.setItem('@notex_session', JSON.stringify(session));
}

async function clearSession() {
  await AsyncStorage.removeItem('@notex_session');
}

async function authHeaders() {
  const session = await getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

// ── Offline Cache Helper ──────────────────────────────────────────────────────
// NOTE: Always set options.method explicitly for non-GET calls to avoid
// accidental cache writes from ambiguous requests.
async function fetchWithCache(url, options = {}, cacheKey) {
  const isGet = !options.method || options.method === 'GET';
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error('HTTP status ' + res.status);
    const data = await res.json();
    if (isGet) {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    }
    return data;
  } catch (error) {
    if (isGet) {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    }
    throw error;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/auth.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed.');
  await saveSession(data);
  return data;
}

export async function register(username, password) {
  const res = await fetch(`${BASE_URL}/auth.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed.');
  await saveSession(data);
  return data;
}

export async function logout() {
  await clearSession();
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetch(`${BASE_URL}/auth.php`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ action: 'change_password', current_password: currentPassword, new_password: newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to change password.');
  return data;
}



// ── Tasks ─────────────────────────────────────────────────────────────────────
const TASKS_URL = `${BASE_URL}/tasks.php`;

export async function fetchTasks() {
  return await fetchWithCache(TASKS_URL, { headers: await authHeaders() }, '@cache_tasks');
}

export async function createTask(title, details = '', dueDate = null, isPinned = false) {
  if (!(await isOnline())) {
    const item = { id: generateTempId(), title, details: details||'', dueDate: dueDate||null,
                   isPinned, isCompleted: false, createdAt: new Date().toISOString(), _pendingSync: true };
    await applyToCache('task', 'create', item);
    await enqueueOp({ type: 'create', entity: 'task', data: item });
    return item;
  }
  const res = await fetch(TASKS_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ title, details, dueDate, isPinned }),
  });
  if (!res.ok) throw new Error('Failed to create task.');
  await AsyncStorage.removeItem('@cache_tasks');
  return res.json();
}

export async function updateTask(task) {
  if (!(await isOnline())) {
    await applyToCache('task', 'update', task);
    await enqueueOp({ type: 'update', entity: 'task', data: task });
    return { ...task, _pendingSync: true };
  }
  const res = await fetch(TASKS_URL, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to update task.');
  await AsyncStorage.removeItem('@cache_tasks');
  return res.json();
}

export async function deleteTask(id) {
  if (!(await isOnline())) {
    await applyToCache('task', 'delete', { id });
    await enqueueOp({ type: 'delete', entity: 'task', data: { id } });
    return { success: true };
  }
  const res = await fetch(TASKS_URL, {
    method: 'DELETE',
    headers: await authHeaders(),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete task.');
  await AsyncStorage.removeItem('@cache_tasks');
  return res.json();
}

// ── Notes ─────────────────────────────────────────────────────────────────────
const NOTES_URL = `${BASE_URL}/notes.php`;

export async function fetchNotes() {
  return await fetchWithCache(NOTES_URL, { headers: await authHeaders() }, '@cache_notes');
}

export async function createNote(title, body = '', color = '#ffffff', categoryId = null, isPinned = false) {
  if (!(await isOnline())) {
    const item = { id: generateTempId(), title, body: body||'', color, category_id: categoryId,
                   isPinned, createdAt: new Date().toISOString(), _pendingSync: true };
    await applyToCache('note', 'create', item);
    await enqueueOp({ type: 'create', entity: 'note', data: item });
    return item;
  }
  const res = await fetch(NOTES_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ title, body, color, category_id: categoryId, isPinned }),
  });
  if (!res.ok) throw new Error('Failed to create note.');
  await AsyncStorage.removeItem('@cache_notes');
  return res.json();
}

export async function updateNote(note) {
  if (!(await isOnline())) {
    await applyToCache('note', 'update', note);
    await enqueueOp({ type: 'update', entity: 'note', data: note });
    return { ...note, _pendingSync: true };
  }
  const res = await fetch(NOTES_URL, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error('Failed to update note.');
  await AsyncStorage.removeItem('@cache_notes');
  return res.json();
}

export async function deleteNote(id) {
  if (!(await isOnline())) {
    await applyToCache('note', 'delete', { id });
    await enqueueOp({ type: 'delete', entity: 'note', data: { id } });
    return { success: true };
  }
  const res = await fetch(NOTES_URL, {
    method: 'DELETE',
    headers: await authHeaders(),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete note.');
  await AsyncStorage.removeItem('@cache_notes');
  return res.json();
}

// ── Categories ───────────────────────────────────────────────────────────────
const CATS_URL = `${BASE_URL}/categories.php`;

export async function fetchCategories() {
  return await fetchWithCache(CATS_URL, { headers: await authHeaders() }, '@cache_categories');
}

export async function createCategory(name, color = '#6C63FF') {
  if (!(await isOnline())) {
    const item = { id: generateTempId(), name, color, createdAt: new Date().toISOString(), _pendingSync: true };
    await applyToCache('category', 'create', item);
    await enqueueOp({ type: 'create', entity: 'category', data: item });
    return item;
  }
  const res = await fetch(CATS_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) throw new Error('Failed to create category.');
  await AsyncStorage.removeItem('@cache_categories');
  return res.json();
}



export async function deleteCategory(id) {
  if (!(await isOnline())) {
    await applyToCache('category', 'delete', { id });
    await enqueueOp({ type: 'delete', entity: 'category', data: { id } });
    return { success: true };
  }
  const res = await fetch(CATS_URL, {
    method: 'DELETE',
    headers: await authHeaders(),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete category.');
  await AsyncStorage.removeItem('@cache_categories');
  return res.json();
}

// ── TRASH ──────────────────────────────────────────────────────────────────
export async function fetchTrash() {
  const headers = await authHeaders();
  try {
    const [t, n, c] = await Promise.all([
      fetch(TASKS_URL + '?trash=true', { headers }).then(r => r.json()),
      fetch(NOTES_URL + '?trash=true', { headers }).then(r => r.json()),
      fetch(CATS_URL + '?trash=true', { headers }).then(r => r.json()),
    ]);
    const data = { tasks: Array.isArray(t) ? t : [], notes: Array.isArray(n) ? n : [], categories: Array.isArray(c) ? c : [] };
    await AsyncStorage.setItem('@cache_trash', JSON.stringify(data));
    return data;
  } catch (error) {
    const cached = await AsyncStorage.getItem('@cache_trash');
    if (cached) return JSON.parse(cached);
    throw error;
  }
}

export async function restoreItem(type, id) {
  const URL = type === 'task' ? TASKS_URL : type === 'note' ? NOTES_URL : CATS_URL;
  const res = await fetch(URL, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify({ id, restore: true })
  });
  if (!res.ok) throw new Error('Failed to restore item.');
  return res.json();
}

export async function forceDeleteItem(type, id) {
  const URL = type === 'task' ? TASKS_URL : type === 'note' ? NOTES_URL : CATS_URL;
  const res = await fetch(URL, {
    method: 'DELETE',
    headers: await authHeaders(),
    body: JSON.stringify({ id, force: true })
  });
  if (!res.ok) throw new Error('Failed to permanently delete item.');
  return res.json();
}
