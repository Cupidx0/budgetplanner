import React, { useState, useEffect, use } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

// Navigators
import { EmployeeNavigator } from './src/navigation/EmployeeNavigator';
import { EmployerNavigator } from './src/navigation/EmployerNavigator';

// Services
import { authAPI } from './src/services/api';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      if (userData) {
        setIsAuthenticated(true);
        // Assuming userData has a role property (e.g., 'employee' or 'employer')
        setUserRole(userData.role || 'employee');
      }
      if(userData?.username === 'admin'){
        setIsAuthenticated(true);
        setUserRole('employer');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} onLogin={() => setIsAuthenticated(true)} />}
              </Stack.Screen>
              <Stack.Screen name="Signup">
                {(props) => <SignupScreen {...props} onSignup={() => setIsAuthenticated(true)} />}
              </Stack.Screen>
            </>
          ) : userRole === 'employer' ? (
            <Stack.Screen name="EmployerTabs">
              {(props) => (
                <EmployerNavigator 
                  {...props} 
                  onLogout={() => {
                    setIsAuthenticated(false);
                    setUserRole(null);
                  }}
                />
              )}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="EmployeeTabs">
              {(props) => (
                <EmployeeNavigator 
                  {...props} 
                  onLogout={() => {
                    setIsAuthenticated(false);
                    setUserRole(null);
                  }}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <Toast
        type="success"
        position="bottom"
        visibilityTime={3000}
        autoHide
        bottomOffset={40}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

