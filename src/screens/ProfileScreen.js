import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSession, logout } from '../api';
import { cancelAllNotifications } from '../notifications';
import { useTheme } from '../ThemeContext';
import { radius } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { colors, shadow, isDark, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');

  useEffect(() => {
    getSession().then(s => { if (s?.username) setUsername(s.username); });
  }, []);

  const confirmLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        await logout();
        await cancelAllNotifications();
        Alert.alert('👋 Logged Out', 'You have been logged out successfully.', [
          { text: 'OK', onPress: () => navigation.replace('Login') }
        ]);
      }},
    ]);
  };

  const initials = username ? username.slice(0, 2).toUpperCase() : '?';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 20 }}>
      {/* Profile Header (Horizontal) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 16, ...shadow.sm }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 16, ...shadow.md }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, textTransform: 'capitalize' }}>{username || '...'}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecond, marginTop: 2 }}>NoteX Member</Text>
        </View>
      </View>

      {/* Info card (Compact) */}
      <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 4, ...shadow.sm, marginBottom: 16 }}>
        <Row icon="person-outline" label="Username" value={username} colors={colors} />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <Row icon="shield-checkmark-outline" label="Account" value="Active" valueColor={colors.success} colors={colors} />
      </View>

      {/* Settings card */}
      <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 20, paddingVertical: 4, ...shadow.sm, marginBottom: 24 }}>
        
        {/* Trash */}
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}
          onPress={() => navigation.navigate('Trash')} activeOpacity={0.7}
        >
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.dangerLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name="trash" size={16} color={colors.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Trash</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Appearance */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={16} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#fff"
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>

        <View style={{ height: 1, backgroundColor: colors.border }} />

        {/* Version Info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Version Info</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textSecond }}>1.0.0</Text>
        </View>

        {/* About Developer */}
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
          onPress={() => navigation.navigate('AboutDeveloper')} activeOpacity={0.7}
        >
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name="code-slash-outline" size={16} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>About Developer</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />

      {/* Logout */}
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.dangerLight, borderRadius: radius.sm, height: 48, marginBottom: 10 }}
        onPress={confirmLogout} activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.danger }}>Log Out</Text>
      </TouchableOpacity>

    </View>
  );
}

function Row({ icon, label, value, valueColor, colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: colors.textSecond }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: '600', color: valueColor || colors.textPrimary, marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
}
