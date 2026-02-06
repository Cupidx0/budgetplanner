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
import { salaryAPI, userAPI } from '../services/api';
import { authAPI } from '../services/api';
import { Platform } from 'react-native';
import DatePicker from 'react-datepicker';
import { DateTimePicker} from '@react-native-community/datetimepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/datePicker.css'
//import { BorderlessButton } from 'react-native-gesture-handler';

export default function DailySalaryScreen() {
  const [hourlyRate, setHourlyRate] = useState('');
  const [workStartTime, setWorkStartTime] = useState('');
  const [workEndTime, setWorkEndTime] = useState('');
  const [dailyHours, setDailyHours] = useState(null);
  const [dailySalary, setDailySalary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [currentHourlyRate, setCurrentHourlyRate] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    loadUserData();
  }, []);
  if (Platform.OS == "web"){
    DatePicker;
  }
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

  const validateTime = (time) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleCalculate = async () => {
    if (!hourlyRate || !workStartTime || !workEndTime) {
      Alert.alert('Error', 'Please fill in all fields');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all fields',
      });
      return;
    }

    if (!validateTime(workStartTime) || !validateTime(workEndTime)) {
      Alert.alert('Error', 'Please enter time in HH:MM format (e.g., 09:00)');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter time in HH:MM format (e.g., 09:00)',
      });
      return;
    }
    if (!validateTime(workStartTime) || !validateTime(workEndTime) || workStartTime >= workEndTime) {
      Alert.alert('Error', 'Please enter valid work hours between 00:00 and 23:59');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter valid work hours between 00:00 and 23:59',
      });
      return;
    }
    if (isNaN(parseFloat(hourlyRate)) || parseFloat(hourlyRate) <= 0) {
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
      const response = await salaryAPI.calculateDailySalary(
        user.user_id,
        hourlyRate,
        workStartTime,
        workEndTime
      );
      //setDailySalary(response);
      //setDailyHours(response.daily_hours);
      const response2 = await salaryAPI.getDailySalary(user.user_id);
      setDailySalary(response);
      Alert.alert('Success', `Daily salary calculated: $${response.daily_salary.toFixed(2)}`);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Daily salary calculated: $${response.daily_salary.toFixed(2)}`,
      });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to calculate daily salary');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Failed to calculate daily salary',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Calculate Daily Salary</Text>
        <Text style={styles.subtitle}>Enter your work hours for today</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hourly Rate ($)</Text>
          <Text
            style={styles.input}
            > {hourlyRate}</Text>
          {currentHourlyRate && (
            <Text style={styles.hint}>
              Current rate: ${currentHourlyRate.toFixed(2)}
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Work Start Time</Text>
          <DatePicker
            selected={startDate}
            //style={styles.datePicker}
            onChange={(date) => {
              setStartDate(date);
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              setWorkStartTime(`${hours}:${minutes}`);
            }}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="HH:mm"
            placeholderText="Select start date and time"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Work End Time</Text>
          <DatePicker
            selected={endDate}
            //style={styles.datePicker}
            customInput={<input className='react-datepicker__input-container'/>}
            onChange={(date) => {
              setEndDate(date);
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              setWorkEndTime(`${hours}:${minutes}`);
            }}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="HH:mm"
            placeholderText="Select end date and time"
            //style={styles.datePicker}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCalculate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Calculate Daily Salary</Text>
          )}
        </TouchableOpacity>

        {dailySalary && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Today's Earnings</Text>
            <Text style={styles.resultAmount}>
              ${dailySalary.daily_salary?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.resultSubtext}>
              Hours worked: {dailySalary.daily_hours?.toFixed(2) || '0.00'} hours
            </Text>
          </View>
        )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    zIndex: -100,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 20,
    marginTop: 30,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    zIndex: -100,
  },
  resultTitle: {
    fontSize: 16,
    color: '#1976D2',
    marginBottom: 10,
  },
  resultAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  resultSubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  datePicker:{
    width: '50%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2f2f2fff',
    backgroundColor: '#9d9a9aff',
    padding: 10,
    fontSize: 16,
    zIndex: 1000,
  },
});

