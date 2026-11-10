import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  budgetCategories,
  formatMoney,
  transactions,
} from '../data/mockData';

export default function OverviewScreen({ onNavigate }) {
  const totalSpent = budgetCategories.reduce((sum, item) => sum + item.amount, 0);
  const monthlyIncome = 6200;
  const savingsTarget = 2400;
  const emergencyFund = 1800;
  const remaining = monthlyIncome - totalSpent - savingsTarget;
  const goalProgress = Math.min((savingsTarget / monthlyIncome) * 100, 100);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Monthly overview</Text>
          <Text style={styles.pageTitle}>Financial health</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={() => onNavigate('Insights')}>
          <Text style={styles.primaryButtonText}>View report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Net income</Text>
          <Text style={styles.metricValue}>{formatMoney(monthlyIncome)}</Text>
          <Text style={styles.metricDeltaPositive}>+8.2% vs last month</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total spend</Text>
          <Text style={styles.metricValue}>{formatMoney(totalSpent)}</Text>
          <Text style={styles.metricDeltaNegative}>-4.1% below plan</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Remaining</Text>
          <Text style={styles.metricValue}>{formatMoney(remaining)}</Text>
          <Text style={styles.metricDeltaPositive}>Healthy runway</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Budget breakdown</Text>
          <Text style={styles.chip}>Live</Text>
        </View>

        <View style={styles.budgetList}>
          {budgetCategories.map((item) => (
            <View key={item.name} style={styles.budgetRow}>
              <View style={styles.labelWrap}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={styles.budgetName}>{item.name}</Text>
              </View>
              <Text style={styles.budgetAmount}>{formatMoney(item.amount)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Recent transactions</Text>
          <Text style={styles.chip}>Updated today</Text>
        </View>

        <View style={styles.transactionsList}>
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
      </View>

      <View style={styles.sidebarCard}>
        <Text style={styles.eyebrow}>Savings target</Text>
        <Text style={styles.metricValueDark}>{formatMoney(savingsTarget)}</Text>
        <Text style={styles.mutedText}>Goal progress {Math.round(goalProgress)}%</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${goalProgress}%` }]} />
        </View>
        <Text style={styles.mutedText}>Emergency fund {formatMoney(emergencyFund)}</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    color: '#7d86a8',
    fontSize: 11,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pageTitle: {
    color: '#1a2540',
    fontSize: 32,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: '#5b7cff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#1d2b4d',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  metricLabel: {
    color: '#7d86a8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  metricValue: {
    color: '#1a2540',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  metricValueDark: {
    color: '#1a2540',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  metricDeltaPositive: {
    marginTop: 10,
    color: '#2cb57d',
    fontSize: 12,
    fontWeight: '700',
  },
  metricDeltaNegative: {
    marginTop: 10,
    color: '#e16a6a',
    fontSize: 12,
    fontWeight: '700',
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
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  panelTitle: {
    color: '#1a2540',
    fontSize: 18,
    fontWeight: '700',
  },
  chip: {
    backgroundColor: '#eef3ff',
    borderRadius: 999,
    color: '#4e6ef2',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  budgetList: {
    gap: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  budgetName: {
    color: '#273350',
    fontSize: 15,
    fontWeight: '600',
  },
  budgetAmount: {
    color: '#1a2540',
    fontSize: 15,
    fontWeight: '700',
  },
  transactionsList: {
    gap: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
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
  sidebarCard: {
    backgroundColor: '#eef3ff',
    borderRadius: 18,
    padding: 18,
  },
  mutedText: {
    color: '#6a7896',
    fontSize: 12,
    marginTop: 8,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#dfe7ff',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#5b7cff',
  },
});
