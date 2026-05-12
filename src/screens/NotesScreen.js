import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Pressable, Modal, TextInput, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator, LayoutAnimation, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchTasks, createTask, updateTask, deleteTask } from '../api';
import { scheduleTaskNotification, cancelTaskNotification } from '../notifications';
import { useTheme } from '../ThemeContext';
import { radius } from '../theme';
import useTextToSpeech from '../hooks/useTextToSpeech';
import WritingLoader from '../components/WritingLoader';

// Note: setLayoutAnimationEnabledExperimental is a no-op in the New Architecture

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDue(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr.replace(' ', 'T'));
  const now = new Date();
  const isToday    = d.toDateString() === now.toDateString();
  const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday)    return `Today ${timeStr}`;
  if (isTomorrow) return `Tomorrow ${timeStr}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + timeStr;
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr.replace(' ', 'T')) < new Date();
}

function toLocalDateTimeString(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function parseDueDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr.replace(' ', 'T'));
}

// ── Checkbox ──────────────────────────────────────────────────────────────────
function Checkbox({ checked, onPress, colors }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 2 }} activeOpacity={0.7}>
      <View style={{
        width: 24, height: 24, borderRadius: 12, borderWidth: 2,
        borderColor: checked ? colors.accent : colors.textMuted,
        backgroundColor: checked ? colors.accent : 'transparent',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <Ionicons name="checkmark" size={13} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}

// ── Active task row ───────────────────────────────────────────────────────────
function TaskRow({ task, onToggleComplete, onTogglePin, onDelete, onSpeak, onPress, colors, shadow, isSpeakingId }) {
  const overdue  = isOverdue(task.dueDate);
  const dueLabel = formatDue(task.dueDate);

  return (
    <Pressable
      style={({ pressed }) => [{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card, borderRadius: radius.md,
        paddingVertical: 14, paddingHorizontal: 14, marginBottom: 8,
        ...shadow.sm, opacity: pressed ? 0.85 : 1,
        borderLeftWidth: overdue ? 3 : 0,
        borderLeftColor: overdue ? colors.danger : 'transparent',
      }]}
      onPress={onPress}
    >
      <Checkbox checked={task.isCompleted} onPress={() => onToggleComplete(task)} colors={colors} />

      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }} numberOfLines={1}>
          {task.title || 'Untitled'}
        </Text>
        {task.details ? (
          <Text style={{ fontSize: 12, color: colors.textSecond, marginTop: 2 }} numberOfLines={1}>{task.details}</Text>
        ) : null}
        {dueLabel ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="time-outline" size={11} color={overdue ? colors.danger : colors.textSecond} />
            <Text style={{ fontSize: 11, color: overdue ? colors.danger : colors.textSecond, fontWeight: overdue ? '700' : '400' }}>
              {overdue ? `Overdue · ${dueLabel}` : dueLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity onPress={() => onTogglePin(task)} style={{ padding: 6, marginRight: 4 }} activeOpacity={0.7}>
        <Ionicons name={task.isPinned ? "pin" : "pin-outline"} size={18} color={task.isPinned ? colors.accent : colors.textMuted} />
      </TouchableOpacity>

      {/* TTS button */}
      <TouchableOpacity onPress={() => onSpeak(task)} style={{ padding: 6, marginRight: 4 }} activeOpacity={0.7}>
        <Ionicons
          name={isSpeakingId === task.id ? 'stop-circle-outline' : 'volume-high-outline'}
          size={18}
          color={isSpeakingId === task.id ? colors.accent : colors.textMuted}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onDelete(task.id)} style={{ padding: 6 }} activeOpacity={0.7}>
        <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </Pressable>
  );
}

// ── Completed task row ────────────────────────────────────────────────────────
function CompletedRow({ task, onRestore, onDelete, colors, shadow }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: radius.md,
      paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8,
      ...shadow.sm, opacity: 0.8,
    }}>
      {/* Filled checkbox */}
      <View style={{
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: colors.textMuted,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name="checkmark" size={13} color="#fff" />
      </View>

      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: colors.textMuted, textDecorationLine: 'line-through' }} numberOfLines={1}>
          {task.title || 'Untitled'}
        </Text>
        {task.details ? (
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>{task.details}</Text>
        ) : null}
      </View>

      {/* Restore */}
      <TouchableOpacity onPress={() => onRestore(task)} style={{ padding: 6, marginRight: 2 }} activeOpacity={0.7}>
        <Ionicons name="arrow-undo-outline" size={17} color={colors.accent} />
      </TouchableOpacity>
      {/* Delete */}
      <TouchableOpacity onPress={() => onDelete(task.id)} style={{ padding: 6 }} activeOpacity={0.7}>
        <Ionicons name="trash-outline" size={17} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function NotesScreen() {
  const { colors, shadow } = useTheme();
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [current, setCurrent] = useState(null);
  const [title,   setTitle]   = useState('');
  const [details, setDetails] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [saving,  setSaving]  = useState(false);

  // Completed section
  const [completedOpen, setCompletedOpen] = useState(false);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try   { setTasks(await fetchTasks()); }
    catch { Alert.alert('Error', 'Could not sync tasks.'); }
    finally { setRefreshing(false); }
  };

  // TTS
  const { speak, isSpeaking } = useTextToSpeech();
  const [speakingTaskId, setSpeakingTaskId] = useState(null);
  const speakTask = (task) => {
    if (speakingTaskId === task.id) {
      setSpeakingTaskId(null);
      speak(''); // triggers stop via toggle in hook
      return;
    }
    setSpeakingTaskId(task.id);
    const text = `${task.title || 'Untitled'}. ${task.details || ''}`;
    speak(text);
    // auto-clear the id when speech ends (hook sets isSpeaking=false)
  };

  useEffect(() => { if (!isSpeaking) setSpeakingTaskId(null); }, [isSpeaking]);

  // Date/time picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate,     setPickerDate]     = useState(new Date());

  useEffect(() => { load(); }, []);

  const load = async () => {
    try   { setTasks(await fetchTasks()); }
    catch { Alert.alert('Error', 'Could not load tasks.'); }
    finally { setLoading(false); }
  };

  const openNew = () => {
    setCurrent(null); setTitle(''); setDetails(''); setDueDate(null);
    setPickerDate(new Date()); setModal(true);
  };

  const openEdit = t => {
    setCurrent(t); setTitle(t.title); setDetails(t.details || '');
    setDueDate(t.dueDate || null);
    setPickerDate(t.dueDate ? parseDueDate(t.dueDate) : new Date());
    setModal(true);
  };

  const close = () => { setModal(false); setShowDatePicker(false); setShowTimePicker(false); };

  // ── Date picker handlers ──────────────────────────────────────────────────
  const onDateChange = (event, selected) => {
    setShowDatePicker(false);
    if (event.type === 'dismissed' || !selected) return;
    const merged = new Date(selected);
    if (dueDate) {
      const existing = parseDueDate(dueDate);
      merged.setHours(existing.getHours(), existing.getMinutes(), 0, 0);
    } else {
      merged.setHours(9, 0, 0, 0);
    }
    setPickerDate(merged);
    setDueDate(toLocalDateTimeString(merged));
    setShowTimePicker(true);
  };

  const onTimeChange = (event, selected) => {
    setShowTimePicker(false);
    if (event.type === 'dismissed' || !selected) return;
    const merged = new Date(pickerDate);
    merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setPickerDate(merged);
    setDueDate(toLocalDateTimeString(merged));
  };

  const clearDueDate = () => { setDueDate(null); setShowDatePicker(false); setShowTimePicker(false); };

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Please enter a task title.'); return; }
    setSaving(true);
    try {
      if (current) {
        if (current._notifId) await cancelTaskNotification(current._notifId);
        const updated = await updateTask({ ...current, title, details, dueDate });
        let notifId = null;
        if (dueDate) notifId = await scheduleTaskNotification(updated.id, updated.title, dueDate);
        setTasks(p => p.map(t => t.id === updated.id ? { ...updated, _notifId: notifId } : t));
        close();
        Alert.alert('✅ Updated', `"${updated.title}" has been updated.`);
      } else {
        const created = await createTask(title, details, dueDate);
        let notifId = null;
        if (dueDate) notifId = await scheduleTaskNotification(created.id, created.title, dueDate);
        setTasks(p => [{ ...created, _notifId: notifId }, ...p]);
        close();
        Alert.alert('✅ Task Added', `"${created.title}" has been created.`);
      }
    } catch { Alert.alert('Error', 'Could not save task.'); }
    finally { setSaving(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const remove = async id => {
    const task = tasks.find(t => t.id === id);
    Alert.alert(
      'Delete Task',
      `Delete "${task?.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              if (task?._notifId) await cancelTaskNotification(task._notifId);
              await deleteTask(id);
              setTasks(p => p.filter(t => t.id !== id));
            } catch { Alert.alert('Error', 'Could not delete.'); }
          },
        },
      ]
    );
  };

  // ── Toggle complete ───────────────────────────────────────────────────────
  const toggleComplete = async task => {
    try {
      if (!task.isCompleted && task._notifId) await cancelTaskNotification(task._notifId);
      const u = await updateTask({ ...task, isCompleted: !task.isCompleted });
      // task.isCompleted is the OLD value; after toggling to completed (_notifId cleared), to incomplete (_notifId preserved)
      setTasks(p => p.map(t => t.id === u.id ? { ...u, _notifId: task.isCompleted ? task._notifId : null } : t));
    } catch {}
  };

  // ── Toggle pin ────────────────────────────────────────────────────────────
  const togglePin = async task => {
    try {
      const u = await updateTask({ ...task, isPinned: !task.isPinned });
      setTasks(p => p.map(t => t.id === u.id ? u : t).sort((a,b) => {
        if(a.isPinned === b.isPinned) return new Date(b.createdAt) - new Date(a.createdAt);
        return a.isPinned ? -1 : 1;
      }));
      // Removed redundant load() — optimistic sort is sufficient and avoids a race condition
    } catch {}
  };

  // ── Restore completed task ────────────────────────────────────────────────
  const restore = async task => {
    try {
      const u = await updateTask({ ...task, isCompleted: false });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTasks(p => p.map(t => t.id === u.id ? { ...u, _notifId: null } : t));
    } catch { Alert.alert('Error', 'Could not restore task.'); }
  };

  const toggleCompletedSection = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCompletedOpen(o => !o);
  };

  const active    = tasks.filter(t => !t.isCompleted);
  const completed = tasks.filter(t =>  t.isCompleted);

  if (loading) return <WritingLoader color={colors.accent} bg={colors.bg} label="Loading tasks" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={active}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onToggleComplete={toggleComplete}
            onTogglePin={togglePin}
            onDelete={remove}
            onSpeak={speakTask}
            onPress={() => openEdit(item)}
            colors={colors}
            shadow={shadow}
            isSpeakingId={speakingTaskId}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={-60}
            tintColor="transparent"
            colors={['transparent']}
          />
        }
        ListEmptyComponent={
          completed.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, marginTop: 80 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-done-outline" size={40} color={colors.accent} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>All clear!</Text>
              <Text style={{ fontSize: 14, color: colors.textSecond, textAlign: 'center' }}>Tap + to add your first task.</Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          active.length > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecond, letterSpacing: 1 }}>TASKS</Text>
              <View style={{ backgroundColor: colors.accentLight, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>{active.length}</Text>
              </View>
            </View>
          ) : null
        }
        ListFooterComponent={
          completed.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              {/* Completed section header */}
              <TouchableOpacity
                onPress={toggleCompletedSection}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  paddingVertical: 12, paddingHorizontal: 4,
                }}
              >
                <Ionicons
                  name={completedOpen ? 'chevron-down' : 'chevron-forward'}
                  size={16}
                  color={colors.textSecond}
                />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecond, letterSpacing: 1 }}>
                  COMPLETED
                </Text>
                <View style={{ backgroundColor: colors.inputBg, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>{completed.length}</Text>
                </View>
              </TouchableOpacity>

              {/* Completed tasks list */}
              {completedOpen && completed.map(task => (
                <CompletedRow
                  key={task.id}
                  task={task}
                  onRestore={restore}
                  onDelete={remove}
                  colors={colors}
                  shadow={shadow}
                />
              ))}
            </View>
          ) : null
        }
      />

      {/* Pull-to-refresh writing animation overlay */}
      {refreshing && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 90,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: colors.bg,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          <WritingLoader color={colors.accent} bg="transparent" label="Syncing tasks" />
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={{ position: 'absolute', right: 20, bottom: 28, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', ...shadow.md }}
        onPress={openNew} activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Task modal */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={close} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 36 : 24 }}
        >
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>
            {current ? 'Edit Task' : 'New Task'}
          </Text>

          <TextInput
            style={{ backgroundColor: colors.inputBg, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, marginBottom: 12 }}
            placeholder="Task title" placeholderTextColor={colors.textMuted}
            value={title} onChangeText={setTitle} autoFocus
          />
          <TextInput
            style={{ backgroundColor: colors.inputBg, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, marginBottom: 12, minHeight: 80 }}
            placeholder="Add details (optional)" placeholderTextColor={colors.textMuted}
            value={details} onChangeText={setDetails} multiline numberOfLines={3} textAlignVertical="top"
          />

          {/* Due date row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.inputBg, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 12 }}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={16} color={dueDate ? colors.accent : colors.textSecond} />
              <Text style={{ fontSize: 14, color: dueDate ? colors.accent : colors.textMuted, fontWeight: dueDate ? '600' : '400' }}>
                {dueDate ? formatDue(dueDate) : 'Set due date & time'}
              </Text>
            </TouchableOpacity>
            {dueDate ? (
              <TouchableOpacity onPress={clearDueDate} style={{ padding: 8, backgroundColor: colors.dangerLight, borderRadius: radius.sm }} activeOpacity={0.8}>
                <Ionicons name="close" size={16} color={colors.danger} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={{ flex: 1, height: 48, borderRadius: radius.sm, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' }} onPress={close}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textSecond }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 2, height: 48, borderRadius: radius.sm, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', ...shadow.md }} onPress={save} disabled={saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>{current ? 'Update' : 'Add Task'}</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date picker */}
      {showDatePicker && (
        <DateTimePicker value={pickerDate} mode="date" display="default" minimumDate={new Date()} onChange={onDateChange} />
      )}
      {/* Time picker */}
      {showTimePicker && (
        <DateTimePicker value={pickerDate} mode="time" display="default" onChange={onTimeChange} />
      )}
    </View>
  );
}
