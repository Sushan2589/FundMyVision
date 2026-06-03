import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import IdeaCard from '../../components/IdeaCard';
import './IdeatorPages.css';

export default function IdeatorIdeas() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ideas/mine')
      .then(res => res.json())
      .then(data => { setIdeas(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleDelete(ideaId) {
    if (window.confirm("Are you sure you want to delete this idea permanently? This cannot be undone.")) {
      fetch(`/api/ideas/${ideaId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setIdeas(prev => prev.filter(i => i.id !== ideaId));
          } else {
            alert("Failed to delete: " + (data.error || ""));
          }
        })
        .catch(err => console.error(err));
    }
  }

  return (
    <DashboardLayout role="ideator">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Ideas</h1>
          <p className="page-subtitle">Manage all your posted ideas</p>
        </div>
        <Link to="/ideator/create-idea" className="btn btn-primary">
          + Post New Idea
        </Link>
      </div>

      {loading ? (
        <div className="loading-state">Loading your ideas...</div>
      ) : ideas.length > 0 ? (
        <div className="ideas-grid-dashboard">
          {ideas.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              actions={
                <div className="btn-group" style={{ gap: 'var(--space-2)' }}>
                  <Link to={`/ideator/edit-idea/${idea.id}`} className="btn btn-ghost btn-sm">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(idea.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                  >
                    Delete
                  </button>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <div className="empty-card">
          <div className="empty-icon">Ideas</div>
          <h3>No ideas posted yet</h3>
          <p>Share your innovative idea with the world and attract investors</p>
          <Link to="/ideator/create-idea" className="btn btn-primary">Post Your First Idea</Link>
        </div>
      )}
    </DashboardLayout>
  );
}
