import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Toast from 'react-native-toast-message';

// Screens
import Admin from '../screens/Admin';
import ProfileScreen from '../screens/ProfileScreen';
import CreateShiftScreen from '../screens/CreateShiftScreen';
import ApproveShiftScreen from '../screens/ApproveShiftScreen';
import EmployeeScreen from '../screens/EmployeeScreen';
import StaffSalaryScreen from '../screens/StaffSalaryScreen';

// Icons
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export function EmployerNavigator({ onLogout }) {
  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: true,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Admin') {
              return <MaterialIcons name="admin-panel-settings" size={size} color={color} />;
            }
            if (route.name === 'CreateShift') {
              return <MaterialCommunityIcons name="plus-circle-outline" size={size} color={color} />;
            }
            if (route.name === 'ApproveShift') {
              return <MaterialCommunityIcons name="check-circle-outline" size={size} color={color} />;
            }
            if (route.name === 'StaffSalary') {
              return <MaterialCommunityIcons name="cash-multiple" size={size} color={color} />;
            }
            if (route.name === 'Employees') {
              return <MaterialCommunityIcons name="account-multiple" size={size} color={color} />;
            }
            if (route.name === 'Profile') {
              return <MaterialIcons name="person" size={size} color={color} />;
            }
            return null;
          },
        })}
      >
        <Tab.Screen 
          name="Admin" 
          component={Admin}
          options={{ title: 'Admin Dashboard' }}
        />
        <Tab.Screen 
          name="CreateShift" 
          component={CreateShiftScreen}
          options={{ title: 'Create Shift' }}
        />
        <Tab.Screen 
          name="ApproveShift" 
          component={ApproveShiftScreen}
          options={{ title: 'Approve Shifts' }}
        />
        <Tab.Screen 
          name="StaffSalary" 
          component={StaffSalaryScreen}
          options={{ title: 'Staff Salary' }}
        />
        <Tab.Screen 
          name="Employees" 
          component={EmployeeScreen}
          options={{ title: 'Employees' }}
        />
        <Tab.Screen 
          name="Profile"
          options={{ title: 'Profile' }}
        >
          {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
      <Toast
        type="success"
        position="right"
        visibilityTime={3000}
        autoHide
        bottomOffset={40}
      />
    </>
  );
}
