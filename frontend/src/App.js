import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import components
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import LearningPathCreator from './components/LearningPathCreator';
import LearningPathViewer from './components/LearningPathViewer';
import LearningPaths from './components/LearningPaths';
import ProgressTracker from './components/ProgressTracker';
import StudentsManager from './components/StudentsManager';
import QRScanner from './components/QRScanner';
import VoiceAssistant from './components/VoiceAssistant';
import TeacherChatBot from './components/TeacherChatBot';
import NotificationCenter from './components/NotificationCenter';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API Service
export const apiService = {
  // Set up axios defaults
  setup: () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },

  // Generic HTTP methods
  get: async (endpoint) => {
    const response = await axios.get(`${API}${endpoint}`);
    return response;
  },

  post: async (endpoint, data) => {
    const response = await axios.post(`${API}${endpoint}`, data);
    return response;
  },

  put: async (endpoint, data) => {
    const response = await axios.put(`${API}${endpoint}`, data);
    return response;
  },

  delete: async (endpoint) => {
    const response = await axios.delete(`${API}${endpoint}`);
    return response;
  },

  // Auth endpoints
  register: async (userData) => {
    const response = await axios.post(`${API}/auth/register`, userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await axios.post(`${API}/auth/login`, credentials);
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    delete axios.defaults.headers.common['Authorization'];
  },

  // Learning paths
  createLearningPath: async (pathData) => {
    const response = await axios.post(`${API}/learning-paths`, pathData);
    return response.data;
  },

  getLearningPaths: async () => {
    const response = await axios.get(`${API}/learning-paths`);
    return response.data;
  },

  getLearningPath: async (pathId) => {
    const response = await axios.get(`${API}/learning-paths/${pathId}`);
    return response.data;
  },

  // Progress tracking
  updateProgress: async (progressData) => {
    const response = await axios.post(`${API}/progress/update`, progressData);
    return response.data;
  },

  getProgress: async (pathId) => {
    const response = await axios.get(`${API}/progress/${pathId}`);
    return response.data;
  },

  // Students (for teachers)
  getStudents: async () => {
    const response = await axios.get(`${API}/students`);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await axios.get(`${API}/health`);
    return response.data;
  }
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Set up axios defaults
      apiService.setup();
      // Try to get user info from token or make a simple authenticated request
      // For now, we'll use a health check to verify token validity
      apiService.healthCheck()
        .then(() => {
          // Token is valid, try to get user info from token
          try {
            // Simple JWT decode (not secure, but good enough for demo)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const decoded = JSON.parse(jsonPayload);
            
            setUser({
              id: decoded.user_id,
              email: decoded.email,
              role: decoded.role,
              name: decoded.email.split('@')[0] // Fallback name
            });
          } catch (decodeError) {
            console.error('Token decode failed:', decodeError);
            localStorage.removeItem('auth_token');
          }
          setLoading(false);
        })
        .catch(() => {
          // Token is invalid
          localStorage.removeItem('auth_token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    register,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Main App Component
function App() {
  const { user } = useAuth();

  return (
    <div className="App">
      <Router>
        <Header />
        <main className="main-content">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" /> : <Login />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to="/dashboard" /> : <Register />} 
            />

            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-path" 
              element={
                <ProtectedRoute>
                  <LearningPathCreator />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/learning-path/:id" 
              element={
                <ProtectedRoute>
                  <LearningPathViewer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/progress/:id" 
              element={
                <ProtectedRoute>
                  <ProgressTracker />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/students" 
              element={
                <ProtectedRoute>
                  <StudentsManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/learning-paths" 
              element={
                <ProtectedRoute>
                  <LearningPaths />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/qr-scanner" 
              element={
                <ProtectedRoute>
                  <QRScanner />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/attendance" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* Default route */}
            <Route 
              path="/" 
              element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
        
        {/* Global Components */}
        {user && (
          <>
            <VoiceAssistant />
            <TeacherChatBot />
            <NotificationCenter />
          </>
        )}
      </Router>
    </div>
  );
}

// Wrap App with AuthProvider
const AppWithAuth = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWithAuth;