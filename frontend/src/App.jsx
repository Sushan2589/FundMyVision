import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import IdeatorDashboard from './pages/ideator/IdeatorDashboard'
import IdeatorIdeas from './pages/ideator/IdeatorIdeas'
import IdeatorCreateIdea from './pages/ideator/IdeatorCreateIdea'
import IdeatorProfile from './pages/ideator/IdeatorProfile'
import InvestorDashboard from './pages/investor/InvestorDashboard'
import InvestorBrowse from './pages/investor/InvestorBrowse'
import InvestorInterests from './pages/investor/InvestorInterests'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-background)',
      }}>
        <div style={{ color: 'var(--color-primary)', fontSize: '18px', fontWeight: 500 }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <SignupPage />} />

      {/* Ideator Routes */}
      <Route path="/ideator/dashboard" element={
        <ProtectedRoute role="ideator"><IdeatorDashboard /></ProtectedRoute>
      } />
      <Route path="/ideator/ideas" element={
        <ProtectedRoute role="ideator"><IdeatorIdeas /></ProtectedRoute>
      } />
      <Route path="/ideator/create-idea" element={
        <ProtectedRoute role="ideator"><IdeatorCreateIdea /></ProtectedRoute>
      } />
      <Route path="/ideator/profile" element={
        <ProtectedRoute role="ideator"><IdeatorProfile /></ProtectedRoute>
      } />

      {/* Investor Routes */}
      <Route path="/investor/dashboard" element={
        <ProtectedRoute role="investor"><InvestorDashboard /></ProtectedRoute>
      } />
      <Route path="/investor/browse" element={
        <ProtectedRoute role="investor"><InvestorBrowse /></ProtectedRoute>
      } />
      <Route path="/investor/interests" element={
        <ProtectedRoute role="investor"><InvestorInterests /></ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
