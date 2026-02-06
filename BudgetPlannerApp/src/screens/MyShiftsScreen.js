import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { employeeShiftSubmissionAPI } from '../services/api';

export default function MyShiftsScreen() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchSubmittedShifts();
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

  const fetchSubmittedShifts = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await employeeShiftSubmissionAPI.getAllShifts(userId);
      if (response.success) {
        setShifts(response.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to load shifts',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load shifts',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubmittedShifts();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      case 'pending':
        return '#FFA500';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <MaterialIcons name="check-circle" size={20} color="#34C759" />;
      case 'rejected':
        return <MaterialIcons name="cancel" size={20} color="#FF3B30" />;
      case 'pending':
        return <MaterialCommunityIcons name="clock-outline" size={20} color="#FFA500" />;
      default:
        return null;
    }
  };

  const renderShiftCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.shiftName}>{item.shiftName}</Text>
          <View style={styles.statusBadge}>
            {getStatusIcon(item.status)}
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
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
        <View style={styles.row}>
          <MaterialIcons name="access-time" size={16} color="#999" />
          <Text style={styles.timestampText}>
            Submitted: {new Date(item.createdAt).toLocaleDateString()} 
          </Text>
          <Text style={styles.timestampText}>
            Shift Type: {item.shiftType}
          </Text>
        </View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.pendingNote}>
          <MaterialCommunityIcons name="information" size={14} color="#FFA500" />
          <Text style={styles.pendingNoteText}>Awaiting employer approval</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Shifts</Text>
        <Text style={styles.subtitle}>Total: {shifts.length}</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : shifts.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="assignment" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No shifts yet</Text>
          <Text style={styles.emptySubtext}> Your first shift</Text>
        </View>

      ) : (
        <FlatList
          data={shifts}
          renderItem={renderShiftCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
            />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
  },
  pendingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFAED',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  pendingNoteText: {
    fontSize: 12,
    color: '#FFA500',
    fontWeight: '500',
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
