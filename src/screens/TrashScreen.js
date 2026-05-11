import React, { useState, useCallback } from 'react';
import { View, Text, SectionList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchTrash, restoreItem, forceDeleteItem } from '../api';
import { useTheme } from '../ThemeContext';
import { radius } from '../theme';

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function TrashScreen() {
  const { colors, shadow } = useTheme();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);

  const loadData = async () => {
    try {
      const data = await fetchTrash();
      const newSections = [];
      if (data.categories?.length > 0) {
        newSections.push({ title: 'Folders', data: data.categories.map(c => ({...c, _type: 'category'})) });
      }
      if (data.notes?.length > 0) {
        newSections.push({ title: 'Notes', data: data.notes.map(n => ({...n, _type: 'note'})) });
      }
      if (data.tasks?.length > 0) {
        newSections.push({ title: 'Tasks', data: data.tasks.map(t => ({...t, _type: 'task'})) });
      }
      setSections(newSections);
    } catch {
      Alert.alert('Error', 'Could not load trash.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadData();
  }, []));

  const handlePress = (item) => {
    Alert.alert(
      'Deleted Item',
      'What would you like to do with this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: () => handleRestore(item) },
        { text: 'Delete Permanently', style: 'destructive', onPress: () => handleForceDelete(item) },
      ]
    );
  };

  const handleRestore = async (item) => {
    try {
      await restoreItem(item._type, item.id);
      setLoading(true);
      await loadData();
    } catch {
      Alert.alert('Error', 'Could not restore item.');
    } finally {
      setLoading(false);
    }
  };

  const handleForceDelete = (item) => {
    Alert.alert('Confirm', 'This cannot be undone. Delete forever?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Forever', style: 'destructive', onPress: async () => {
          try {
            await forceDeleteItem(item._type, item.id);
            setLoading(true);
            await loadData();
          } catch {
            Alert.alert('Error', 'Could not delete item.');
          } finally {
            setLoading(false);
          }
      }}
    ]);
  };

  const renderItem = ({ item }) => {
    let icon, title, subtitle;
    if (item._type === 'category') {
      icon = 'folder'; title = item.name; subtitle = 'Folder';
    } else if (item._type === 'note') {
      icon = 'document-text'; title = item.title || 'Untitled Note'; subtitle = stripHtml(item.body) || 'Note';
    } else {
      icon = 'checkmark-circle'; title = item.title; subtitle = item.details || 'Task';
    }

    return (
      <TouchableOpacity onPress={() => handlePress(item)} activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 14, borderRadius: radius.md, marginBottom: 8, ...shadow.sm }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: item._type === 'category' ? item.color+'20' : colors.dangerLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Ionicons name={icon} size={18} color={item._type === 'category' ? item.color : colors.danger} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary, textDecorationLine: 'line-through' }} numberOfLines={1}>{title}</Text>
          <Text style={{ fontSize: 12, color: colors.textSecond, marginTop: 2 }} numberOfLines={1}>{subtitle}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 8 }}>
            <Text style={{ fontSize: 11, color: colors.accent, fontWeight: '600' }}>Tap to Manage</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={{ flex:1, backgroundColor: colors.bg, justifyContent:'center' }}><ActivityIndicator size="large" color={colors.accent} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SectionList
        sections={sections}
        keyExtractor={(i, index) => i._type + i.id + index}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 100, gap: 14, paddingHorizontal: 32 }}>
            <Ionicons name="trash-outline" size={48} color={colors.textMuted} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>Trash is empty</Text>
            <Text style={{ fontSize: 14, color: colors.textSecond, textAlign: 'center' }}>
              Items you delete will appear here and will be automatically deleted forever after 30 days.
            </Text>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecond, marginTop: 12, marginBottom: 8, letterSpacing: 0.5 }}>
            {title.toUpperCase()}
          </Text>
        )}
        renderItem={renderItem}
      />
    </View>
  );
}
