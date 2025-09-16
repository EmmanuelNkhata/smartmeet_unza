import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './layouts/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/styles/main.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            {/* Add more routes as needed */}
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default App;
