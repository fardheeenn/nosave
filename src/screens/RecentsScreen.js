import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import CallLog from 'react-native-call-log';
import { relativeTime, detectCC, getInitials } from '../utils';

export default function RecentsScreen({ onSelectNumber }) {
  const [calls, setCalls]       = useState([]);
  const [perm, setPerm]         = useState('unknown'); // unknown | granted | denied | loading
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  async function checkPermission() {
    if (Platform.OS !== 'android') {
      setPerm('ios_unsupported'); return;
    }
    try {
      const result = await check(PERMISSIONS.ANDROID.READ_CALL_LOG);
      if (result === RESULTS.GRANTED) {
        setPerm('granted');
        loadCalls();
      } else {
        setPerm('needs_request');
      }
    } catch (e) {
      setPerm('denied');
    }
  }

  async function requestPermission() {
    try {
      const result = await request(PERMISSIONS.ANDROID.READ_CALL_LOG);
      if (result === RESULTS.GRANTED) {
        setPerm('granted');
        loadCalls();
      } else {
        setPerm('denied');
      }
    } catch (e) {
      setPerm('denied');
    }
  }

  async function loadCalls() {
    setLoading(true);
    try {
      const logs = await CallLog.loadAll();
      // Process call logs into clean format
      const processed = logs.slice(0, 50).map((log, i) => ({
        id: String(i),
        name: log.name && log.name !== log.phoneNumber ? log.name : null,
        number: log.phoneNumber || '',
        type: log.type === '1' ? 'incoming'
            : log.type === '2' ? 'outgoing'
            : 'missed',
        duration: parseInt(log.duration || '0'),
        ts: parseInt(log.timestamp || Date.now()),
      }));
      setCalls(processed);
    } catch (e) {
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(call) {
    // Detect country code from the number
    const raw = call.number.replace(/[\s\-(). ]/g, '');
    const detected = detectCC(raw);
    if (detected) {
      onSelectNumber(detected.cc, detected.num);
    } else {
      onSelectNumber(null, raw);
    }
  }

  // ── PERMISSION SCREEN
  if (perm === 'unknown' || perm === 'needs_request') {
    return (
      <View style={s.center}>
        <Text style={s.permIcon}>📞</Text>
        <Text style={s.permTitle}>Access Call History</Text>
        <Text style={s.permDesc}>
          See your recent calls and tap any number to message them instantly — without saving to contacts.
        </Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={s.permBtnText}>Grant Access</Text>
        </TouchableOpacity>
        <Text style={s.permNote}>All data stays on your device</Text>
      </View>
    );
  }

  if (perm === 'denied') {
    return (
      <View style={s.center}>
        <Text style={s.permIcon}>🔒</Text>
        <Text style={s.permTitle}>Permission Denied</Text>
        <Text style={s.permDesc}>
          Go to Settings → Apps → NoSave → Permissions → Enable "Call logs" to use this feature.
        </Text>
      </View>
    );
  }

  if (perm === 'ios_unsupported') {
    return (
      <View style={s.center}>
        <Text style={s.permIcon}>📵</Text>
        <Text style={s.permTitle}>Not available on iOS</Text>
        <Text style={s.permDesc}>
          Apple does not allow apps to read call history on iPhone. Use the Dial tab to enter numbers manually.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#1A1814" />
        <Text style={s.loadingText}>Reading call log…</Text>
      </View>
    );
  }

  if (calls.length === 0) {
    return (
      <View style={s.center}>
        <Text style={s.permIcon}>📭</Text>
        <Text style={s.permTitle}>No calls found</Text>
        <Text style={s.permDesc}>Your call log appears to be empty.</Text>
      </View>
    );
  }

  // ── CALL LIST
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>CALL LOG</Text>
        <Text style={s.headerCount}>{calls.length} entries</Text>
      </View>
      <FlatList
        data={calls}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => {
          const typeIcon  = item.type === 'incoming' ? '↙' : item.type === 'outgoing' ? '↗' : '✕';
          const typeColor = item.type === 'incoming' ? '#16A34A' : item.type === 'outgoing' ? '#2563EB' : '#DC2626';
          const initials  = item.name ? getInitials(item.name) : '#';
          return (
            <TouchableOpacity
              style={[s.callItem, index === calls.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <View style={s.callBody}>
                <Text style={s.callName} numberOfLines={1}>
                  {item.name || item.number}
                </Text>
                {item.name && <Text style={s.callNum}>{item.number}</Text>}
              </View>
              <View style={s.callRight}>
                <Text style={[s.callType, { color: typeColor }]}>{typeIcon}</Text>
                <Text style={s.callTime}>{relativeTime(item.ts)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F7F5F2' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F7F5F2' },
  permIcon:    { fontSize: 40, marginBottom: 16 },
  permTitle:   { fontSize: 18, fontWeight: '700', color: '#1A1814', letterSpacing: -0.4, marginBottom: 10, textAlign: 'center' },
  permDesc:    { fontSize: 13, color: '#4A4540', lineHeight: 20, textAlign: 'center', marginBottom: 24, maxWidth: 280 },
  permBtn:     { backgroundColor: '#1A1814', borderRadius: 13, paddingVertical: 14, paddingHorizontal: 40, marginBottom: 12 },
  permBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  permNote:    { fontSize: 11, color: '#9A948E' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#9A948E' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingHorizontal: 20 },
  headerTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: '#9A948E' },
  headerCount: { fontSize: 11, color: '#9A948E' },
  callItem:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  avatar:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFECE8', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 14, fontWeight: '700', color: '#4A4540' },
  callBody:    { flex: 1, minWidth: 0 },
  callName:    { fontSize: 14, fontWeight: '600', color: '#1A1814', marginBottom: 1 },
  callNum:     { fontSize: 11, color: '#9A948E', fontVariant: ['tabular-nums'] },
  callRight:   { alignItems: 'flex-end', gap: 4 },
  callType:    { fontSize: 13, fontWeight: '600' },
  callTime:    { fontSize: 11, color: '#9A948E' },
});
