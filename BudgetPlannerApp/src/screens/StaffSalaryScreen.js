import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { employerShiftAPI } from '../services/api';

export default function StaffSalaryScreen() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSalaryDetails, setEmployeeSalaryDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchEmployees();
    }
  }, [userId]);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, employees]);

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

  const fetchEmployees = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await employerShiftAPI.getEmployees(userId);
      if (response.success) {
        setEmployees(response.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to load employees',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load employees',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    if (!query) {
      setFilteredEmployees(employees);
      return;
    }

    const filtered = employees.filter(
      employee =>
        employee.name.toLowerCase().includes(query.toLowerCase()) ||
        employee.email.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  const fetchEmployeeSalaryDetails = async (employeeId) => {
    try {
      const response = await employerShiftAPI.getEmployeeSalaryDetails(employeeId);
      if (response.success) {
        setEmployeeSalaryDetails(response.data);
        setShowDetails(true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to load salary details',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load salary details',
        visibilityTime: 3000,
      });
    }
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    fetchEmployeeSalaryDetails(employee.id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
  };

  const renderEmployeeCard = ({ item }) => {
    const totalEarnings = item.monthlySalary || item.calculatedSalary || 0;
    const hourlyRate = item.hourlyRate || 0;

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => handleViewDetails(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.employeeInfo}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={20} color="#fff" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.employeeName}>{item.name}</Text>
              <Text style={styles.employeeSubtext}>
                £{hourlyRate.toFixed(2)}/hr • {item.totalShifts} shifts
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.salaryRow}>
            <View>
              <Text style={styles.salaryLabel}>Monthly Earnings</Text>
              <Text style={styles.salaryAmount}>£{totalEarnings.toFixed(2)}</Text>
            </View>
            <View>
              <Text style={styles.salaryLabel}>Hours This Month</Text>
              <Text style={styles.salaryAmount}>{item.hoursWorked.toFixed(1)}h</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
            <Text style={styles.statusText}>Active</Text>
          </View>
          <MaterialIcons name="info" size={16} color="#007AFF" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSalaryDetails = () => {
    if (!employeeSalaryDetails) return null;

    const {
      employeeName,
      hourlyRate,
      monthlyTotal,
      weeklyTotal,
      monthlyHours,
      recentShifts,
    } = employeeSalaryDetails;

    return (
      <View style={styles.detailsContainer}>
        <View style={styles.detailsHeader}>
          <TouchableOpacity 
            onPress={() => setShowDetails(false)}
            style={styles.closeButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.detailsTitle}>{employeeName}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Hourly Rate</Text>
            <Text style={styles.statValue}>£{hourlyRate.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={styles.statValue}>£{monthlyTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={styles.statValue}>£{weeklyTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Hours/Month</Text>
            <Text style={styles.statValue}>{monthlyHours.toFixed(1)}h</Text>
          </View>
        </View>

        {/* Recent Shifts */}
        <View style={styles.shiftsSection}>
          <Text style={styles.sectionTitle}>Recent Shifts</Text>
          {recentShifts.length > 0 ? (
            <FlatList
              data={recentShifts}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.shiftItem}>
                  <View style={styles.shiftInfo}>
                    <Text style={styles.shiftDate}>{item.date}</Text>
                    <Text style={styles.shiftHours}>{item.hours}h</Text>
                  </View>
                  <View style={styles.shiftEarnings}>
                    <Text
                      style={[
                        styles.shiftStatus,
                        {
                          color: item.status === 'approved' ? '#34C759' : '#FF9500',
                        },
                      ]}
                    >
                      {item.status}
                    </Text>
                    <Text style={styles.shiftAmount}>£{item.earnings.toFixed(2)}</Text>
                  </View>
                </View>
              )}
              keyExtractor={item => item.id}
            />
          ) : (
            <Text style={styles.noShiftsText}>No shifts found</Text>
          )}
        </View>
      </View>
    );
  };

  if (showDetails) {
    return (
      <View style={styles.container}>
        {renderSalaryDetails()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff Salary Management</Text>
        <Text style={styles.subtitle}>Total: {filteredEmployees.length}</Text>
      </View>

      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Employees</Text>
          <Text style={styles.summaryValue}>{employees.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Monthly</Text>
          <Text style={styles.summaryValue}>
            £{(
              employees.reduce((sum, emp) => sum + (emp.monthlySalary || emp.calculatedSalary || 0), 0)
            ).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : filteredEmployees.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="account-off" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No employees found' : 'No employees'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          renderItem={renderEmployeeCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#eee',
    marginHorizontal: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  employeeSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  salaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  salaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fafafa',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  // Details Screen Styles
  detailsContainer: {
    flex: 1,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summarySection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  shiftsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  shiftItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  shiftInfo: {
    flex: 1,
  },
  shiftDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  shiftHours: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  shiftEarnings: {
    alignItems: 'flex-end',
  },
  shiftStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  shiftAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
  },
  noShiftsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
});
