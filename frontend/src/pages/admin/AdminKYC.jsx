import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import './AdminPages.css';
import '../ideator/IdeatorPages.css';

export default function AdminKYC() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchPendingKYC();
  }, []);

  function fetchPendingKYC() {
    setLoading(true);
    fetch('/api/admin/kyc-pending')
      .then(res => {
        if (!res.ok) throw new Error("Could not fetch KYC requests");
        return res.json();
      })
      .then(data => {
        setPendingUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }

  function handleApprove(userId) {
    fetch(`/api/admin/kyc-approve/${userId}`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPendingUsers(prev => prev.filter(u => u.id !== userId));
        } else {
          setActionError("Approval failed: " + (data.error || "Unknown error"));
        }
      })
      .catch(err => {
        console.error(err);
        setActionError("Network error while approving");
      });
  }

  function handleReject(userId) {
    fetch(`/api/admin/kyc-reject/${userId}`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPendingUsers(prev => prev.filter(u => u.id !== userId));
        } else {
          setActionError("Rejection failed: " + (data.error || "Unknown error"));
        }
      })
      .catch(err => {
        console.error(err);
        setActionError("Network error while rejecting");
      });
  }

  return (
    <DashboardLayout role="admin">
      <div className="admin-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">KYC Verifications</h1>
            <p className="page-subtitle">Review pending verification submissions from investors</p>
          </div>
        </div>

        {actionError && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: 'var(--radius-md)' }}>
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading verification list...</div>
        ) : pendingUsers.length > 0 ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td style={{ fontWeight: 'var(--font-weight-semibold)' }}>{u.username}</td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-role">{u.role}</span></td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group">
                        <button
                          onClick={() => handleApprove(u.id)}
                          className="btn btn-sm btn-primary"
                          style={{ background: 'var(--color-primary)', border: 'none', color: '#white' }}
                        >
                          Verify / Approve
                        </button>
                        <button
                          onClick={() => handleReject(u.id)}
                          className="btn btn-sm btn-ghost"
                          style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-card" style={{ padding: 'var(--space-12) 0' }}>
            <div className="empty-icon" style={{ fontSize: '48px', opacity: 0.3 }}>✅</div>
            <h3 style={{ marginTop: 'var(--space-4)' }}>No pending KYC verifications</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>All investor profile submissions have been processed.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
