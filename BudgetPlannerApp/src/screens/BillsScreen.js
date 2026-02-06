import React, { useState, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { billsAPI } from '../services/api';
import { authAPI } from '../services/api';

export default function BillsScreen() {
  const [bills, setBills] = useState([]);
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billquestion, setBillquestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadBills();
    }
  }, [user]);

  const loadUser = async () => {
    const userData = await authAPI.getCurrentUser();
    setUser(userData);
  };

  const loadBills = async () => {
    if (!user) return;
    try {
      const response = await billsAPI.getBills(user.user_id);
      setBills(response.bills || []);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddBill = async () => {
    if (!billName || !billAmount) {
      Alert.alert('Error', 'Please fill in all fields');
      Toast.show({
        type:"error",
        text1:"Error",
        text2:"Please fill in all fields",
      });
      return;
    }

    if (isNaN(parseFloat(billAmount)) || parseFloat(billAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      Toast.show({
        type:"error",
        text1:"Error",
        text2:"Please enter a valid amount",
      });
      return;
    }

    setLoading(true);
    try {
      await billsAPI.addBill(user.user_id, billName, billAmount);
      setBillName('');
      setBillAmount('');
      Alert.alert('Success', 'Bill added successfully');
      Toast.show({
        type:"success",
        text1:"Success",
        text2:"Bill added successfully",
      });
      loadBills();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add bill');
      Toast.show({
        type:"error",
        text1:"Error",
        text2:error.response?.data?.error || 'Failed to add bill',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = async (billId) => {
    setLoading(true);
    try {
      await billsAPI.deleteBill(user.user_id, billId);
      Alert.alert('Success', 'Bill deleted successfully');
      Toast.show({
        type:"success",
        text1:"Success",
        text2:"Bill deleted successfully",
      });
      loadBills();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to delete bill');
      Toast.show({
        type:"error",
        text1:"Error",
        text2:error.response?.data?.error || 'Failed to delete bill',
      });
    } finally {
      setLoading(false);
    }
  }
  const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);

  const renderBill = ({ item }) => (
    <View style={styles.billItem}>
      <View style={styles.billInfo}>
        <Text style={styles.billName}>{item.name}</Text>
        <Text style={styles.billAmount}>${item.amount.toFixed(2)}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteBill(item.bill_id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Manage Bills</Text>

          <View style={styles.addBillCard}>
            <Text style={styles.cardTitle}>Add New Bill</Text>
            <TextInput
              style={styles.input}
              placeholder="Bill name (e.g., Rent, Utilities)"
              value={billName}
              onChangeText={setBillName}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount (e.g., 500.00)"
              value={billAmount}
              onChangeText={setBillAmount}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={[styles.addButton, loading && styles.buttonDisabled]}
              onPress={handleAddBill}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>Add Bill</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Total Bills</Text>
            <Text style={styles.summaryAmount}>${totalBills.toFixed(2)}</Text>
            <Text style={styles.summarySubtext}>{bills.length} bill(s)</Text>
          </View>

          <Text style={styles.listTitle}>Your Bills</Text>
          {bills.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No bills added yet</Text>
              <Text style={styles.emptySubtext}>Add your first bill above</Text>
            </View>
          ) : (
            <FlatList
              data={bills}
              keyExtractor={(item) => item.bill_id.toString()}
              renderItem={renderBill}
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadBills();
              }}
            />  
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
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
  addBillCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#000',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  summaryTitle: {
    fontSize: 16,
    color: '#1976D2',
    marginBottom: 10,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#000',
  },
  billItem: {
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
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  billAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
  },
});

