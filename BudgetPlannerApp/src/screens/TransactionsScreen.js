import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatMoney, transactions } from '../data/mockData';

export default function TransactionsScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Transactions</Text>
      <Text style={styles.pageTitle}>Recent activity</Text>

      <View style={styles.panel}>
        {transactions.map((item) => (
          <View key={`${item.title}-${item.time}`} style={styles.transactionRow}>
            <View>
              <Text style={styles.transactionTitle}>{item.title}</Text>
              <Text style={styles.transactionMeta}>{item.time}</Text>
            </View>
            <Text style={[styles.transactionAmount, item.amount > 0 ? styles.positive : styles.negative]}>
              {item.amount > 0 ? '+' : ''}
              {formatMoney(item.amount)}
            </Text>
          </View>
        ))}
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
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f8',
  },
  transactionTitle: {
    color: '#1a2540',
    fontSize: 15,
    fontWeight: '600',
  },
  transactionMeta: {
    color: '#7d86a8',
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  positive: {
    color: '#2cb57d',
  },
  negative: {
    color: '#e16a6a',
  },
});
