import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://172.77.4.36';

// ── Token helpers ─────────────────────────────────────────────────────────────
export async function getSession() {
  const raw = await AsyncStorage.getItem('@notex_session');
  return raw ? JSON.parse(raw) : null;
}

export async function saveSession(session) {
  await AsyncStorage.setItem('@notex_session', JSON.stringify(session));
}

export async function clearSession() {
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

export async function googleLogin(accessToken) {
  const res = await fetch(`${BASE_URL}/google_auth.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken, provider: 'google' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Google sign-in failed.');
  await saveSession(data);
  return data;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
const TASKS_URL = `${BASE_URL}/tasks.php`;

export async function fetchTasks() {
  return await fetchWithCache(TASKS_URL, { headers: await authHeaders() }, '@cache_tasks');
}

export async function createTask(title, details = '', dueDate = null, isPinned = false) {
  const res = await fetch(TASKS_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ title, details, dueDate, isPinned }),
  });
  if (!res.ok) throw new Error('Failed to create task.');
  await AsyncStorage.removeItem('@cache_tasks'); // invalidate stale cache
  return res.json();
}

export async function updateTask(task) {
  const res = await fetch(TASKS_URL, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to update task.');
  await AsyncStorage.removeItem('@cache_tasks'); // invalidate stale cache
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(TASKS_URL, {
    method: 'DELETE',
    headers: await authHeaders(),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete task.');
  await AsyncStorage.removeItem('@cache_tasks'); // invalidate stale cache
  return res.json();
}

// ── Notes ─────────────────────────────────────────────────────────────────────
const NOTES_URL = `${BASE_URL}/notes.php`;

export async function fetchNotes() {
  return await fetchWithCache(NOTES_URL, { headers: await authHeaders() }, '@cache_notes');
}

export async function createNote(title, body = '', color = '#ffffff', categoryId = null, isPinned = false) {
  const res = await fetch(NOTES_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ title, body, color, category_id: categoryId, isPinned }),
  });
  if (!res.ok) throw new Error('Failed to create note.');
  await AsyncStorage.removeItem('@cache_notes'); // invalidate stale cache
  return res.json();
}

export async function updateNote(note) {
  const res = await fetch(NOTES_URL, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error('Failed to update note.');
  await AsyncStorage.removeItem('@cache_notes'); // invalidate stale cache
  return res.json();
}

export async function deleteNote(id) {
  const res = await fetch(NOTES_URL, {
    method: 'DELETE',
    headers: await authHeaders(),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete note.');
  await AsyncStorage.removeItem('@cache_notes'); // invalidate stale cache
  return res.json();
}

// ── Categories ───────────────────────────────────────────────────────────────
const CATS_URL = `${BASE_URL}/categories.php`;

export async function fetchCategories() {
  return await fetchWithCache(CATS_URL, { headers: await authHeaders() }, '@cache_categories');
}

export async function createCategory(name, color = '#6C63FF') {
  const res = await fetch(CATS_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) throw new Error('Failed to create category.');
  await AsyncStorage.removeItem('@cache_categories'); // invalidate stale cache
  return res.json();
}

export async function updateCategory(cat) {
  const res = await fetch(CATS_URL, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(cat),
  });
  if (!res.ok) throw new Error('Failed to update category.');
  await AsyncStorage.removeItem('@cache_categories'); // invalidate stale cache
  return res.json();
}

export async function deleteCategory(id) {
  const res = await fetch(CATS_URL, {
    method: 'DELETE',
    headers: await authHeaders(),
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete category.');
  await AsyncStorage.removeItem('@cache_categories'); // invalidate stale cache
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
