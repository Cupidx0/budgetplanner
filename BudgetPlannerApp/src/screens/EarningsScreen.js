import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { salaryAPI } from '../services/api';
import { authAPI } from '../services/api';

export default function EarningsScreen() {
  const [weeklyEarnings, setWeeklyEarnings] = useState(null);
  const [monthlySalary, setMonthlySalary] = useState(null);
  const [salaryAfterBills, setSalaryAfterBills] = useState(null);
  const [dailyHistory, setDailyHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadUser = async () => {
    const userData = await authAPI.getCurrentUser();
    setUser(userData);
  };

  const loadData = async () => {
    if (!user) return;
    try {
      const [weeklyData, monthlyData, afterBillsData, historyData] = await Promise.all([
        salaryAPI.getWeeklyEarnings(user.user_id).catch(() => null),
        salaryAPI.getMonthlySalary(user.user_id).catch(() => null),
        salaryAPI.getSalaryAfterBills(user.user_id).catch(() => null),
        salaryAPI.getDailySalaryHistory(user.user_id).catch(() => null),
      ]);

      setWeeklyEarnings(weeklyData);
      setMonthlySalary(monthlyData);
      setSalaryAfterBills(afterBillsData);
      setDailyHistory(historyData?.history || []);
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>Earnings Overview</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Earnings</Text>
          <Text style={styles.cardValue}>
            ${weeklyEarnings?.total_earnings?.toFixed(2) || '0.00'}
          </Text>
          <Text style={styles.cardSubtext}>
            Week {weeklyEarnings?.week_number || 'N/A'} of {weeklyEarnings?.year || new Date().getFullYear()}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Salary</Text>
          {monthlySalary ? (
            <>
              <Text style={styles.cardValue}>
                ${monthlySalary.net_salary?.toFixed(2) || '0.00'}
              </Text>
              <View style={styles.breakdown}>
                <Text style={styles.breakdownText}>
                  Gross: ${monthlySalary.gross_salary?.toFixed(2) || '0.00'}
                </Text>
                <Text style={styles.breakdownText}>
                  Tax: ${monthlySalary.tax?.toFixed(2) || '0.00'}
                </Text>
                <Text style={styles.breakdownText}>
                  Net: ${monthlySalary.net_salary?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.cardSubtext}>No data available</Text>
          )}
        </View>

        {salaryAfterBills && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>After Bills</Text>
            <Text style={styles.cardValue}>
              ${salaryAfterBills.net_after_bills?.toFixed(2) || '0.00'}
            </Text>
            <View style={styles.breakdown}>
              <Text style={styles.breakdownText}>
                Monthly Salary: ${salaryAfterBills.monthly_salary?.toFixed(2) || '0.00'}
              </Text>
              <Text style={styles.breakdownText}>
                Total Bills: ${salaryAfterBills.total_bills?.toFixed(2) || '0.00'}
              </Text>
              <Text style={styles.breakdownText}>
                Remaining: {salaryAfterBills.percentage_after_bills?.toFixed(1) || '0'}%
              </Text>
            </View>
          </View>
        )}

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Daily Earnings</Text>
          {dailyHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No daily earnings recorded yet</Text>
            </View>
          ) : (
            dailyHistory.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyDate}>{item.date}</Text>
                <Text style={styles.historyAmount}>${item.amount.toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  cardSubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  breakdown: {
    marginTop: 10,
  },
  breakdownText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  historySection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#000',
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyDate: {
    fontSize: 16,
    color: '#000',
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});

