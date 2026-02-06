import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { employerShiftAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function Admin({ navigation }) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingShifts: 0,
    totalMonthlyPayroll: 0,
    completedShifts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      loadDashboardStats();
    }
  }, [userId]);

  const loadUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.user_id);
      }
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };

  const loadDashboardStats = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Load employees
      const employeesResponse = await employerShiftAPI.getEmployees(userId);
      if (employeesResponse.success) {
        const employees = employeesResponse.data;
        const totalEmployees = employees.length;
        const totalMonthlyPayroll = employees.reduce((sum, emp) => {
          return sum + (emp.monthlySalary || emp.calculatedSalary || 0);
        }, 0);

        setStats(prev => ({
          ...prev,
          totalEmployees,
          totalMonthlyPayroll,
        }));
      }

      // Load pending shifts
      const shiftsResponse = await employerShiftAPI.getPendingShifts(userId);
      if (shiftsResponse.success) {
        setStats(prev => ({
          ...prev,
          pendingShifts: shiftsResponse.data.length,
          completedShifts: shiftsResponse.data.filter(s => s.status === 'approved').length,
        }));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load dashboard stats',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToTab = (tabName) => {
    navigation?.getParent()?.navigate(tabName);
  };

  const StatCard = ({ icon, label, value, color = '#007AFF' }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        {typeof icon === 'string' ? (
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        ) : (
          <MaterialIcons name={icon} size={24} color={color} />
        )}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
    </View>
  );

  const ActionCard = ({ 
    icon, 
    title, 
    subtitle, 
    color = '#007AFF',
    onPress 
  }) => (
    <TouchableOpacity 
      style={[styles.actionCard, { borderTopColor: color }]}
      onPress={onPress}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: `${color}20` }]}>
        {typeof icon === 'string' ? (
          <MaterialCommunityIcons name={icon} size={28} color={color} />
        ) : (
          <MaterialIcons name={icon} size={28} color={color} />
        )}
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#999" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back, Manager</Text>
      </View>

      {/* Stats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="account-multiple"
            label="Total Employees"
            value={stats.totalEmployees}
            color="#007AFF"
          />
          <StatCard
            icon="clock-check-outline"
            label="Pending Shifts"
            value={stats.pendingShifts}
            color="#FF9500"
          />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            icon="cash-multiple"
            label="Monthly Payroll"
            value={`£${stats.totalMonthlyPayroll.toFixed(2)}`}
            color="#34C759"
          />
          <StatCard
            icon="check-circle-outline"
            label="Completed Shifts"
            value={stats.completedShifts}
            color="#5AC8FA"
          />
        </View>
      </View>

      {/* Quick Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <ActionCard
          icon="plus-circle-outline"
          title="Create Shift"
          subtitle="Create a new shift for an employee"
          color="#007AFF"
          onPress={() => navigateToTab('CreateShift')}
        />

        <ActionCard
          icon="check-circle-outline"
          title="Approve Shifts"
          subtitle={`${stats.pendingShifts} shifts waiting`}
          color="#FF9500"
          onPress={() => navigateToTab('ApproveShift')}
        />

        <ActionCard
          icon="cash-multiple"
          title="Staff Salary"
          subtitle="View and manage employee salaries"
          color="#34C759"
          onPress={() => navigateToTab('StaffSalary')}
        />

        <ActionCard
          icon="account-multiple"
          title="Manage Employees"
          subtitle={`${stats.totalEmployees} employees`}
          color="#5AC8FA"
          onPress={() => navigateToTab('Employees')}
        />
      </View>

      {/* Info Section */}
      <View style={styles.section}>
        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={24} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Payroll Management</Text>
            <Text style={styles.infoText}>
              All salary updates are automatic when you approve shifts. Staff earnings are calculated based on hourly rates and approved hours.
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderTopWidth: 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E7F3FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
});