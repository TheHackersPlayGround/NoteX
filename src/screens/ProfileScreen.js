import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert, Switch,
  Modal, Pressable, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { getSession, logout, changePassword } from '../api';
import { cancelAllNotifications } from '../notifications';
import { useTheme } from '../ThemeContext';
import { radius } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { colors, shadow, isDark, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');

  // ── Change Password modal state ──────────────────────────────────────────────
  const [pwModal,    setPwModal]    = useState(false);
  const [curPw,      setCurPw]      = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [pwLoading,  setPwLoading]  = useState(false);
  const [pwError,    setPwError]    = useState('');

  useEffect(() => {
    getSession().then(s => { if (s?.username) setUsername(s.username); });
  }, []);

  const openPwModal = () => {
    setCurPw(''); setNewPw(''); setConfirmPw('');
    setShowCur(false); setShowNew(false); setShowConf(false);
    setPwError('');
    setPwModal(true);
  };

  const closePwModal = () => setPwModal(false);

  const handleChangePassword = async () => {
    setPwError('');
    if (!curPw || !newPw || !confirmPw) { setPwError('All fields are required.'); return; }
    if (newPw.length < 8)               { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw)            { setPwError('New passwords do not match.'); return; }
    if (curPw === newPw)                { setPwError('New password must be different from the current one.'); return; }

    setPwLoading(true);
    try {
      await changePassword(curPw, newPw);
      closePwModal();
      Alert.alert('✅ Password Changed', 'Your password has been updated successfully.');
    } catch (e) {
      setPwError(e.message || 'Something went wrong.');
    } finally {
      setPwLoading(false);
    }
  };

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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >

      {/* Profile Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 16, ...shadow.sm }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 16, ...shadow.md }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, textTransform: 'capitalize' }}>{username || '...'}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecond, marginTop: 2 }}>NoteX Member</Text>
        </View>
      </View>

      {/* Account card */}
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecond, letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
        ACCOUNT
      </Text>
      <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 4, ...shadow.sm, marginBottom: 16 }}>
        <Row icon="person-outline" label="Username" value={username} colors={colors} />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        {/* Change Password */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
          onPress={openPwModal}
          activeOpacity={0.7}
        >
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <Ionicons name="key-outline" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Change Password</Text>
            <Text style={{ fontSize: 12, color: colors.textSecond, marginTop: 1 }}>Update your login password</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* App Settings */}
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecond, letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
        APP SETTINGS
      </Text>
      <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 4, ...shadow.sm, marginBottom: 24 }}>

        {/* Dark Mode toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecond, marginTop: 1 }}>
              {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#fff"
            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
          />
        </View>

        {/* Trash */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
          onPress={() => navigation.navigate('Trash')}
          activeOpacity={0.7}
        >
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.dangerLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Trash</Text>
            <Text style={{ fontSize: 12, color: colors.textSecond, marginTop: 1 }}>View deleted notes & tasks</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Version Info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <Ionicons name="layers-outline" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>App Version</Text>
            <Text style={{ fontSize: 12, color: colors.textSecond, marginTop: 1 }}>You're on the latest version</Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accent }}>{Constants.expoConfig?.version || '1.0.0'}</Text>
        </View>

        {/* About Developer */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
          onPress={() => navigation.navigate('AboutDeveloper')}
          activeOpacity={0.7}
        >
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <Ionicons name="code-slash-outline" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>About Developer</Text>
            <Text style={{ fontSize: 12, color: colors.textSecond, marginTop: 1 }}>Meet the team behind NoteX</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

      </View>

      {/* Logout */}
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.dangerLight, borderRadius: radius.sm, height: 50, marginTop: 8 }}
        onPress={confirmLogout} activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.danger }}>Log Out</Text>
      </TouchableOpacity>

      {/* ── Change Password Modal ─────────────────────────────────────────────── */}
      <Modal visible={pwModal} transparent animationType="slide" onRequestClose={closePwModal} statusBarTranslucent>
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={closePwModal} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28 }}
        >
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Ionicons name="key-outline" size={20} color={colors.accent} />
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>Change Password</Text>
              <Text style={{ fontSize: 12, color: colors.textSecond, marginTop: 1 }}>Enter your current and new password</Text>
            </View>
          </View>

          {/* Current password */}
          <PwField
            label="Current Password"
            value={curPw}
            onChangeText={setCurPw}
            show={showCur}
            onToggle={() => setShowCur(v => !v)}
            colors={colors}
          />

          {/* New password */}
          <PwField
            label="New Password"
            value={newPw}
            onChangeText={setNewPw}
            show={showNew}
            onToggle={() => setShowNew(v => !v)}
            colors={colors}
          />

          {/* Confirm new password */}
          <PwField
            label="Confirm New Password"
            value={confirmPw}
            onChangeText={setConfirmPw}
            show={showConf}
            onToggle={() => setShowConf(v => !v)}
            colors={colors}
          />

          {/* Error */}
          {pwError ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.dangerLight, borderRadius: radius.sm, padding: 10, marginBottom: 14 }}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
              <Text style={{ color: colors.danger, fontSize: 13, flex: 1 }}>{pwError}</Text>
            </View>
          ) : null}

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{ flex: 1, height: 50, borderRadius: radius.sm, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' }}
              onPress={closePwModal}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textSecond }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 2, height: 50, borderRadius: radius.sm, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
              onPress={handleChangePassword}
              disabled={pwLoading}
              activeOpacity={0.85}
            >
              {pwLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Update Password</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </ScrollView>
  );
}

// ── Password input field ───────────────────────────────────────────────────────
function PwField({ label, value, onChangeText, show, onToggle, colors }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.inputBg, borderRadius: radius.sm,
      paddingHorizontal: 14, marginBottom: 12, height: 50,
      borderWidth: 1, borderColor: colors.inputBorder,
    }}>
      <Ionicons name="lock-closed-outline" size={17} color={colors.textSecond} style={{ marginRight: 10 }} />
      <TextInput
        style={{ flex: 1, fontSize: 15, color: colors.textPrimary, fontFamily: 'Nunito_400Regular' }}
        placeholder={label}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!show}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={onToggle} style={{ padding: 4 }}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={17} color={colors.textSecond} />
      </TouchableOpacity>
    </View>
  );
}

// ── Info row ───────────────────────────────────────────────────────────────────
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
