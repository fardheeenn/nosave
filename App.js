import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Platform, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { STORAGE_KEYS, COUNTRY_CODES } from './src/constants';
import { NoSaveLogo } from './src/icons';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DialScreen from './src/screens/DialScreen';
import RecentsScreen from './src/screens/RecentsScreen';

export default function App() {
  const [onboarded, setOnboarded] = useState(null); // null = loading
  const [tab, setTab]             = useState('dial');
  const [pendingNum, setPendingNum] = useState(null); // { cc, num } from recents
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.ONBOARDED).then(v => {
      setOnboarded(v === '1');
    });
  }, []);

  async function finishOnboarding(allowed) {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDED, '1');
    if (allowed) await AsyncStorage.setItem(STORAGE_KEYS.CALL_PERM, 'granted');
    setOnboarded(true);
  }

  function switchTab(t) {
    setTab(t);
    Animated.spring(tabAnim, {
      toValue: t === 'dial' ? 0 : 1,
      useNativeDriver: false,
      tension: 80, friction: 12,
    }).start();
  }

  // Called from RecentsScreen when user taps a call log entry
  function handleSelectFromRecents(cc, num) {
    setPendingNum({ cc, num });
    switchTab('dial');
  }

  // Loading state
  if (onboarded === null) return <View style={{ flex: 1, backgroundColor: '#F7F5F2' }} />;

  // Onboarding
  if (!onboarded) {
    return <OnboardingScreen onAllow={() => finishOnboarding(true)} onSkip={() => finishOnboarding(false)} />;
  }

  const tabBgLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['1.5%', '51%'],
  });

  return (
    <SafeAreaView style={s.safe}>
      <ExpoStatusBar style="dark" backgroundColor="#F7F5F2" />

      {/* Top Bar */}
      <View style={s.topbar}>
        <View style={s.topbarLeft}>
          <View style={s.logoChip}>
            <NoSaveLogo size={20} />
          </View>
          <Text style={s.appName}>NoSave</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>PRIVATE & LOCAL</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <Animated.View style={[s.tabBg, { left: tabBgLeft }]} />
        <TouchableOpacity style={s.tab} onPress={() => switchTab('dial')} activeOpacity={0.8}>
          <Text style={[s.tabText, tab === 'dial' && s.tabTextOn]}>Dial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.tab} onPress={() => switchTab('recents')} activeOpacity={0.8}>
          <Text style={[s.tabText, tab === 'recents' && s.tabTextOn]}>Recents</Text>
        </TouchableOpacity>
      </View>

      {/* Panels */}
      <View style={s.panels}>
        <View style={[s.panel, tab !== 'dial' && s.hidden]}>
          <DialScreen pendingNum={pendingNum} onPendingConsumed={() => setPendingNum(null)} />
        </View>
        <View style={[s.panel, tab !== 'recents' && s.hidden]}>
          <RecentsScreen onSelectNumber={handleSelectFromRecents} />
        </View>
      </View>

      {/* Privacy Footer */}
      <View style={s.footer}>
        <View style={s.footerDot} />
        <Text style={s.footerText}>NoSave doesn't store or transmit your data</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#F7F5F2' },
  topbar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoChip:   { width: 36, height: 36, borderRadius: 11, backgroundColor: '#1A1814', alignItems: 'center', justifyContent: 'center' },
  appName:    { fontSize: 17, fontWeight: '800', color: '#1A1814', letterSpacing: -0.5 },
  badge:      { backgroundColor: '#EFECE8', borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:  { fontSize: 10, fontWeight: '600', color: '#9A948E', letterSpacing: 0.8 },
  tabs:       { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', padding: 4, position: 'relative', height: 44 },
  tabBg:      { position: 'absolute', top: 4, bottom: 4, width: '48%', backgroundColor: '#EFECE8', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
  tab:        { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  tabText:    { fontSize: 13, fontWeight: '600', color: '#9A948E' },
  tabTextOn:  { color: '#1A1814' },
  panels:     { flex: 1 },
  panel:      { flex: 1 },
  hidden:     { display: 'none' },
  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)', backgroundColor: '#F7F5F2' },
  footerDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  footerText: { fontSize: 11, color: '#9A948E', fontWeight: '500' },
});
