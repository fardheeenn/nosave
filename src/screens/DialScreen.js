import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, ScrollView, Animated, Linking,
  Platform, ToastAndroid, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COUNTRY_CODES, APPS, STORAGE_KEYS } from '../constants';
import { buildUrl, isValidNumber, relativeTime, parseClipboard, detectCC } from '../utils';
import { WhatsAppIcon, TelegramIcon, SignalIcon, getAppIcon } from '../icons';

// CHANGED: Added props to the function signature
export default function DialScreen({ pendingNum, onPendingConsumed }) {
  const [cc, setCC]               = useState('+91');
  const [ccFlag, setCCFlag]       = useState('🇮🇳');
  const [num, setNum]             = useState('');
  const [history, setHistory]     = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch]       = useState('');
  const [clipHint, setClipHint]   = useState(null);
  const [err, setErr]             = useState('');
  const shakeAnim                 = useRef(new Animated.Value(0)).current;

  // NEW: Effect to catch numbers coming from the Recents tab
  useEffect(() => {
    if (pendingNum) {
      if (pendingNum.cc) {
        setCC(pendingNum.cc);
        const found = COUNTRY_CODES.find(c => c.code === pendingNum.cc);
        if (found) setCCFlag(found.flag);
      }
      setNum(pendingNum.num);
      setErr('');
      // Tells the main App to clear the memory after we've filled the box
      if (onPendingConsumed) onPendingConsumed();
    }
  }, [pendingNum]);

  useEffect(() => {
    loadSaved();
    checkClipboard();
  }, []);

  async function loadSaved() {
    try {
      const savedCC   = await AsyncStorage.getItem(STORAGE_KEYS.LAST_CC);
      const savedHist = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      if (savedCC) {
        const found = COUNTRY_CODES.find(c => c.code === savedCC);
        if (found) { setCC(found.code); setCCFlag(found.flag); }
      }
      if (savedHist) setHistory(JSON.parse(savedHist));
    } catch (_) {}
  }

  async function checkClipboard() {
    try {
      const text = await Clipboard.getStringAsync();
      const parsed = parseClipboard(text);
      if (!parsed) return;
      if (parsed.cc) {
        setCC(parsed.cc);
        setCCFlag(parsed.flag || '🌐');
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_CC, parsed.cc);
      }
      setNum(parsed.num);
      setClipHint(parsed.cc ? 'Country code detected & applied' : 'Number detected from clipboard');
      setTimeout(() => setClipHint(null), 4000);
    } catch (_) {}
  }

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function launch(appId) {
    const clean = num.replace(/[\s\-(). ]/g, '');
    if (!isValidNumber(clean)) {
      setErr('Please enter a valid phone number.');
      shake(); return;
    }
    setErr('');
    const url = buildUrl(appId, cc, clean);
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('App not installed', `Please install ${APPS.find(a => a.id === appId)?.name} first.`);
      return;
    }
    const h = history.filter(x => !(x.cc === cc && x.num === clean));
    const updated = [{ cc, num: clean, app: appId, ts: Date.now() }, ...h].slice(0, 5);
    setHistory(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    Linking.openURL(url);
    if (Platform.OS === 'android') {
      ToastAndroid.show(`Opening ${APPS.find(a => a.id === appId)?.name}…`, ToastAndroid.SHORT);
    }
  }

  async function selectCC(country) {
    setCC(country.code);
    setCCFlag(country.flag);
    setShowPicker(false);
    setSearch('');
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_CC, country.code);
  }

  function loadFromHistory(item) {
    setCC(item.cc);
    const found = COUNTRY_CODES.find(c => c.code === item.cc);
    if (found) setCCFlag(found.flag);
    setNum(item.num);
    setErr('');
  }

  async function clearHistory() {
    setHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
  }

  const filteredCC = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search)
  );

  const isValid = isValidNumber(num.replace(/[\s\-(). ]/g, ''));

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

      <View style={s.card}>
        <Text style={s.cardLabel}>ENTER NUMBER</Text>

        <Animated.View style={[s.phoneRow, { transform: [{ translateX: shakeAnim }] }]}>
          <TouchableOpacity style={s.ccBtn} onPress={() => setShowPicker(true)} activeOpacity={0.75}>
            <Text style={s.ccFlag}>{ccFlag}</Text>
            <Text style={s.ccCode}>{cc}</Text>
            <Text style={s.ccCaret}>▾</Text>
          </TouchableOpacity>
          <TextInput
            style={s.numInput}
            value={num}
            onChangeText={v => { setNum(v.replace(/[^\d\s\-().]/g, '')); setErr(''); setClipHint(null); }}
            placeholder="Phone number"
            placeholderTextColor="#C5BFB9"
            keyboardType="phone-pad"
            returnKeyType="done"
          />
        </Animated.View>

        {clipHint ? (
          <View style={s.clipTag}><Text style={s.clipText}>✦ {clipHint}</Text></View>
        ) : err ? (
          <View style={s.errTag}><Text style={s.errText}>⚠ {err}</Text></View>
        ) : <View style={{ height: 8 }} />}

        <View style={s.appsArea}>
          <Text style={s.appsLabel}>OPEN CONVERSATION IN</Text>
          <View style={s.appsRow}>
            <TouchableOpacity style={[s.appBtn, !isValid && s.appBtnDim]} onPress={() => launch('whatsapp')} activeOpacity={0.75}>
              <WhatsAppIcon size={38} />
              <Text style={s.appBtnName}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.appBtn, !isValid && s.appBtnDim]} onPress={() => launch('telegram')} activeOpacity={0.75}>
              <TelegramIcon size={38} />
              <Text style={s.appBtnName}>Telegram</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.appBtn, !isValid && s.appBtnDim]} onPress={() => launch('signal')} activeOpacity={0.75}>
              <SignalIcon size={38} />
              <Text style={s.appBtnName}>Signal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {history.length > 0 && (
        <View style={s.section}>
          <View style={s.secHead}>
            <Text style={s.secTitle}>RECENT</Text>
            <TouchableOpacity onPress={clearHistory}><Text style={s.secClear}>Clear all</Text></TouchableOpacity>
          </View>
          {history.map((item, i) => {
            const app = APPS.find(a => a.id === item.app);
            return (
              <TouchableOpacity key={i} style={s.hItem} onPress={() => loadFromHistory(item)} activeOpacity={0.75}>
                <View style={[s.hDot, { backgroundColor: app?.bg || '#eee' }]}>
                  {getAppIcon(item.app, 20)}
                </View>
                <View style={s.hBody}>
                  <Text style={s.hNum}>{item.cc} {item.num}</Text>
                  <Text style={s.hMeta}>{app?.name || item.app} · {relativeTime(item.ts)}</Text>
                </View>
                <Text style={s.hArr}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Country</Text>
            <TouchableOpacity onPress={() => { setShowPicker(false); setSearch(''); }}>
              <Text style={s.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={s.modalSearch}
            value={search}
            onChangeText={setSearch}
            placeholder="Search country or code…"
            placeholderTextColor="#9A948E"
            autoFocus
          />
          <FlatList
            data={filteredCC}
            keyExtractor={(item, i) => item.code + item.name + i}
            renderItem={({ item }) => (
              <TouchableOpacity style={[s.ccItem, item.code === cc && s.ccItemSel]} onPress={() => selectCC(item)}>
                <Text style={s.ccItemFlag}>{item.flag}</Text>
                <Text style={s.ccItemName}>{item.name}</Text>
                <Text style={s.ccItemCode}>{item.code}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:      { flex: 1, backgroundColor: '#F7F5F2' },
  container:   { padding: 16, paddingBottom: 32, gap: 12 },
  card:        { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardLabel:   { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: '#9A948E', padding: 18, paddingBottom: 10 },
  phoneRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 18, marginBottom: 4 },
  ccBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 52, backgroundColor: '#EFECE8', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.12)' },
  ccFlag:      { fontSize: 18 },
  ccCode:      { fontSize: 13, fontWeight: '600', color: '#1A1814' },
  ccCaret:     { fontSize: 9, color: '#9A948E' },
  numInput:    { flex: 1, height: 52, paddingHorizontal: 14, backgroundColor: '#EFECE8', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.12)', fontSize: 20, fontWeight: '500', color: '#1A1814', letterSpacing: 0.5 },
  clipTag:     { marginHorizontal: 18, marginBottom: 8, backgroundColor: '#EDF7F0', borderWidth: 1, borderColor: '#B8E6C8', borderRadius: 8, padding: 7, paddingHorizontal: 10 },
  clipText:    { fontSize: 12, fontWeight: '500', color: '#166534' },
  errTag:      { marginHorizontal: 18, marginBottom: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 8, padding: 7, paddingHorizontal: 10 },
  errText:     { fontSize: 12, fontWeight: '500', color: '#991B1B' },
  appsArea:    { backgroundColor: '#F7F5F2', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)', padding: 16 },
  appsLabel:   { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: '#9A948E', marginBottom: 12 },
  appsRow:     { flexDirection: 'row', gap: 8 },
  appBtn:      { flex: 1, alignItems: 'center', gap: 7, paddingVertical: 14, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.12)' },
  appBtnDim:   { opacity: 0.38 },
  appBtnName:  { fontSize: 11, fontWeight: '600', color: '#4A4540' },
  section:     { gap: 6 },
  secHead:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, marginBottom: 2 },
  secTitle:    { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: '#9A948E' },
  secClear:    { fontSize: 12, color: '#9A948E' },
  hItem:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  hDot:        { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hBody:       { flex: 1 },
  hNum:        { fontSize: 14, fontWeight: '500', color: '#1A1814', marginBottom: 2, fontVariant: ['tabular-nums'] },
  hMeta:       { fontSize: 11, color: '#9A948E' },
  hArr:        { fontSize: 18, color: '#C5BFB9' },
  modal:       { flex: 1, backgroundColor: '#F7F5F2' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)' },
  modalTitle:  { fontSize: 17, fontWeight: '700', color: '#1A1814' },
  modalClose:  { fontSize: 15, color: '#1A1814', fontWeight: '600' },
  modalSearch: { margin: 12, padding: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', fontSize: 14, color: '#1A1814' },
  ccItem:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', backgroundColor: '#fff' },
  ccItemSel:   { backgroundColor: '#EFECE8' },
  ccItemFlag:  { fontSize: 20 },
  ccItemName:  { flex: 1, fontSize: 14, fontWeight: '500', color: '#1A1814' },
  ccItemCode:  { fontSize: 12, color: '#9A948E', fontVariant: ['tabular-nums'] },
});
