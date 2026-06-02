import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import '../ideator/IdeatorPages.css';

export default function InvestorDashboard() {
  const { user } = useAuth();
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/interests/mine')
      .then(res => res.json())
      .then(data => { setInterests(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalInvested = interests.reduce((sum, i) => sum + (i.amount || 0), 0);
  const pendingCount = interests.filter(i => i.status === 'pending').length;

  return (
    <DashboardLayout role="investor">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.username}</h1>
          <p className="page-subtitle">Discover and invest in groundbreaking ideas</p>
        </div>
        <Link to="/investor/browse" className="btn btn-primary">
          Browse Ideas
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">Interest</div>
          <div className="stat-info">
            <span className="stat-value">{interests.length}</span>
            <span className="stat-label">Interests Sent</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">Pending</div>
          <div className="stat-info">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">Funds</div>
          <div className="stat-info">
            <span className="stat-value">${totalInvested.toLocaleString()}</span>
            <span className="stat-label">Total Offered</span>
          </div>
        </div>
      </div>

      {/* Recent Interests */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Recent Interests</h2>
          <Link to="/investor/interests" className="btn btn-ghost btn-sm">View All →</Link>
        </div>

        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : interests.length > 0 ? (
          <div className="interests-list">
            {interests.slice(0, 5).map(interest => (
              <div key={interest.id} className="interest-card">
                <div className="interest-info">
                  <div className="interest-idea-title">{interest.title}</div>
                  <div className="interest-message">{interest.message}</div>
                  <div className="interest-meta">
                    <span className="interest-amount">${(interest.amount || 0).toLocaleString()}</span>
                    <span className={`badge ${interest.status === 'pending' ? 'badge-warning' : interest.status === 'accepted' ? 'badge-success' : 'badge-error'}`}>
                      {interest.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-card">
            <div className="empty-icon">Browse</div>
            <h3>No interests yet</h3>
            <p>Browse available ideas and express your interest to get started</p>
            <Link to="/investor/browse" className="btn btn-primary">Browse Ideas</Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
