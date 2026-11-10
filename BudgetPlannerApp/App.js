import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import OverviewScreen from './src/screens/OverviewScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';

const screens = [
  { key: 'Overview', label: 'Overview' },
  { key: 'Insights', label: 'Insights' },
  { key: 'Assistant', label: 'Assistant' },
  { key: 'Transactions', label: 'Transactions' },
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState('Overview');

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Insights':
        return <InsightsScreen />;
      case 'Assistant':
        return <AssistantScreen />;
      case 'Transactions':
        return <TransactionsScreen />;
      default:
        return <OverviewScreen onNavigate={setActiveScreen} />;
    }
  };

  return (
    <SafeAreaView style={styles.appShell}>
      <StatusBar style="light" />
      <View style={styles.layout}>
        <View style={styles.sidebar}>
          <View style={styles.brandBlock}>
            <View style={styles.brandMark}>BP</View>
            <View>
              <Text style={styles.eyebrow}>Finance suite</Text>
              <Text style={styles.brandTitle}>Budget Planner</Text>
            </View>
          </View>

          <View style={styles.nav}>
            {screens.map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => setActiveScreen(item.key)}
                style={[styles.navItem, activeScreen === item.key && styles.navItemActive]}
              >
                <Text style={[styles.navText, activeScreen === item.key && styles.navTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.main}>{renderScreen()}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f7fb',
  },
  sidebar: {
    width: 260,
    backgroundColor: '#101b38',
    padding: 24,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#5b7cff',
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 44,
  },
  eyebrow: {
    color: '#9aa8c7',
    fontSize: 11,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  brandTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  nav: {
    gap: 10,
  },
  navItem: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: 'rgba(91,124,255,0.18)',
  },
  navText: {
    color: '#dfe7ff',
    fontSize: 15,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#fff',
  },
  main: {
    flex: 1,
  },
});

