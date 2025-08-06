import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/LoginForm';
import { BalanceCheck } from './components/BalanceCheck';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Students } from './components/Students';
import { Transactions } from './components/Transactions';
import { Purchases } from './components/Purchases';
import { Stock } from './components/Stock';

function AdminApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <Students />;
      case 'transactions':
        return <Transactions />;
      case 'purchases':
        return <Purchases />;
      case 'stock':
        return <Stock />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10B981',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
        <Routes>
          <Route path="/balance" element={<BalanceCheck />} />
          <Route 
            path="/admin" 
            element={user ? <AdminApp /> : <LoginForm />} 
          />
          <Route 
            path="/" 
            element={<Navigate to="/balance" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;