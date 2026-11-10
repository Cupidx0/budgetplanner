import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function InsightsScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Insights</Text>
      <Text style={styles.pageTitle}>Smart recommendations</Text>

      <View style={styles.cardGrid}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Emergency fund</Text>
          <Text style={styles.cardValue}>$1,800</Text>
          <Text style={styles.cardMeta}>Healthy reserve for irregular costs</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Cash runway</Text>
          <Text style={styles.cardValue}>3.6 weeks</Text>
          <Text style={styles.cardMeta}>Comfortable cushion before next income</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Flex spending</Text>
          <Text style={styles.cardValue}>12%</Text>
          <Text style={styles.cardMeta}>Headroom for lifestyle and travel</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Focus this month</Text>
        <Text style={styles.bodyText}>Keep fixed spending under 60% of net income. Any surplus should go to savings and debt reduction before lifestyle upgrades.</Text>
        <Text style={styles.bodyText}>Your strongest optimization move is reducing optional spend by 10% and redirecting it into your emergency and long-term goals.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  content: {
    padding: 20,
    gap: 18,
  },
  eyebrow: {
    color: '#7d86a8',
    fontSize: 11,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  pageTitle: {
    color: '#1a2540',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 6,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#1d2b4d',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardLabel: {
    color: '#7d86a8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardValue: {
    color: '#1a2540',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 10,
  },
  cardMeta: {
    color: '#687694',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 20,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#1d2b4d',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  panelTitle: {
    color: '#1a2540',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  bodyText: {
    color: '#46577b',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
});
