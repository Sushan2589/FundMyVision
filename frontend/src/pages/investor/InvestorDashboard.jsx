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

  function renderKYCBanner() {
    if (user?.verified === 2) return null;
    
    let bannerStyle = {
      padding: 'var(--space-4) var(--space-5)',
      borderRadius: 'var(--radius-lg)',
      marginBottom: 'var(--space-6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 'var(--space-3)'
    };

    if (user?.verified === 1) {
      return (
        <div style={{ ...bannerStyle, background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)' }}>
          <div>
            <strong style={{ color: 'var(--color-warning)' }}>Identity Verification Under Review</strong>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Your profile is currently being reviewed by compliance. You will have full campaign access once approved.
            </p>
          </div>
          <Link to="/investor/kyc" className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }}>
            Check KYC Status
          </Link>
        </div>
      );
    }

    if (user?.verified === 3) {
      return (
        <div style={{ ...bannerStyle, background: 'var(--color-error-bg)', border: '1px solid var(--color-error)' }}>
          <div>
            <strong style={{ color: 'var(--color-error)' }}>Identity Verification Declined</strong>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', marginTop: '2px' }}>
              Your verification request was not approved. Please review your details and submit correct information.
            </p>
          </div>
          <Link to="/investor/kyc" className="btn btn-primary btn-sm" style={{ background: 'var(--color-error)', border: 'none', color: '#fff' }}>
            Resubmit Details
          </Link>
        </div>
      );
    }

    // Default: verified === 0
    return (
      <div style={{ ...bannerStyle, background: 'rgba(7, 83, 39, 0.05)', border: '1px solid var(--color-primary)' }}>
        <div>
          <strong style={{ color: 'var(--color-primary-dark)' }}>Identity Verification Required</strong>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Please submit your KYC information to unlock all vision detail listings, request pitches, and make offers.
          </p>
        </div>
        <Link to="/investor/kyc" className="btn btn-primary btn-sm">
          Verify Identity
        </Link>
      </div>
    );
  }

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

      {renderKYCBanner()}

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
