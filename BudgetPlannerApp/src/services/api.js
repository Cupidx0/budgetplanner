import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this to your backend server URL
// For iOS simulator: http://localhost:5000
// For Android emulator: http://10.0.2.2:5000
// For physical device: http://YOUR_COMPUTER_IP:5000
const getBaseURL = () => {
  // Change this to your actual IP for physical device testing
  return 'http://localhost:5001'; // Change to http://192.168.x.x:5000 for physical device
};

export const API_BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.user_id) {
          config.headers['X-User-ID'] = user.user_id;
        }
      }
    } catch (error) {
      console.warn('Error retrieving user data:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear user data and redirect to login
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username, password) => {
    try {
      const response = await api.post('/api/login', { username, password });
      // return backend payload directly so screens can use response.user_id etc.
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  signup: async (username, password, date_of_birth) => {
    try {
      const response = await api.post('/api/register', {
        username,
        password,
        date_of_birth,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('userData');
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.warn('Error retrieving current user:', error);
      return null;
    }
  },
};

// User API
export const userAPI = {
  getHourlyRate: async (userId) => {
    try {
      const response = await api.get(`/api/user/${userId}/hourly-rate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateHourlyRate: async (userId, hourlyRate) => {
    try {
      const response = await api.put(`/api/user/${userId}/hourly-rate`, {
        hourly_rate: parseFloat(hourlyRate),
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
export const ChatAPI = {
  chatWithAssistant: async (userId, message) => {
    try {
      // axios.post takes (url, data, config). We only need to send the JSON body.
      const response = await api.post(`/api/assistant/user/${userId}/chat`, { message });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getChatHistory: async (userId) => {
    try {
      const response = await api.get(`/api/assistantchat/user/${userId}/message`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
// Salary API
export const salaryAPI = {
  calculateDailySalary: async (userId, hourlyRate, workStartTime, workEndTime) => {
    try {
      const response = await api.post(`/api/user/${userId}/daily-salary`, {
        hourly_rate: parseFloat(hourlyRate),
        work_start_time: workStartTime,
        work_end_time: workEndTime,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getDailySalary: async (userId) => {
    try {
      const response = await api.get(`/api/user/${userId}/daily-salary`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getWeeklyEarnings: async (userId) => {
    try {
      const response = await api.get(`/api/user/${userId}/weekly-earnings`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMonthlySalary: async (userId) => {
    try {
      const response = await api.get(`/api/user/${userId}/monthly-salary`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSalaryAfterBills: async (userId) => {
    try {
      const response = await api.get(`/api/user/${userId}/salary-after-bills`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getDailySalaryHistory: async (userId) => {
    try {
      const response = await api.get(`/api/user/${userId}/daily-salary-history`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Bills API
export const billsAPI = {
  getBills: async (userId) => {
    try {
      const response = await api.get(`/api/user/${userId}/bills`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addBill: async (userId, name, amount) => {
    try {
      const response = await api.post(`/api/user/${userId}/bills`, {
        name,
        amount: parseFloat(amount),
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteBill: async (userId, billId) => {
    try {
      const response = await api.delete(`/api/user/${userId}/bills/${billId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Employer Shift API
export const employerShiftAPI = {
  createShift: async (shiftData) => {
    try {
      const response = await api.post('/api/employer/shifts', shiftData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPendingShifts: async (employerId) => {
    try {
      const response = await api.get('/api/employer/pending-shifts', {
        params: { employer_id: employerId }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  approveOvertimeShift: async (shiftId) => {
    try {
      const response = await api.put(`/api/employer/shifts/${shiftId}/overtime`);
      return response.data;
    } catch (error) {
      console.error('Approve overtime shift API error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to approve overtime shift'
      };
    }
  },
  approveShift: async (shiftId) => {
    try {
      const response = await api.put(`/api/employer/shifts/${shiftId}/approve`);
      return response.data;
    } catch (error) {
      console.error('Approve shift API error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to approve shift'
      };
    }
  },

  rejectShift: async (shiftId) => {
    try {
      const response = await api.put(`/api/employer/shifts/${shiftId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Reject shift API error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to reject shift'
      };
    }
  },

  getEmployees: async (employerId) => {
    try {
      const response = await api.get('/api/employer/employees', {
        params: { employer_id: employerId }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEmployeeSalaryDetails: async (employeeId) => {
    try {
      const response = await api.get(`/api/employer/employees/${employeeId}/salary`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Employee Notification API
export const employeeNotificationAPI = {
  getNotifications: async (employeeId) => {
    try {
      const response = await api.get('/api/employee/notifications', {
        params: { employee_id: employeeId }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/api/employee/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Employee Shift Submission API
export const employeeShiftSubmissionAPI = {
  submitShift: async (shiftData) => {
    try {
      const response = await api.post('/api/employee/shifts', shiftData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSubmittedShifts: async (employeeId) => {
    try {
      const response = await api.get('/api/employee/submitted-shifts', {
        params: { employee_id: employeeId }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllShifts: async (employeeId) => {
    try {
      const response = await api.get(`/api/employee/shifts`, {
        params: { employee_id: employeeId }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
// Employer Employee Shift Review API
export const employerEmployeeShiftAPI = {
  getPendingEmployeeShifts: async (employerId) => {
    try {
      const response = await api.get('/api/employer/pending-employee-shifts', {
        params: { employer_id: employerId }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;