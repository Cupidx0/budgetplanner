import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/toastConfig';

// Screens
import HomeScreen from '../screens/HomeScreen';
import DailySalaryScreen from '../screens/DailySalaryScreen';
import BillsScreen from '../screens/BillsScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SubmitShiftScreen from '../screens/SubmitShiftScreen';
import MyShiftsScreen from '../screens/MyShiftsScreen';

// Icons
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export function EmployeeNavigator({ onLogout }) {
  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: true,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Home') {
              return <MaterialIcons name="home" size={size} color={color} />;
            }
            if (route.name === 'DailySalary') {
              return <MaterialCommunityIcons name="clock-outline" size={size} color={color} />;
            }
            if (route.name === 'Bills') {
              return <MaterialCommunityIcons name="credit-card-outline" size={size} color={color} />;
            }
            if (route.name === 'Earnings') {
              return <MaterialCommunityIcons name="chart-line" size={size} color={color} />;
            }
            if (route.name === 'SubmitShift') {
              return <MaterialCommunityIcons name="plus-circle-outline" size={size} color={color} />;
            }
            if (route.name === 'MyShifts') {
              return <MaterialCommunityIcons name="file-document-outline" size={size} color={color} />;
            }
            if (route.name === 'Chat') {
              return <MaterialCommunityIcons name="chat-outline" size={size} color={color} />;
            }
            if (route.name === 'Notifications') {
              return <MaterialCommunityIcons name="bell-outline" size={size} color={color} />;
            }
            if (route.name === 'Profile') {
              return <MaterialIcons name="person" size={size} color={color} />;
            }
            return null;
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Dashboard' }}
        />
        <Tab.Screen 
          name="DailySalary" 
          component={DailySalaryScreen}
          options={{ title: 'Daily Salary' }}
        />
        <Tab.Screen 
          name="Bills" 
          component={BillsScreen}
          options={{ title: 'Bills' }}
        />
        <Tab.Screen 
          name="Earnings" 
          component={EarningsScreen}
          options={{ title: 'Earnings' }}
        />
        <Tab.Screen
          name="SubmitShift"
          component={SubmitShiftScreen}
          options={{ title: 'Submit Shift' }}
        />
        <Tab.Screen
          name="MyShifts"
          component={MyShiftsScreen}
          options={{ title: 'My Shifts' }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{ title: 'Chat' }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ title: 'Notifications' }}
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
        config={toastConfig}
      />
    </>
  );
}
