import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  Pressable, Modal, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator, SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { fetchTasks, updateTask, deleteTask, fetchNotes, fetchCategories } from '../api';
import { useTheme } from '../ThemeContext';
import { radius } from '../theme';

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function SearchScreen() {
  const { colors, shadow } = useTheme();
  const navigation = useNavigation();

  const [query,   setQuery]   = useState('');
  const [filter,  setFilter]  = useState('All');
  const [loading, setLoading] = useState(true);

  // Raw data
  const [tasks,      setTasks]      = useState([]);
  const [notes,      setNotes]      = useState([]);
  const [categories, setCategories] = useState([]);

  // Filtered results
  const [results, setResults] = useState([]);

  // Task edit modal state
  const [modal,   setModal]   = useState(false);
  const [current, setCurrent] = useState(null);
  const [title,   setTitle]   = useState('');
  const [details, setDetails] = useState('');
  const [saving,  setSaving]  = useState(false);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    Promise.all([fetchTasks(), fetchNotes(), fetchCategories()])
      .then(([t, n, c]) => {
        setTasks(t);
        setNotes(n);
        setCategories(c);
        
        // Re-run search if query exists
        performSearch(query, t, n, c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []));

  // ── Search logic ────────────────────────────────────────────────────────────
  const performSearch = (text, tList = tasks, nList = notes, cList = categories, f = filter) => {
    if (!text.trim()) {
      setResults([]);
      return;
    }
    const q = text.toLowerCase();

    const matchedCategories = cList
      .filter(c => c.name?.toLowerCase().includes(q))
      .map(c => ({ ...c, _type: 'category' }));

    const matchedNotes = nList
      .filter(n => n.title?.toLowerCase().includes(q) || stripHtml(n.body).toLowerCase().includes(q))
      .map(n => ({ ...n, _type: 'note' }));

    const matchedTasks = tList
      .filter(t => t.title?.toLowerCase().includes(q) || t.details?.toLowerCase().includes(q))
      .map(t => ({ ...t, _type: 'task' }));

    const sections = [];
    if (matchedCategories.length > 0 && (f === 'All' || f === 'Categories')) {
      sections.push({ title: 'Categories', data: matchedCategories });
    }
    if (matchedNotes.length > 0 && (f === 'All' || f === 'Notes')) {
      sections.push({ title: 'Notes',      data: matchedNotes });
    }
    if (matchedTasks.length > 0 && (f === 'All' || f === 'Tasks')) {
      sections.push({ title: 'Tasks',      data: matchedTasks });
    }

    setResults(sections);
  };

  const handleSearch = text => {
    setQuery(text);
    performSearch(text, tasks, notes, categories, filter);
  };

  const handleFilter = newFilter => {
    setFilter(newFilter);
    performSearch(query, tasks, notes, categories, newFilter);
  };

  // ── Task sync helpers ───────────────────────────────────────────────────────
  const syncTaskUpdate = updated => {
    // Compute the new list first so both setTasks and performSearch use the same value (avoids stale closure)
    const newTasks = tasks.map(t => t.id === updated.id ? updated : t);
    setTasks(newTasks);
    performSearch(query, newTasks, notes, categories, filter);
  };

  const syncTaskDelete = id => {
    // Same fix: derive new array before calling setState
    const newTasks = tasks.filter(t => t.id !== id);
    setTasks(newTasks);
    performSearch(query, newTasks, notes, categories, filter);
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handlePressCategory = (cat) => {
    // Navigate to Notes page (FavoritesScreen) which displays categories
    navigation.navigate('Favorites');
  };

  const handlePressNote = (note) => {
    navigation.navigate('NoteEditor', { note, categories });
  };

  const openTaskEdit = (task) => {
    setCurrent(task);
    setTitle(task.title);
    setDetails(task.details || '');
    setModal(true);
  };

  const closeTaskModal = () => setModal(false);

  const saveTask = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Please enter a task title.'); return; }
    setSaving(true);
    try {
      const updated = await updateTask({ ...current, title, details });
      syncTaskUpdate(updated);
      closeTaskModal();
    } catch { Alert.alert('Error', 'Could not save task.'); } 
    finally { setSaving(false); }
  };

  const confirmTaskDelete = (task) => {
    Alert.alert('Delete Task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteTask(task.id);
            syncTaskDelete(task.id);
            if (modal) closeTaskModal();
          } catch { Alert.alert('Error', 'Could not delete task.'); }
      }},
    ]);
  };

  // ── Render Items ────────────────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    if (item._type === 'category') {
      return (
        <TouchableOpacity
          onPress={() => handlePressCategory(item)} activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 8, ...shadow.sm }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: item.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name="folder" size={18} color={item.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{item.name}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecond, marginTop: 2 }}>Category</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      );
    }

    if (item._type === 'note') {
      const preview = stripHtml(item.body);
      return (
        <TouchableOpacity
          onPress={() => handlePressNote(item)} activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 8, ...shadow.sm }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name="document-text" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{item.title || 'Untitled Note'}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecond, marginTop: 2 }} numberOfLines={1}>{preview || 'No text'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      );
    }

    if (item._type === 'task') {
      return (
        <TouchableOpacity
          onPress={() => openTaskEdit(item)} activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 8, ...shadow.sm }}
        >
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.isCompleted ? colors.textMuted : colors.accent, marginRight: 14, marginLeft: 6 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: item.isCompleted ? colors.textMuted : colors.textPrimary, textDecorationLine: item.isCompleted ? 'line-through' : 'none' }} numberOfLines={1}>
              {item.title}
            </Text>
            {item.details ? (
              <Text style={{ fontSize: 12, color: colors.textSecond, marginTop: 2 }} numberOfLines={1}>{item.details}</Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {item.isImportant && <Ionicons name="heart" size={14} color={colors.danger} />}
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>

      {/* Search bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginTop: 16, marginHorizontal: 16, marginBottom: 12, borderRadius: radius.md, paddingHorizontal: 14, height: 48, ...shadow.sm }}>
        <Ionicons name="search-outline" size={18} color={colors.textSecond} style={{ marginRight: 8 }} />
        <TextInput
          style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}
          placeholder="Search categories, notes, tasks..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />}
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}>
        {['All', 'Tasks', 'Notes', 'Categories'].map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => handleFilter(f)}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full,
              backgroundColor: filter === f ? colors.accent : colors.card,
              borderWidth: 1, borderColor: filter === f ? colors.accent : colors.border,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: filter === f ? '#fff' : colors.textPrimary }}>
              {f === 'Categories' ? 'Folders' : f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>


      {/* Results */}
      {query.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 60, gap: 10, paddingHorizontal: 32 }}>
          <Ionicons name="search-outline" size={40} color={colors.textMuted} />
          <Text style={{ color: colors.textSecond, fontSize: 14, textAlign: 'center' }}>
            Start typing to search across your notes, tasks, and categories.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={results}
          keyExtractor={(item, index) => item._type + '_' + item.id + '_' + index}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60, gap: 10 }}>
              <Ionicons name="document-outline" size={40} color={colors.textMuted} />
              <Text style={{ color: colors.textSecond, fontSize: 14 }}>No results found for "{query}".</Text>
            </View>
          }
          renderSectionHeader={({ section: { title } }) => (
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecond, marginTop: 12, marginBottom: 8, letterSpacing: 0.5 }}>
              {title.toUpperCase()}
            </Text>
          )}
          renderItem={renderItem}
        />
      )}

      {/* Task Edit Modal */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={closeTaskModal} statusBarTranslucent>
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={closeTaskModal} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 36 : 24 }}
        >
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>Edit Task</Text>
            <TouchableOpacity onPress={() => confirmTaskDelete(current)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.dangerLight, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Ionicons name="trash-outline" size={15} color={colors.danger} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.danger }}>Delete</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={{ backgroundColor: colors.inputBg, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, marginBottom: 12 }}
            placeholder="Task title" placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle} autoFocus
          />
          <TextInput
            style={{ backgroundColor: colors.inputBg, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, marginBottom: 12, minHeight: 90 }}
            placeholder="Add details (optional)" placeholderTextColor={colors.textMuted} value={details} onChangeText={setDetails} multiline numberOfLines={3} textAlignVertical="top"
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <TouchableOpacity style={{ flex: 1, height: 48, borderRadius: radius.sm, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' }} onPress={closeTaskModal}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textSecond }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 2, height: 48, borderRadius: radius.sm, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', ...shadow.md }} onPress={saveTask} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Update Task</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}
