import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { NoSaveLogo } from '../icons';

export default function OnboardingScreen({ onAllow, onSkip }) {
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1814" />
      <View style={s.hero}>
        <View style={s.logoWrap}>
          <NoSaveLogo size={36} />
        </View>
        <Text style={s.heroTitle}>NoSave</Text>
        <Text style={s.heroSub}>Message anyone. Save no one.</Text>
      </View>

      <ScrollView style={s.body} contentContainerStyle={s.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={s.pill} />
        <Text style={s.heading}>Private messaging,{'\n'}without the clutter.</Text>
        <Text style={s.desc}>
          Reach anyone on WhatsApp, Telegram, or Signal instantly — without adding them to your contacts.
        </Text>

        <View style={s.permBox}>
          <Text style={s.permTitle}>WHAT NOSAVE ACCESSES</Text>
          {[
            { icon: '📞', text: 'Recent call history, to surface numbers fast' },
            { icon: '🔒', text: 'Everything stays on your device only' },
            { icon: '🚫', text: 'No account, no tracking, no ads — ever' },
          ].map((item, i) => (
            <View key={i} style={[s.permRow, i === 2 && { borderBottomWidth: 0 }]}>
              <View style={s.permIcon}><Text style={s.permIconText}>{item.icon}</Text></View>
              <Text style={s.permText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.allowBtn} onPress={onAllow} activeOpacity={0.85}>
          <Text style={s.allowText}>Allow &amp; Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.skipBtn} onPress={onSkip} activeOpacity={0.7}>
          <Text style={s.skipText}>Skip — I'll enter numbers manually</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#1A1814' },
  hero:        { backgroundColor: '#1A1814', alignItems: 'center', paddingTop: 40, paddingBottom: 50 },
  logoWrap:    { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle:   { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 6 },
  heroSub:     { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  body:        { flex: 1, backgroundColor: '#F7F5F2', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24 },
  bodyContent: { padding: 24, paddingBottom: 40 },
  pill:        { width: 36, height: 4, backgroundColor: '#C5BFB9', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  heading:     { fontSize: 22, fontWeight: '700', color: '#1A1814', letterSpacing: -0.6, marginBottom: 10, lineHeight: 30 },
  desc:        { fontSize: 14, color: '#4A4540', lineHeight: 22, marginBottom: 24 },
  permBox:     { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', borderRadius: 14, overflow: 'hidden', marginBottom: 24 },
  permTitle:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.3, color: '#9A948E', padding: 10, paddingHorizontal: 14, backgroundColor: '#EFECE8', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)' },
  permRow:     { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)', gap: 12 },
  permIcon:    { width: 32, height: 32, borderRadius: 9, backgroundColor: '#F7F5F2', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', alignItems: 'center', justifyContent: 'center' },
  permIconText:{ fontSize: 15 },
  permText:    { flex: 1, fontSize: 13, color: '#4A4540', lineHeight: 18 },
  allowBtn:    { backgroundColor: '#1A1814', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  allowText:   { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  skipBtn:     { alignItems: 'center', padding: 10 },
  skipText:    { fontSize: 13, color: '#9A948E' },
});
