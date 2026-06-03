import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import IdeaCard from '../../components/IdeaCard';
import './IdeatorPages.css';

export default function IdeatorDashboard() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ideas/mine')
      .then(res => res.json())
      .then(data => { setIdeas(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalFunding = ideas.reduce((sum, idea) => sum + (idea.funding_needed || 0), 0);

  return (
    <DashboardLayout role="ideator">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.username}</h1>
          <p className="page-subtitle">Here's an overview of your ideas and activity</p>
        </div>
        <Link to="/ideator/create-idea" className="btn btn-primary">
          + Post New Idea
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">Ideas</div>
          <div className="stat-info">
            <span className="stat-value">{ideas.length}</span>
            <span className="stat-label">Total Ideas</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">Funds</div>
          <div className="stat-info">
            <span className="stat-value">
              Rs.{totalFunding.toLocaleString()}
            </span>
            <span className="stat-label">Total Funding Requested</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">Stats</div>
          <div className="stat-info">
            <span className="stat-value">{ideas.filter(i => i.visibility === 'public').length || ideas.length}</span>
            <span className="stat-label">Public Ideas</span>
          </div>
        </div>
      </div>

      {/* Recent Ideas */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Recent Ideas</h2>
          <Link to="/ideator/ideas" className="btn btn-ghost btn-sm">View All →</Link>
        </div>

        {loading ? (
          <div className="loading-state">Loading your ideas...</div>
        ) : ideas.length > 0 ? (
          <div className="ideas-grid-dashboard">
            {ideas.slice(0, 3).map(idea => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        ) : (
          <div className="empty-card">
            <div className="empty-icon">Ideas</div>
            <h3>No ideas yet</h3>
            <p>Post your first idea to start attracting investors</p>
            <Link to="/ideator/create-idea" className="btn btn-primary">Post Your First Idea</Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
