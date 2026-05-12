import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Pressable, ScrollView,
  Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchNotes, updateNote, deleteNote, fetchCategories, createCategory, deleteCategory } from '../api';
import { useTheme } from '../ThemeContext';
import { radius } from '../theme';
import WritingLoader from '../components/WritingLoader';

const CAT_COLORS = ['#6C63FF','#EF4444','#22C55E','#F59E0B','#3B82F6','#EC4899','#8B5CF6','#14B8A6'];

const BG_LIGHT = ['#FFFFFF','#FFF9C4','#DCEDC8','#BBDEFB','#F8BBD0','#E1BEE7','#FFCCBC'];
const BG_DARK  = ['#1C1C23','#3D3000','#1B3A1B','#0D2A40','#3A1A26','#2A1A3A','#3A1A0D'];

function resolveThemeColor(hex, isDark) {
  if (!hex) return isDark ? BG_DARK[0] : BG_LIGHT[0];
  const lightIdx = BG_LIGHT.indexOf(hex);
  if (lightIdx !== -1) return isDark ? BG_DARK[lightIdx] : hex;
  const darkIdx = BG_DARK.indexOf(hex);
  if (darkIdx !== -1) return isDark ? BG_DARK[darkIdx] : BG_LIGHT[darkIdx];
  return hex;
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Category chip ─────────────────────────────────────────────────────────────
function CatChip({ label, color, selected, onPress, onLongPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: radius.full, marginRight: 8,
        backgroundColor: selected ? color : 'transparent',
        borderWidth: 1.5,
        borderColor: selected ? color : 'rgba(128,128,128,0.3)',
      }}
    >
      {color && (
        <View style={{
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: selected ? '#fff' : color,
        }} />
      )}
      <Text style={{
        fontSize: 13, fontWeight: '600',
        color: selected ? '#fff' : label === 'All' ? 'rgba(128,128,128,0.8)' : color,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Note card ─────────────────────────────────────────────────────────────────
function NoteCard({ note, onPress, onLongPress, onDelete, colors, shadow, isDark, categories }) {
  const cardBg    = resolveThemeColor(note.color, isDark);
  const isDefault = cardBg === (isDark ? BG_DARK[0] : BG_LIGHT[0]);
  const preview   = stripHtml(note.body);
  const cat       = categories.find(c => c.id === note.category_id || c.id === parseInt(note.category_id));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        backgroundColor: cardBg, borderRadius: radius.md,
        padding: 14, marginBottom: 10, flex: 1,
        opacity: pressed ? 0.88 : 1,
        borderWidth: isDefault ? 1 : 0,
        borderColor: colors.border,
        ...shadow.sm,
      })}
    >
      {note.title ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: preview ? 6 : 0, paddingRight: 20 }}>
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary }} numberOfLines={2}>
            {note.title}
          </Text>
          {note.isPinned ? <Ionicons name="pin" size={14} color={colors.accent} style={{ marginLeft: 4, marginTop: 2 }} /> : null}
        </View>
      ) : (
        note.isPinned ? <Ionicons name="pin" size={14} color={colors.accent} style={{ alignSelf: 'flex-end', marginBottom: 4 }} /> : null
      )}
      {preview ? (
        <Text style={{ fontSize: 13, color: colors.textSecond, lineHeight: 19 }} numberOfLines={8}>
          {preview}
        </Text>
      ) : null}

      {/* Category badge */}
      {cat && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: cat.color }} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: cat.color }}>{cat.name}</Text>
        </View>
      )}

      {/* Delete button */}
      <TouchableOpacity
        onPress={() => onDelete(note)} activeOpacity={0.7}
        style={{ position: 'absolute', top: 8, right: 8, padding: 4 }}
      >
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </Pressable>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function NotesPageScreen({ navigation }) {
  const { colors, shadow, isDark } = useTheme();

  const [notes,      setNotes]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCat,  setActiveCat]  = useState(null); // null = All

  // Category manager modal
  const [managerVisible, setManagerVisible] = useState(false);
  const [newName,  setNewName]  = useState('');
  const [newColor, setNewColor] = useState(CAT_COLORS[0]);
  const [saving,   setSaving]   = useState(false);

  const loadData = async () => {
    try {
      const [n, c] = await Promise.all([fetchNotes(), fetchCategories()]);
      setNotes(n);
      setCategories(c);
    } catch {
      Alert.alert('Error', 'Could not load data.');
    }
  };

  // Reload both lists every time screen is focused
  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, []));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const openNew  = () => navigation.navigate('NoteEditor', { note: null,  categories });
  const openEdit = (note) => navigation.navigate('NoteEditor', { note, categories });

  const confirmDelete = (note) => {
    Alert.alert('Delete Note', `Delete "${note.title || 'this note'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteNote(note.id);
          setNotes(p => p.filter(n => n.id !== note.id));
        } catch { Alert.alert('Error', 'Could not delete note.'); }
      }},
    ]);
  };

  const togglePin = async (note) => {
    try {
      const u = await updateNote({ ...note, isPinned: !note.isPinned });
      setNotes(p => p.map(n => n.id === u.id ? u : n).sort((a,b) => {
        if(a.isPinned === b.isPinned) return new Date(b.updatedAt) - new Date(a.updatedAt);
        return a.isPinned ? -1 : 1;
      }));
    } catch (e) {
      Alert.alert('Error', 'Could not pin note: ' + (e.message || 'Unknown error'));
    }
  };

  const handleLongPressCategory = (cat) => {
    Alert.alert(`"${cat.name}"`, 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteCategory(cat.id);
          setCategories(p => p.filter(c => c.id !== cat.id));
          if (activeCat?.id === cat.id) setActiveCat(null);
        } catch { Alert.alert('Error', 'Could not delete category.'); }
      }},
    ]);
  };

  const handleCreateCategory = async () => {
    if (!newName.trim()) { Alert.alert('Required', 'Please enter a category name.'); return; }
    setSaving(true);
    try {
      const created = await createCategory(newName.trim(), newColor);
      setCategories(p => [...p, created]);
      setNewName(''); setNewColor(CAT_COLORS[0]);
    } catch { Alert.alert('Error', 'Could not create category.'); }
    finally { setSaving(false); }
  };

  // Filter notes by active category
  const filtered = activeCat
    ? notes.filter(n => String(n.category_id) === String(activeCat.id))
    : notes;

  const leftCol  = filtered.filter((_, i) => i % 2 === 0);
  const rightCol = filtered.filter((_, i) => i % 2 !== 0);

  if (loading) return <WritingLoader color={colors.accent} bg={colors.bg} label="Loading notes" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>

      {/* ── Category filter bar ── */}
      <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' }}
        >
          {/* All chip */}
          <CatChip
            label="All"
            color={colors.accent}
            selected={activeCat === null}
            onPress={() => setActiveCat(null)}
          />

          {/* Category chips */}
          {categories.map(cat => (
            <CatChip
              key={cat.id}
              label={cat.name}
              color={cat.color}
              selected={activeCat?.id === cat.id}
              onPress={() => setActiveCat(p => p?.id === cat.id ? null : cat)}
              onLongPress={() => handleLongPressCategory(cat)}
            />
          ))}

          {/* Manage categories button */}
          <TouchableOpacity
            onPress={() => setManagerVisible(true)}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingHorizontal: 12, paddingVertical: 7,
              borderRadius: radius.full,
              borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.textMuted,
            }}
          >
            <Ionicons name="folder-open-outline" size={14} color={colors.textMuted} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted }}>Manage</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Notes grid ── */}
      <ScrollView
        contentContainerStyle={{ padding: 12, paddingBottom: 120, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            // Hide the native spinner by pushing it out of view
            progressViewOffset={-60}
            tintColor="transparent"
            colors={['transparent']}
          />
        }
      >
        {filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="document-text-outline" size={40} color={colors.accent} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>
              {activeCat ? `No notes in "${activeCat.name}"` : 'No notes yet'}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecond, textAlign: 'center' }}>
              {activeCat ? 'Add a note and assign it to this category.' : 'Tap + to capture an idea, a reminder, or anything else.'}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              {leftCol.map(note => (
                <NoteCard key={note.id} note={note} onPress={() => openEdit(note)}
                  onLongPress={() => togglePin(note)}
                  onDelete={confirmDelete} colors={colors} shadow={shadow} isDark={isDark} categories={categories} />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              {rightCol.map(note => (
                <NoteCard key={note.id} note={note} onPress={() => openEdit(note)}
                  onLongPress={() => togglePin(note)}
                  onDelete={confirmDelete} colors={colors} shadow={shadow} isDark={isDark} categories={categories} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Custom pull-to-refresh writing animation overlay */}
      {refreshing && (
        <View style={{
          position: 'absolute', top: 56, left: 0, right: 0, height: 90,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: colors.bg,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          <WritingLoader color={colors.accent} bg="transparent" label="Syncing" />
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={{ position: 'absolute', right: 20, bottom: 28, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', ...shadow.md }}
        onPress={openNew} activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Category Manager Modal ── */}
      <Modal visible={managerVisible} transparent animationType="slide" onRequestClose={() => setManagerVisible(false)} statusBarTranslucent>
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={() => setManagerVisible(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 36 : 24, maxHeight: '80%' }}
        >
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="folder-open-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>Manage Categories</Text>
          </View>

          {/* Existing categories */}
          <ScrollView style={{ maxHeight: 200, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
            {categories.length === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 12 }}>
                No categories yet. Create one below.
              </Text>
            ) : (
              categories.map(cat => (
                <View key={cat.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: cat.color, marginRight: 12 }} />
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{cat.name}</Text>
                  <TouchableOpacity onPress={() => handleLongPressCategory(cat)} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={17} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          {/* Create new category */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecond, letterSpacing: 0.5, marginBottom: 10 }}>NEW CATEGORY</Text>

          <TextInput
            style={{ backgroundColor: colors.inputBg, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: colors.textPrimary, marginBottom: 12 }}
            placeholder="Category name"
            placeholderTextColor={colors.textMuted}
            value={newName}
            onChangeText={setNewName}
          />

          {/* Color picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {CAT_COLORS.map(c => (
              <TouchableOpacity
                key={c} onPress={() => setNewColor(c)}
                style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, marginRight: 10, borderWidth: newColor === c ? 3 : 1.5, borderColor: newColor === c ? colors.textPrimary : 'transparent', alignItems: 'center', justifyContent: 'center' }}
              >
                {newColor === c && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={{ backgroundColor: colors.accent, borderRadius: radius.sm, height: 48, alignItems: 'center', justifyContent: 'center', ...shadow.md }}
            onPress={handleCreateCategory} disabled={saving} activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Add Category</Text>
            }
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
