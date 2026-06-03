import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import './IdeatorPages.css';

export default function IdeatorEditIdea() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState('');
  const [fundingNeeded, setFundingNeeded] = useState('');
  const [category, setCategory] = useState('');
  const [stage, setStage] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/ideas/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load idea details");
        return res.json();
      })
      .then(data => {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setSummary(data.summary || '');
        setFundingNeeded(data.funding_needed || '');
        setCategory(data.category || '');
        setStage(data.stage || '');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Error loading idea');
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch(`/api/ideas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          summary,
          funding_needed: Number(fundingNeeded) || 0,
          category,
          stage,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        navigate(`/idea/${id}`);
      } else {
        setError(data.error || 'Failed to update idea');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setSaving(false);
  }

  return (
    <DashboardLayout role="ideator">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Vision Details</h1>
          <p className="page-subtitle">Update and refine your campaign parameters</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading vision data...</div>
      ) : (
        <div className="form-card">
          {error && (
            <div className="auth-error" style={{ marginBottom: 'var(--space-5)' }}>
              <span>Warning:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="idea-title">Idea Title *</label>
              <input
                id="idea-title"
                type="text"
                className="input-field"
                placeholder="e.g. AI-Powered Health Monitor"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="idea-summary">Short Summary</label>
              <input
                id="idea-summary"
                type="text"
                className="input-field"
                placeholder="One-line summary of your idea"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="idea-description">Detailed Description *</label>
              <textarea
                id="idea-description"
                className="input-field"
                placeholder="Explain your idea in detail — the problem, your solution, target audience, and what makes it unique..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={6}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
              <div className="input-group">
                <label htmlFor="idea-category">Category</label>
                <select
                  id="idea-category"
                  className="input-field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select category</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Finance">Finance</option>
                  <option value="Environment">Environment</option>
                  <option value="Social Impact">Social Impact</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="idea-stage">Stage</label>
                <select
                  id="idea-stage"
                  className="input-field"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                >
                  <option value="">Select stage</option>
                  <option value="Concept">Concept</option>
                  <option value="Prototype">Prototype</option>
                  <option value="MVP">MVP</option>
                  <option value="Growth">Growth</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="idea-funding">Funding Needed (Rs.)</label>
              <input
                id="idea-funding"
                type="number"
                className="input-field"
                placeholder="e.g. 50000"
                value={fundingNeeded}
                onChange={(e) => setFundingNeeded(e.target.value)}
                min="0"
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={saving}
              >
                {saving ? 'Updating...' : 'Save Changes'}
              </button>
              <Link to={`/idea/${id}`} className="btn btn-ghost btn-lg">Cancel</Link>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
