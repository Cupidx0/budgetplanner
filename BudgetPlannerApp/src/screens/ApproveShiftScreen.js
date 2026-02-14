import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { employerShiftAPI, employerEmployeeShiftAPI } from '../services/api';

export default function ApproveShiftScreen() {
  const [shifts, setShifts] = useState([]);
  const [employeeSubmittedShifts, setEmployeeSubmittedShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('employer');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchPendingShifts();
      fetchEmployeeSubmittedShifts();
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

  const fetchPendingShifts = async () => {
    if (!userId) return;
    
    try {
      const response = await employerShiftAPI.getPendingShifts(userId);
      if (response.success) {
        setShifts(response.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to load pending shifts',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load pending shifts',
        visibilityTime: 3000,
      });
    }
  };

  const fetchEmployeeSubmittedShifts = async () => {
    if (!userId) return;
    
    try {
      const response = await employerEmployeeShiftAPI.getPendingEmployeeShifts(userId);
      if (response.success) {
        setEmployeeSubmittedShifts(response.data);
      } else {
        // Don't show error if endpoint returns nothing
        setEmployeeSubmittedShifts([]);
      }
    } catch (error) {
      console.error('Error loading employee submitted shifts:', error);
      setEmployeeSubmittedShifts([]);
    }
  };

  const handleApproveShift = async (shiftId, isEmployeeSubmitted = false) => {
    try {
      console.log('Approving shift:', shiftId);
      const response = await employerShiftAPI.approveShift(shiftId);
      console.log('Approve response:', response);
      
      if (response && response.success) {
        if (isEmployeeSubmitted) {
          setEmployeeSubmittedShifts(employeeSubmittedShifts.filter(shift => shift.id !== shiftId));
        } else {
          setShifts(shifts.filter(shift => shift.id !== shiftId));
        }
        
        Toast.show({
          type: 'success',
          text1: 'Approved',
          text2: 'Shift has been approved and employee notified',
          visibilityTime: 3000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response?.message || 'Failed to approve shift',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error('Approve shift error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to approve shift',
        visibilityTime: 3000,
      });
    }
  };
  const handleOvertimeShift = async (shiftId, isEmployeeSubmitted = false) => {
    try {
      console.log('Approving overtime shift:', shiftId);
      const response = await employerShiftAPI.approveOvertimeShift(shiftId);
      console.log('Approve overtime response:', response);
      
      if (response && response.success) {
        if (isEmployeeSubmitted) {
          setEmployeeSubmittedShifts(employeeSubmittedShifts.filter(shift => shift.id !== shiftId));
        } else {
          setShifts(shifts.filter(shift => shift.id !== shiftId));
        }
        
        Toast.show({
          type: 'success',
          text1: 'Approved',
          text2: 'Shift has been approved and employee notified',
          visibilityTime: 3000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response?.message || 'Failed to approve shift',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error('Approve shift error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to approve shift',
        visibilityTime: 3000,
      });
    }
  };
  const handleRejectShift = async (shiftId, isEmployeeSubmitted = false) => {
    Alert.alert(
      'Reject Shift',
      'Are you sure you want to reject this shift?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Reject',
          onPress: async () => {
            try {
              console.log('Rejecting shift:', shiftId);
              const response = await employerShiftAPI.rejectShift(shiftId);
              console.log('Reject response:', response);
              
              if (response && response.success) {
                if (isEmployeeSubmitted) {
                  setEmployeeSubmittedShifts(employeeSubmittedShifts.filter(shift => shift.id !== shiftId));
                } else {
                  setShifts(shifts.filter(shift => shift.id !== shiftId));
                }
                
                Toast.show({
                  type: 'info',
                  text1: 'Rejected',
                  text2: 'Shift has been rejected and employee notified',
                  visibilityTime: 3000,
                });
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: response?.message || 'Failed to reject shift',
                  visibilityTime: 3000,
                });
              }
            } catch (error) {
              console.error('Reject shift error:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to reject shift',
                visibilityTime: 3000,
              });
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderShiftCard = ({ item }, isEmployeeSubmitted = false) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.employeeName}>{item.employeeName || 'Unnamed Employee'}</Text>
          {isEmployeeSubmitted && (
            <View style={styles.submittedBadge}>
              <MaterialCommunityIcons name="check-circle-outline" size={12} color="#007AFF" />
              <Text style={styles.submittedBadgeText}>Submitted by Employee</Text>
            </View>
          )}
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status?.toUpperCase() || 'PENDING'}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.row}>
          <MaterialIcons name="date-range" size={16} color="#666" />
          <Text style={styles.infoText}>{item.date}</Text>
        </View>
        <View style={styles.row}>
          <MaterialIcons name="access-time" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.startTime} - {item.endTime}
          </Text>
        </View>
        <View style={styles.row}>
          <MaterialIcons name="schedule" size={16} color="#666" />
          <Text style={styles.infoText}>{item.hoursWorked} hours</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => handleRejectShift(item.id, isEmployeeSubmitted)}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.overtimeButton]}
          onPress={() => handleOvertimeShift(item.id, isEmployeeSubmitted)}
        >
          <Text style={styles.overtimeButtonText}>Approve Overtime</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => handleApproveShift(item.id, isEmployeeSubmitted)}
        >
          <Text style={styles.approveButtonText}>Approve Regular Shift</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Approve Shifts</Text>
        <Text style={styles.subtitle}>Manage all shift requests</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'employer' && styles.activeTab]}
          onPress={() => setActiveTab('employer')}
        >
          <Text style={[styles.tabText, activeTab === 'employer' && styles.activeTabText]}>
            My Created Shifts ({shifts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'employee' && styles.activeTab]}
          onPress={() => setActiveTab('employee')}
        >
          <Text style={[styles.tabText, activeTab === 'employee' && styles.activeTabText]}>
            Employee Requests ({employeeSubmittedShifts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : activeTab === 'employer' ? (
        shifts.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialIcons name="check-circle" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No pending shifts</Text>
          </View>
        ) : (
          <FlatList
            data={shifts}
            renderItem={(props) => renderShiftCard(props, false)}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
        )
      ) : employeeSubmittedShifts.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No employee requests</Text>
          <Text style={styles.emptySubtext}>Employees can submit shift requests from their app</Text>
        </View>
      ) : (
        <FlatList
          data={employeeSubmittedShifts}
          renderItem={(props) => renderShiftCard(props, true)}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  submittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  submittedBadgeText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  button: {
    flex:0.46,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  overtimeButton: {
    backgroundColor: '#c7a034',
  },
  overtimeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  rejectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 4,
  },
});
