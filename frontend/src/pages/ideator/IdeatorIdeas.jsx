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
            <IdeaCard key={idea.id} idea={idea} />
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
