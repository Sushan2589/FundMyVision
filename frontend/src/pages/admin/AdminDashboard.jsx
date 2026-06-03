import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import './AdminPages.css';
import '../ideator/IdeatorPages.css'; // Leverage shared styling

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalIdeas: 0,
    totalInterests: 0,
    pendingKYC: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => {
        if (!res.ok) throw new Error("Not authorized");
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <DashboardLayout role="admin">
      <div className="admin-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admin Command Center</h1>
            <p className="page-subtitle">Platform overview and verification status</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">KYC</div>
            <div className="stat-info">
              <span className="stat-value">{stats.pendingKYC}</span>
              <span className="stat-label">Pending Verifications</span>
            </div>
            {stats.pendingKYC > 0 && (
              <span className="badge badge-pending" style={{ position: 'absolute', top: '10px', right: '10px' }}>
                Action Needed
              </span>
            )}
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">Users</div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalUsers}</span>
              <span className="stat-label">Total Registered Users</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">Ideas</div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalIdeas}</span>
              <span className="stat-label">Campaigns / Ideas</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">Interests</div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalInterests}</span>
              <span className="stat-label">Total Expressions of Interest</span>
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div style={{ marginTop: 'var(--space-8)' }}>
          <h2 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-xl)' }}>Quick Operations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            <Link to="/admin/kyc" className="stat-card" style={{ textDecoration: 'none' }}>
              <div style={{ padding: 'var(--space-2)' }}>
                <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: 'var(--space-1)' }}>KYC Approvals</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  Review and verify investor credentials ({stats.pendingKYC} pending).
                </p>
              </div>
            </Link>
            <Link to="/admin/users" className="stat-card" style={{ textDecoration: 'none' }}>
              <div style={{ padding: 'var(--space-2)' }}>
                <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: 'var(--space-1)' }}>User Directory</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  View all registered accounts, roles and KYC statuses.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
