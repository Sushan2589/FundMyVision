import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import './IdeatorPages.css';

export default function IdeatorInterests() {
  const navigate = useNavigate();
  const [receivedInterests, setReceivedInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchReceivedInterests();
  }, []);

  function fetchReceivedInterests() {
    setLoading(true);
    fetch('/api/interests/received')
      .then(res => res.json())
      .then(data => {
        setReceivedInterests(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }

  function handleAccept(interestId) {
    setProcessingId(interestId);
    fetch(`/api/interests/${interestId}/accept`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReceivedInterests(prev =>
            prev.map(i => i.id === interestId ? { ...i, status: 'accepted' } : i)
          );
          if (data.conversationId) {
            navigate(`/chat?id=${data.conversationId}`);
          }
        }
        setProcessingId(null);
      })
      .catch(err => {
        console.error(err);
        setProcessingId(null);
      });
  }

  function handleReject(interestId) {
    setProcessingId(interestId);
    fetch(`/api/interests/${interestId}/reject`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReceivedInterests(prev =>
            prev.map(i => i.id === interestId ? { ...i, status: 'rejected' } : i)
          );
        }
        setProcessingId(null);
      })
      .catch(err => {
        console.error(err);
        setProcessingId(null);
      });
  }

  function formatCurrency(amount) {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  return (
    <DashboardLayout role="ideator">
      <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Interests Received</h1>
            <p className="page-subtitle">Manage investment proposals and connection requests from verified investors</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading pitch offers...</div>
        ) : receivedInterests.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {receivedInterests.map(interest => (
              <div key={interest.id} className="card" style={{ padding: 'var(--space-5)', background: 'var(--surface-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary-dark)' }}>
                      Offer on: {interest.idea_title}
                    </h2>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      From investor: <strong>{interest.investor_name}</strong> ({interest.investor_email})
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                      {formatCurrency(interest.amount)}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.4)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                  <p style={{ fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>Investor Pitch Message:</p>
                  "{interest.message}"
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-3)' }}>
                  {interest.status === 'accepted' ? (
                    <div>
                      <span className="badge badge-approved" style={{ marginRight: 'var(--space-2)' }}>✓ Accepted</span>
                      <button onClick={() => navigate('/chat')} className="btn btn-primary btn-sm">
                        Open Chat Messenger
                      </button>
                    </div>
                  ) : interest.status === 'rejected' ? (
                    <span className="badge badge-rejected">Declined</span>
                  ) : (
                    <div className="btn-group">
                      <button
                        onClick={() => handleAccept(interest.id)}
                        className="btn btn-primary btn-sm"
                        disabled={processingId === interest.id}
                      >
                        Accept & Start Chat
                      </button>
                      <button
                        onClick={() => handleReject(interest.id)}
                        className="btn btn-ghost btn-sm"
                        disabled={processingId === interest.id}
                        style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-card" style={{ padding: 'var(--space-12) 0' }}>
            <div className="empty-icon" style={{ fontSize: '48px', opacity: 0.3 }}>💼</div>
            <h3 style={{ marginTop: 'var(--space-4)' }}>No pitch proposals yet</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>You will see investor tickets here when they express interest in your posted visions.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
