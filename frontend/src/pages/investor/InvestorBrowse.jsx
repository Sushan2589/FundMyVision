import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import IdeaCard from '../../components/IdeaCard';
import '../ideator/IdeatorPages.css';

export default function InvestorBrowse() {
  const [ideas, setIdeas] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalIdea, setModalIdea] = useState(null);
  const [message, setMessage] = useState('Interested in your idea');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(new Set());

  useEffect(() => {
    fetch('/api/ideas')
      .then(res => res.json())
      .then(data => {
        setIdeas(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(ideas);
    } else {
      const q = search.toLowerCase();
      setFiltered(ideas.filter(idea =>
        idea.title?.toLowerCase().includes(q) ||
        idea.description?.toLowerCase().includes(q) ||
        idea.category?.toLowerCase().includes(q) ||
        idea.owner_name?.toLowerCase().includes(q)
      ));
    }
  }, [search, ideas]);

  async function handleSendInterest(e) {
    e.preventDefault();
    setSending(true);

    try {
      const res = await fetch('/api/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea_id: modalIdea.id,
          message,
          amount: Number(amount) || 0,
        }),
      });

      if (res.ok) {
        setSent(prev => new Set(prev).add(modalIdea.id));
        setModalIdea(null);
        setMessage('Interested in your idea');
        setAmount('');
      }
    } catch {
      // ignore
    }
    setSending(false);
  }

  return (
    <DashboardLayout role="investor">
      <div className="page-header">
        <div>
          <h1 className="page-title">Browse Ideas</h1>
          <p className="page-subtitle">Discover innovative ideas looking for investment</p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <input
          type="text"
          className="input-field"
          placeholder="🔍  Search by title, category, or creator..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 500 }}
        />
      </div>

      {loading ? (
        <div className="loading-state">Loading ideas...</div>
      ) : filtered.length > 0 ? (
        <div className="ideas-grid-dashboard">
          {filtered.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              showOwner
              actions={
                sent.has(idea.id) ? (
                  <span className="badge badge-success">✓ Interest Sent</span>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setModalIdea(idea)}
                  >
                    🤝 I'm OnBoard
                  </button>
                )
              }
            />
          ))}
        </div>
      ) : (
        <div className="empty-card">
          <div className="empty-icon">🔍</div>
          <h3>{search ? 'No ideas match your search' : 'No ideas available yet'}</h3>
          <p>{search ? 'Try a different search term' : 'Check back soon for new opportunities'}</p>
        </div>
      )}

      {/* Interest Modal */}
      {modalIdea && (
        <div className="modal-overlay" onClick={() => setModalIdea(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Express Interest</h2>
              <button className="modal-close" onClick={() => setModalIdea(null)}>×</button>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)', fontSize: 'var(--text-sm)' }}>
              You're expressing interest in: <strong style={{ color: 'var(--color-text)' }}>{modalIdea.title}</strong>
            </p>

            <form className="modal-form" onSubmit={handleSendInterest}>
              <div className="input-group">
                <label htmlFor="interest-message">Message to Ideator</label>
                <textarea
                  id="interest-message"
                  className="input-field"
                  placeholder="Why are you interested in this idea?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="input-group">
                <label htmlFor="interest-amount">Investment Amount ($)</label>
                <input
                  id="interest-amount"
                  type="number"
                  className="input-field"
                  placeholder="e.g. 10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalIdea(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Sending...' : '🤝 Send Interest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
