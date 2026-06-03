import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import IdeaCard from '../components/IdeaCard';
import './IdeaDetail.css';

export default function IdeaDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Investor states
  const [interests, setInterests] = useState([]);
  const [myInterest, setMyInterest] = useState(null);
  const [interestAmount, setInterestAmount] = useState("");
  const [interestMessage, setInterestMessage] = useState("");
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState(false);

  // Ideator states
  const [receivedInterests, setReceivedInterests] = useState([]);
  const [processingInterestId, setProcessingInterestId] = useState(null);

  // Recommender/Similar ideas states
  const [recommendedIdeas, setRecommendedIdeas] = useState([]);

  useEffect(() => {
    fetchIdeaDetails();
  }, [id]);

  function fetchIdeaDetails() {
    setLoading(true);
    setError("");
    setMyInterest(null);
    setInterestSuccess(false);

    // 1. Fetch details of this idea
    fetch(`/api/ideas/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Idea not found");
        return res.json();
      })
      .then(data => {
        setIdea(data);
        setLoading(false);
        
        // If current user is investor, fetch their interests to check if they already applied
        if (user && user.role === 'investor') {
          fetchMyInterests(data.id);
          fetchRecommendations(data.id, data.category);
        }

        // If current user is the owner, fetch received interests for this idea
        if (user && user.role === 'ideator' && data.owner_id === user.id) {
          fetchReceivedInterestsForIdea(data.id);
        }
      })
      .catch(err => {
        console.error(err);
        setError(err.message || "Could not load idea details");
        setLoading(false);
      });
  }

  function fetchMyInterests(ideaId) {
    fetch('/api/interests/mine')
      .then(res => res.json())
      .then(data => {
        setInterests(data);
        const match = data.find(i => i.idea_id === ideaId);
        if (match) {
          setMyInterest(match);
        }
      })
      .catch(err => console.error(err));
  }

  function fetchRecommendations(currentIdeaId, category) {
    // Try to get recommendations from python recommender proxy
    fetch(`/api/recommend/${user.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Recommender offline");
        return res.json();
      })
      .then(recData => {
        // recData is { investor_id, idea_ids }
        const recIds = recData.idea_ids || [];
        if (recIds.length > 0) {
          fetch('/api/ideas')
            .then(res => res.json())
            .then(allIdeas => {
              const matched = allIdeas.filter(idea => 
                recIds.includes(idea.id) && idea.id !== currentIdeaId
              );
              setRecommendedIdeas(matched.slice(0, 3));
            })
            .catch(err => console.error(err));
        } else {
          fallbackRecommendations(currentIdeaId, category);
        }
      })
      .catch(() => {
        // Fallback to category-based similarity
        fallbackRecommendations(currentIdeaId, category);
      });
  }

  function fallbackRecommendations(currentIdeaId, category) {
    fetch('/api/ideas')
      .then(res => res.json())
      .then(allIdeas => {
        const similar = allIdeas.filter(idea => 
          idea.category === category && idea.id !== currentIdeaId
        );
        setRecommendedIdeas(similar.slice(0, 3));
      })
      .catch(err => console.error(err));
  }

  function fetchReceivedInterestsForIdea(ideaId) {
    fetch('/api/interests/received')
      .then(res => res.json())
      .then(data => {
        const matches = data.filter(i => i.idea_id === ideaId);
        setReceivedInterests(matches);
      })
      .catch(err => console.error(err));
  }

  function handleSendInterest(e) {
    e.preventDefault();
    if (!user || user.role !== 'investor') return;
    setSubmittingInterest(true);

    fetch('/api/interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea_id: idea.id,
        message: interestMessage,
        amount: parseFloat(interestAmount) || 0
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInterestSuccess(true);
          setMyInterest({
            idea_id: idea.id,
            amount: parseFloat(interestAmount) || 0,
            message: interestMessage,
            status: 'pending'
          });
        } else {
          setError("Failed to express interest: " + (data.error || ""));
        }
        setSubmittingInterest(false);
      })
      .catch(err => {
        console.error(err);
        setError("Network error sending expression of interest");
        setSubmittingInterest(false);
      });
  }

  function handleAcceptInterest(interestId) {
    setProcessingInterestId(interestId);
    fetch(`/api/interests/${interestId}/accept`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReceivedInterests(prev => 
            prev.map(i => i.id === interestId ? { ...i, status: 'accepted' } : i)
          );
          // Redirect to the newly created chat
          if (data.conversationId) {
            navigate(`/chat?id=${data.conversationId}`);
          }
        }
        setProcessingInterestId(null);
      })
      .catch(err => {
        console.error(err);
        setProcessingInterestId(null);
      });
  }

  function handleRejectInterest(interestId) {
    setProcessingInterestId(interestId);
    fetch(`/api/interests/${interestId}/reject`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReceivedInterests(prev => 
            prev.map(i => i.id === interestId ? { ...i, status: 'rejected' } : i)
          );
        }
        setProcessingInterestId(null);
      })
      .catch(err => {
        console.error(err);
        setProcessingInterestId(null);
      });
  }

  function handleDeleteIdea() {
    if (window.confirm("Are you sure you want to delete this idea permanently? This action cannot be undone.")) {
      fetch(`/api/ideas/${idea.id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            navigate('/ideator/ideas');
          } else {
            alert("Error deleting idea: " + (data.error || ""));
          }
        })
        .catch(err => console.error(err));
    }
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

  // Determine current role layouts
  const isOwner = user && idea && idea.owner_id === user.id;

  return (
    <DashboardLayout role={user?.role}>
      <div className="detail-container">
        <Link to={user?.role === 'investor' ? "/investor/browse" : "/ideator/ideas"} className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}>
          ← Back to browsing
        </Link>

        {loading ? (
          <div className="loading-state">Loading vision campaign details...</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : !idea ? (
          <div className="empty-state">Idea not found</div>
        ) : (
          <div className="detail-grid">
            {/* Left side: Main idea details */}
            <div className="detail-main">
              <div className="detail-card card">
                <div className="detail-header-meta">
                  {idea.category && <span className="badge">{idea.category}</span>}
                  {idea.stage && <span className="badge badge-primary">{idea.stage}</span>}
                  <span className="detail-date">{new Date(idea.created_at).toLocaleDateString()}</span>
                </div>

                <h1 className="detail-title">{idea.title}</h1>
                
                {idea.summary && (
                  <p className="detail-summary">{idea.summary}</p>
                )}

                <div className="detail-content">
                  <h3 className="section-subtitle">About this Vision</h3>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 'var(--leading-relaxed)' }}>{idea.description}</p>
                </div>

                <div className="detail-footer-info">
                  <div className="detail-funding">
                    <span className="detail-funding-label">Target Funding Capital</span>
                    <span className="detail-funding-val">{formatCurrency(idea.funding_needed)}</span>
                  </div>
                  
                  <div className="detail-creator">
                    <div className="detail-avatar">
                      {idea.owner_name ? idea.owner_name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      <span className="detail-creator-label">Vision Creator</span>
                      <span className="detail-creator-name">{idea.owner_name || "Unknown"}</span>
                    </div>
                  </div>
                </div>

                {/* Owner management buttons */}
                {isOwner && (
                  <div className="detail-actions" style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-2)' }}>
                    <Link to={`/ideator/edit-idea/${idea.id}`} className="btn btn-primary">
                      Edit Vision Details
                    </Link>
                    <button onClick={handleDeleteIdea} className="btn btn-ghost" style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
                      Delete Vision
                    </button>
                  </div>
                )}
              </div>

              {/* Similar/Recommended ideas */}
              {user && user.role === 'investor' && recommendedIdeas.length > 0 && (
                <div style={{ marginTop: 'var(--space-8)' }}>
                  <h2 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-primary-dark)' }}>Recommended for You</h2>
                  <div className="ideas-grid-dashboard" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    {recommendedIdeas.map(item => (
                      <IdeaCard key={item.id} idea={item} showOwner />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Interactivity context */}
            <div className="detail-sidebar">
              {/* Investor: Interest expression form / status */}
              {user && user.role === 'investor' && (
                <div>
                  {user.verified !== 2 ? (
                    <div className="card sidebar-box" style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)' }}>
                      <h3 style={{ color: 'var(--color-warning)' }}>KYC Required</h3>
                      <p style={{ margin: 'var(--space-2) 0', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
                        You must complete your identity verification (KYC) to view the ideator's email contact or request chat meetings.
                      </p>
                      <Link to="/investor/kyc" className="btn btn-primary btn-sm" style={{ width: '100%', textAlign: 'center', marginTop: 'var(--space-2)' }}>
                        Complete Verification
                      </Link>
                    </div>
                  ) : myInterest ? (
                    <div className="card sidebar-box" style={{ textAlign: 'center' }}>
                      <h3>Your Interest Status</h3>
                      <div style={{ margin: 'var(--space-4) 0' }}>
                        {myInterest.status === 'accepted' ? (
                          <div>
                            <span className="badge badge-approved" style={{ fontSize: '14px', padding: '6px 12px' }}>✓ Interest Accepted</span>
                            <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                              The ideator accepted your proposal! You can now message them.
                            </p>
                            <Link to="/chat" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 'var(--space-3)', display: 'block', textAlign: 'center' }}>
                              Open Messages Chat
                            </Link>
                          </div>
                        ) : myInterest.status === 'rejected' ? (
                          <div>
                            <span className="badge badge-rejected" style={{ fontSize: '14px', padding: '6px 12px' }}>Declined</span>
                            <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                              This expression of interest was declined by the ideator.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="badge badge-pending" style={{ fontSize: '14px', padding: '6px 12px' }}>Pending Review</span>
                            <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                              Submitted investment ticket: <strong>{formatCurrency(myInterest.amount)}</strong>
                            </p>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              Waiting for the ideator to accept your pitch.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="card sidebar-box">
                      <h3>Express Interest</h3>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 'var(--space-1) 0 var(--space-4) 0' }}>
                        Submit your initial investment ticket size and message. If the owner accepts, a private chat opens automatically.
                      </p>

                      <form onSubmit={handleSendInterest}>
                        <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 500, marginBottom: '2px' }}>Investment Amount ($)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={interestAmount}
                            onChange={e => setInterestAmount(e.target.value)}
                            required
                            placeholder="e.g. 50000"
                            min="1"
                            style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--surface-input)' }}
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 500, marginBottom: '2px' }}>Intro Pitch Message</label>
                          <textarea
                            className="form-control"
                            value={interestMessage}
                            onChange={e => setInterestMessage(e.target.value)}
                            required
                            placeholder="Introduce yourself and explain why you're interested..."
                            rows="4"
                            style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--surface-input)', resize: 'vertical' }}
                          />
                        </div>

                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={submittingInterest}
                          style={{ width: '100%' }}
                        >
                          {submittingInterest ? "Sending..." : "Submit Pitch Request"}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* Ideator: Received Interests listing for this specific idea */}
              {isOwner && (
                <div className="card sidebar-box">
                  <h3>Investor Offers ({receivedInterests.length})</h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                    Review expressions of interest on this campaign.
                  </p>

                  {receivedInterests.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {receivedInterests.map(item => (
                        <div key={item.id} style={{ padding: 'var(--space-3)', background: 'rgba(7, 83, 39, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-1)' }}>
                            <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--text-sm)' }}>
                              {item.investor_name}
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                          
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 'var(--space-2) 0', fontStyle: 'italic' }}>
                            "{item.message}"
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                            {item.status === 'accepted' ? (
                              <span className="badge badge-approved">✓ Accepted</span>
                            ) : item.status === 'rejected' ? (
                              <span className="badge badge-rejected">Declined</span>
                            ) : (
                              <div className="btn-group" style={{ width: '100%', gap: 'var(--space-1)' }}>
                                <button
                                  onClick={() => handleAcceptInterest(item.id)}
                                  className="btn btn-sm btn-primary"
                                  disabled={processingInterestId === item.id}
                                  style={{ flex: 1, padding: '4px var(--space-2)', fontSize: '11px' }}
                                >
                                  Accept & Chat
                                </button>
                                <button
                                  onClick={() => handleRejectInterest(item.id)}
                                  className="btn btn-sm btn-ghost"
                                  disabled={processingInterestId === item.id}
                                  style={{ padding: '4px var(--space-2)', fontSize: '11px', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
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
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
                      No investor interest pitch offers received for this idea yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
