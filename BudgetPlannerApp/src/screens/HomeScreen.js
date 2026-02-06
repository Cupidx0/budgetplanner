import React, { useState, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { salaryAPI, userAPI } from '../services/api';
import { authAPI } from '../services/api';

// add icon imports
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [user, setUser] = useState(null);
  const [weeklyEarnings, setWeeklyEarnings] = useState(null);
  const [monthlySalary, setMonthlySalary] = useState(null);
  const [salaryAfterBills, setSalaryAfterBills] = useState(null);
  const [hourlyRate, setHourlyRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analysisReview, setAnalysisReview] = useState('');
  const [greeting, setGreeting] = useState('');
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentHour = new Date().getHours();
      let greet = '';
      if (currentHour < 12) {
        greet = 'Good Morning!';
      } else if (currentHour < 18) {
        greet = 'Good Afternoon!';
      } else {
        greet = 'Good Evening!';
      }
      setGreeting(greet);
      const userData = await authAPI.getCurrentUser();
      if (userData) {
        setUser(userData);
        const userId = userData.user_id;

        // Load all data in parallel
        const [weeklyData, monthlyData, afterBillsData, rateData] = await Promise.all([
          salaryAPI.getWeeklyEarnings(userId).catch(() => null),
          salaryAPI.getMonthlySalary(userId).catch(() => null),
          salaryAPI.getSalaryAfterBills(userId).catch(() => null),
          userAPI.getHourlyRate(userId).catch(() => null),
        ]);

        setWeeklyEarnings(weeklyData);
        setMonthlySalary(monthlyData);
        setSalaryAfterBills(afterBillsData);
        setHourlyRate(rateData?.hourly_rate || null);
        try {
          // Extract numeric values safely
          const monthlyAmount = Number(monthlyData?.net_salary ?? monthlyData?.monthly_salary ?? 0);
          const afterBillsAmount = Number(afterBillsData?.net_after_bills ?? afterBillsData?.net_after_bills ?? 0);

          // Check for insufficient data first
          // Compare numeric values
          if (monthlyAmount < afterBillsAmount && afterBillsAmount > 0) {
            console.log('analysis review: Your monthly salary is less than your salary after bills. Please check your bill entries.');
            setAnalysisReview('Your monthly salary is less than your salary after bills. Please check your bill entries.');
          }
          else if (afterBillsAmount < monthlyAmount * 0.2) {
            console.log('analysis review: Your salary after bills is less than 20% of your monthly salary. Consider reviewing your expenses.');
            setAnalysisReview('Your salary after bills is less than 20% of your monthly salary. Consider reviewing your expenses.');
          }
          else if (afterBillsAmount < monthlyAmount * 0.5) {
            console.log('analysis review: Your salary after bills is less than 50% of your monthly salary. Try to manage your bills better.');
            setAnalysisReview('Your salary after bills is less than 50% of your monthly salary. Try to manage your bills better.');
          }
          else if (afterBillsAmount < monthlyAmount * 0.75) {
            console.log('analysis review: Your salary after bills is less than 75% of your monthly salary. You are doing okay, but there is room for improvement.');
            setAnalysisReview('Your salary after bills is less than 75% of your monthly salary. You are doing okay, but there is room for improvement.');
          }
          else if(afterBillsAmount < monthlyAmount) {
            console.log('analysis review: Your salary after bills is less than your monthly salary. Good job, but keep an eye on your expenses.');
            setAnalysisReview('Your salary after bills is less than your monthly salary. Good job, but keep an eye on your expenses.');
          }
           else {
            console.log('analysis review: Insufficient data to analyze salary after bills.');
            setAnalysisReview('Insufficient data to analyze salary after bills.');
          }
        } catch (error) {
          console.error('Error analyzing salary data:', error);
          setAnalysisReview('Error analyzing salary data.');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <MaterialIcons name="account-circle" size={48} color="#007AFF" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.greeting}>Welcome back, {user?.username || 'User'}!</Text>
            <Text style= {styles.greetingSmall}>{greeting} Here's your financial overview.</Text>
          </View>
        </View>
        {hourlyRate && (
          <Text style={styles.hourlyRate}>Hourly Rate: ${hourlyRate.toFixed(2)}</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="calendar-week" size={20} color="#007AFF" />
          <Text style={styles.cardTitle}>Weekly Earnings</Text>
        </View>
        <Text style={styles.cardValue}>
          ${weeklyEarnings?.total_earnings?.toFixed(2) || '0.00'}
        </Text>
        <Text style={styles.cardSubtext}>
          Week {weeklyEarnings?.week_number || 'N/A'} of {weeklyEarnings?.year || new Date().getFullYear()}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="cash-multiple" size={20} color="#007AFF" />
          <Text style={styles.cardTitle}>Monthly Salary</Text>
        </View>
        {monthlySalary ? (
          <>
            <Text style={styles.cardValue}>
              ${monthlySalary.net_salary?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.cardSubtext}>
              Gross: ${monthlySalary.gross_salary?.toFixed(2) || '0.00'} | 
              Tax: ${monthlySalary.tax?.toFixed(2) || '0.00'}
            </Text>
          </>
        ) : (
          <Text style={styles.cardSubtext}>No data available</Text>
        )}
      </View>

      {salaryAfterBills && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="wallet-outline" size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>After Bills</Text>
          </View>
          <Text style={styles.cardValue}>
            ${salaryAfterBills.net_after_bills?.toFixed(2)|| '0.00'}
          </Text>
          <Text style={styles.cardSubtext}>
            {salaryAfterBills.percentage_after_bills?.toFixed(1) || '0'}% remaining
          </Text>
        </View>
      )}
      <View style={styles.analysisCard}>
        <Text style={styles.cardTitle}>Analysis Review</Text>
        <Text style={styles.cardSubtext}>
          {analysisReview || 'No analysis available'}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          {'  '}💡 Tip: Track your daily work hours to see accurate weekly and monthly earnings!
        </Text>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  greetingSmall: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  hourlyRate: {
    fontSize: 16,
    color: '#8E8E93',
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 8,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  cardSubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
  },
  analysisCard: {
    backgroundColor: '#FFF3E0',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA726',
  },
  analysisText: {
    fontSize: 14,
    color: '#00e632ff',
  },
});

