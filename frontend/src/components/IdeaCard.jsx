import { Link } from 'react-router-dom';
import './IdeaCard.css';

export default function IdeaCard({ idea, actions, showOwner = false }) {
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'Not specified';
    const n = Number(amount);
    if (Number.isNaN(n)) return 'Not specified';
    return `Rs.${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="idea-card card">
      <div className="idea-card-header">
        <div className="idea-card-meta">
          {idea.category && (
            <span className="badge">{idea.category}</span>
          )}
          {idea.stage && (
            <span className="badge badge-primary">{idea.stage}</span>
          )}
        </div>
        {idea.created_at && (
          <span className="idea-card-date">{formatDate(idea.created_at)}</span>
        )}
      </div>

      <h3 className="idea-card-title">
        <Link to={`/idea/${idea.id}`} className="idea-title-link">
          {idea.title}
        </Link>
      </h3>

      {idea.summary && (
        <p className="idea-card-summary">{idea.summary}</p>
      )}

      <p className="idea-card-description">
        {idea.description && idea.description.length > 160
          ? idea.description.substring(0, 160) + '...'
          : idea.description}
      </p>

      <div className="idea-card-footer">
        <div className="idea-card-funding">
          <span className="idea-card-funding-label">Funding Needed</span>
          <span className="idea-card-funding-amount">{formatCurrency(idea.funding_needed)}</span>
        </div>

        {showOwner && idea.owner_name && (
          <div className="idea-card-owner">
            <div className="idea-card-owner-avatar">
              {idea.owner_name.charAt(0).toUpperCase()}
            </div>
            <span className="idea-card-owner-name">{idea.owner_name}</span>
          </div>
        )}
      </div>

      {actions && (
        <div className="idea-card-actions">
          {actions}
        </div>
      )}
    </div>
  );
}
