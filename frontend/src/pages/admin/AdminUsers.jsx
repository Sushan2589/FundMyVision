import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import './AdminPages.css';
import '../ideator/IdeatorPages.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  function renderVerifiedBadge(status) {
    switch (status) {
      case 1:
        return <span className="badge badge-pending">Pending KYC</span>;
      case 2:
        return <span className="badge badge-approved">KYC Verified</span>;
      case 3:
        return <span className="badge badge-rejected">KYC Rejected</span>;
      case 0:
      default:
        return <span className="badge badge-unsubmitted" style={{ opacity: 0.6 }}>Unsubmitted</span>;
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="admin-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">User Directory</h1>
            <p className="page-subtitle">View all registered ideators, investors, and administrator accounts</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading user directory...</div>
        ) : users.length > 0 ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Verification Status</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td style={{ fontWeight: 'var(--font-weight-semibold)' }}>{u.username}</td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-role">{u.role}</span></td>
                    <td>{renderVerifiedBadge(u.verified)}</td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-card" style={{ padding: 'var(--space-12) 0' }}>
            <h3>No users found</h3>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
