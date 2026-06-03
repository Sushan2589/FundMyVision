import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import '../investor/InvestorPages.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalInvestors: 0,
    totalIdeators: 0,
    totalIdeas: 0,
    pendingKYC: 0,
    approvedKYC: 0,
    totalInterests: 0,
  });
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending', 'all'
  const [actioning, setActioning] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchSubmissions();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching admin stats:", err);
    }
  }

  async function fetchSubmissions() {
    try {
      const res = await fetch('/api/admin/kyc-all');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error("Error fetching KYC submissions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleKYCAction(userId, action) {
    setActioning(userId);
    try {
      const endpoint = action === 'approve' ? '/api/admin/kyc-approve' : '/api/admin/kyc-reject';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        await Promise.all([fetchStats(), fetchSubmissions()]);
      }
    } catch (err) {
      console.error(`Error during KYC ${action}:`, err);
    } finally {
      setActioning(null);
    }
  }

  const displayedSubmissions = submissions.filter(sub => {
    if (filter === 'pending') return sub.verified === 1;
    return true; // 'all'
  });

  return (
    <DashboardLayout role="admin">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Manage user verification requests and platform metrics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.pendingKYC}</div>
          <div className="admin-stat-label">Pending KYC</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.approvedKYC}</div>
          <div className="admin-stat-label">Approved Investors</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.totalInvestors}</div>
          <div className="admin-stat-label">Total Investors</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.totalIdeators}</div>
          <div className="admin-stat-label">Total Ideators</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.totalIdeas}</div>
          <div className="admin-stat-label">Total Ideas</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.totalInterests}</div>
          <div className="admin-stat-label">Interests Expressed</div>
        </div>
      </div>

      {/* Table Filter Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <button
          className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setFilter('pending')}
        >
          Pending Verifications ({submissions.filter(s => s.verified === 1).length})
        </button>
        <button
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setFilter('all')}
        >
          All Investor Submissions ({submissions.length})
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading submissions...</div>
      ) : displayedSubmissions.length > 0 ? (
        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
          <table className="kyc-table">
            <thead>
              <tr>
                <th>User / Company</th>
                <th>Email</th>
                <th>KYC Details</th>
                <th>Submitted Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedSubmissions.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{sub.username}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {sub.company_name || 'No Company Name'}
                    </div>
                  </td>
                  <td>{sub.email}</td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ 
                      fontSize: 'var(--text-xs)', 
                      whiteSpace: 'pre-wrap', 
                      color: 'var(--color-text-secondary)',
                      lineHeight: '1.4' 
                    }}>
                      {sub.bio || 'No details provided.'}
                    </div>
                  </td>
                  <td>
                    {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    {sub.verified === 1 && <span className="badge badge-warning">Pending</span>}
                    {sub.verified === 2 && <span className="badge badge-success">Approved</span>}
                    {sub.verified === 3 && <span className="badge badge-error">Rejected</span>}
                  </td>
                  <td>
                    <div className="kyc-actions">
                      {sub.verified === 1 ? (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={actioning === sub.id}
                            onClick={() => handleKYCAction(sub.id, 'approve')}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ 
                              color: 'var(--color-error)', 
                              borderColor: 'var(--color-error)', 
                              background: 'transparent' 
                            }}
                            disabled={actioning === sub.id}
                            onClick={() => handleKYCAction(sub.id, 'reject')}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          No Actions Needed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-card">
          <div className="empty-icon">✓</div>
          <h3>No submissions found</h3>
          <p>{filter === 'pending' ? 'All KYC submissions have been processed!' : 'No investors have submitted KYC yet.'}</p>
        </div>
      )}
    </DashboardLayout>
  );
}
