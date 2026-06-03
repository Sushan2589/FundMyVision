import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import './IdeatorPages.css';

export default function IdeatorInvestors() {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInterests();
  }, []);

  async function fetchInterests() {
    try {
      const res = await fetch('/api/interests/for-ideator');
      if (res.ok) {
        const data = await res.json();
        setInterests(data);
      }
    } catch (err) {
      console.error("Error fetching interests:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(interestId, action) {
    setActioning(interestId);
    try {
      const endpoint = `/api/interests/${interestId}/${action}`;
      const res = await fetch(endpoint, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        if (action === 'accept' && data.conversationId) {
          // Redirect directly to chat or fetch updated list first
          await fetchInterests();
          navigate('/chat');
        } else {
          await fetchInterests();
        }
      }
    } catch (err) {
      console.error(`Error during interest ${action}:`, err);
    } finally {
      setActioning(null);
    }
  }

  return (
    <DashboardLayout role="ideator">
      <div className="page-header">
        <div>
          <h1 className="page-title">Interested Investors</h1>
          <p className="page-subtitle">Manage connection requests and investment proposals from verified investors</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading interest list...</div>
      ) : interests.length > 0 ? (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {interests.map((item) => (
            <div 
              key={item.id} 
              className="idea-card" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 'var(--space-3)', 
                padding: 'var(--space-5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', color: 'var(--color-text)' }}>
                    {item.investor_name}
                  </h3>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 500 }}>
                    Targeting Idea: {item.idea_title}
                  </span>
                </div>
                <div>
                  {item.status === 'pending' && <span className="badge badge-warning">Pending Decision</span>}
                  {item.status === 'accepted' && <span className="badge badge-success">Connected</span>}
                  {item.status === 'rejected' && <span className="badge badge-error">Rejected</span>}
                </div>
              </div>

              <div style={{ 
                padding: 'var(--space-3)', 
                background: 'rgba(7, 83, 39, 0.03)', 
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5
              }}>
                <strong style={{ color: 'var(--color-text)' }}>Proposal Message:</strong>
                <p style={{ margin: 'var(--space-1) 0 0 0' }}>{item.message || "No custom message provided."}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    Proposed Investment Amount
                  </span>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-text)' }}>
                    ${Number(item.amount).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {item.status === 'pending' && (
                    <>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={actioning === item.id}
                        onClick={() => handleAction(item.id, 'accept')}
                      >
                        Accept & Chat
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)', background: 'transparent' }}
                        disabled={actioning === item.id}
                        onClick={() => handleAction(item.id, 'reject')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {item.status === 'accepted' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate('/chat')}
                    >
                      Open Chat
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-card">
          <div className="empty-icon">👥</div>
          <h3>No investment interests yet</h3>
          <p>When investors express interest in your ideas, they will show up here for you to connect.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
