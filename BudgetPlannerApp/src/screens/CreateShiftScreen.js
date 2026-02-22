import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { employerShiftAPI } from '../services/api';

export default function CreateShiftScreen() {
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [employerId, setEmployerId] = useState(null);
  
  // Employee selection state
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  useEffect(() => {
    loadEmployerId();
  }, []);

  useEffect(() => {
    if (employerId) {
      fetchEmployees();
    }
  }, [employerId]);

  // Filter employees based on search text
  useEffect(() => {
    if (employeeSearch.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(emp =>
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [employeeSearch, employees]);

  const loadEmployerId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setEmployerId(user.user_id);
      }
    } catch (error) {
      console.error('Error loading employer ID:', error);
    }
  };

  const fetchEmployees = async () => {
    if (!employerId) return;

    setLoadingEmployees(true);
    try {
      const response = await employerShiftAPI.getEmployees(employerId);
      if (response.success) {
        setEmployees(response.data || []);
        setFilteredEmployees(response.data || []);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load employees',
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
      setLoadingEmployees(false);
    }
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(false);
  };

  const validateForm = () => {
    if (!selectedEmployee) {
      Alert.alert('Error', 'Please select an employee');
      return false;
    }
    if (!shiftName) {
      Alert.alert('Error', 'Please enter shift name');
      return false;
    }
    if (!date) {
      Alert.alert('Error', 'Please enter date (YYYY-MM-DD)');
      return false;
    }
    if (!startTime) {
      Alert.alert('Error', 'Please enter start time (HH:MM)');
      return false;
    }
    if (!endTime) {
      Alert.alert('Error', 'Please enter end time (HH:MM)');
      return false;
    }

    // Validate date format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        Alert.alert('Error', 'Please use HH:MM format for times');
        return;
    }
    
        // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        Alert.alert('Error', 'Please use YYYY-MM-DD format for date');
        return;
    }
    return true;
  };

  const handleCreateShift = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const shiftData = {
        shift_name: shiftName,
        shift_date: date,
        start_time: startTime,
        end_time: endTime,
        description: description,
        employee_id: selectedEmployee.id,
        created_by: employerId,
      };

      const response = await employerShiftAPI.createShift(shiftData);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `Shift created for ${selectedEmployee.name}`,
          visibilityTime: 6000,
        });

        // Reset form
        setShiftName('');
        setStartTime('');
        setEndTime('');
        setDate('');
        setDescription('');
        setSelectedEmployee(null);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to create shift',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create shift',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderEmployeeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.employeeItem}
      onPress={() => handleSelectEmployee(item)}
    >
      <View style={styles.employeeItemContent}>
        <Text style={styles.employeeItemName}>{item.name}</Text>
        <Text style={styles.employeeItemRate}>£{item.hourly_rate}/hr</Text>
      </View>
      <MaterialIcons name="check" size={20} color="#007AFF" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Shift</Text>
        <Text style={styles.subtitle}>Assign shifts to employees</Text>
        <Text style={styles.note}>{employerId}</Text>
      </View>
      <View style={styles.form}>
        {/* Employee Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Employee *</Text>
          <TouchableOpacity
            style={[
              styles.employeeButton,
              selectedEmployee && styles.employeeButtonSelected,
            ]}
            onPress={() => setShowEmployeeModal(true)}
          >
            <View style={styles.employeeButtonContent}>
              <Text
                style={[
                  styles.employeeButtonText,
                  !selectedEmployee && styles.placeholder,
                ]}
              >
                {selectedEmployee ? selectedEmployee.name : 'Tap to select employee'}
              </Text>
              {selectedEmployee && (
                <Text style={styles.employeeButtonRate}>
                  £{selectedEmployee.hourly_rate}/hr
                </Text>
              )}
            </View>
            <MaterialIcons name="arrow-drop-down" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Shift Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Shift Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Morning Shift, Evening Shift"
            value={shiftName}
            onChangeText={setShiftName}
            placeholderTextColor="#999"
          />
        </View>

        {/* Date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
            placeholderTextColor="#999"
          />
        </View>

        {/* Start Time */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Start Time *</Text>
          <TextInput
            style={styles.input}
            placeholder="09:00"
            value={startTime}
            onChangeText={setStartTime}
            placeholderTextColor="#999"
          />
        <Text style={styles.hint}>Format: HH:MM</Text>
        </View>

        {/* End Time */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>End Time *</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM (24-hour)"
            value={endTime}
            onChangeText={setEndTime}
            placeholderTextColor="#999"
          />
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter shift description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor="#999"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleCreateShift}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Shift</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Employee Selection Modal */}
      <Modal
        visible={showEmployeeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmployeeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Employee</Text>
              <TouchableOpacity onPress={() => setShowEmployeeModal(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              value={employeeSearch}
              onChangeText={setEmployeeSearch}
              placeholderTextColor="#999"
            />

            {/* Employee List */}
            {loadingEmployees ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : filteredEmployees.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  {employeeSearch ? 'No employees found' : 'No employees available'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredEmployees}
                renderItem={renderEmployeeItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.employeeList}
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingVertical: 20,
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
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  employeeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  employeeButtonSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  employeeButtonContent: {
    flex: 1,
  },
  employeeButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  placeholder: {
    color: '#999',
  },
  employeeButtonRate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    textAlignVertical: 'top',
    paddingVertical: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchInput: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    fontSize: 14,
    color: '#333',
  },
  employeeList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottomBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  employeeItemContent: {
    flex: 1,
  },
  employeeItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  employeeItemRate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
});
