import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import '../ideator/IdeatorPages.css';

export default function InvestorInterests() {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/interests/mine')
      .then(res => res.json())
      .then(data => { setInterests(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="investor">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Interests</h1>
          <p className="page-subtitle">Track all the ideas you've expressed interest in</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading your interests...</div>
      ) : interests.length > 0 ? (
        <div className="interests-list">
          {interests.map(interest => (
            <div key={interest.id} className="interest-card">
              <div className="interest-info">
                <div className="interest-idea-title">{interest.title}</div>
                <div className="interest-message">{interest.message}</div>
                <div className="interest-meta">
                  <span className="interest-amount">
                    Rs.{(interest.amount || 0).toLocaleString()}
                  </span>
                  <span className={`badge ${
                    interest.status === 'pending' ? 'badge-warning' : 
                    interest.status === 'accepted' ? 'badge-success' : 'badge-error'
                  }`}>
                    {interest.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-card">
          <div className="empty-icon">Interest</div>
          <h3>No interests yet</h3>
          <p>You haven't expressed interest in any ideas yet. Start browsing!</p>
          <a href="/investor/browse" className="btn btn-primary">Browse Ideas</a>
        </div>
      )}
    </DashboardLayout>
  );
}
