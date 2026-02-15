import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { userAPI } from '../services/api';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ onLogout }) {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [hourlyRate, setHourlyRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoutUser, setLogoutUser] = useState(null);
  const [currentHourlyRate, setCurrentHourlyRate] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      if (userData) {
        setUser(userData);
        const rateData = await userAPI.getHourlyRate(userData.user_id);
        if (rateData?.hourly_rate) {
          setCurrentHourlyRate(rateData.hourly_rate);
          setHourlyRate(rateData.hourly_rate.toString());
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleUpdateHourlyRate = async () => {
    if (!hourlyRate || isNaN(parseFloat(hourlyRate)) || parseFloat(hourlyRate) <= 0) {
      Alert.alert('Error', 'Please enter a valid hourly rate');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid hourly rate',
      });
      return;
    }

    setLoading(true);
    try {
      await userAPI.updateHourlyRate(user.user_id, hourlyRate);
      setCurrentHourlyRate(parseFloat(hourlyRate));
      Alert.alert('Success', 'Hourly rate updated successfully');
      Toast.show({
        type:"success",
        text1:"success",
        text2:"Hourly rate updated successfully",
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Failed to update hourly rate',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try{
      await authAPI.logout();
      if (onLogout) onLogout();
      navigation.replace('Login');
      Toast.show({
        type:"success",
        text1:"Success",
        text2:"Logged out successfully",
      });
    }
    catch (error){
      console.error('Error during logout:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to logout. Please try again.',
      });
    }
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.username}>{user?.username || 'User'}</Text>
          <Text style={styles.infoLabel}>Username:</Text>
            <Text style={styles.infoValue}>@{user?.username || 'N/A'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hourly Rate</Text>
          {currentHourlyRate && (
            <Text style={styles.currentRate}>
              Current: ${currentHourlyRate.toFixed(2)}/hour
            </Text>
          )}
          <TextInput
            style={styles.input}
            placeholder="Enter new hourly rate (e.g., 16.50)"
            value={hourlyRate}
            onChangeText={setHourlyRate}
            keyboardType="decimal-pad"
            editable = {false}
          />
          <TouchableOpacity
            style={[styles.updateButton, loading && styles.buttonDisabled]}
            onPress={handleUpdateHourlyRate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Update Hourly Rate</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.accountButtonText}>Account Information</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.accountButtonText}>
              preferences
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.accountButtonText}>About us</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.accountButtonText}>
              important informations
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  userId: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#000',
  },
  currentRate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
  },
  updateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  accountButton: {
    paddingVertical: 15,
  },
  accountButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

