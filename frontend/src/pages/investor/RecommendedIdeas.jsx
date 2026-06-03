import { useEffect, useState } from 'react';
import IdeaCard from '../../components/IdeaCard';
import useRecommendations from '../../hooks/useRecommendations';

export default function RecommendedIdeas({ investorId }) {
  const { ideaIds, loading, error } = useRecommendations(investorId);
  const [ideas, setIdeas] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    if (!ideaIds.length) {
      setIdeas([]);
      setDetailsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    async function loadIdeaDetails() {
      setDetailsLoading(true);

      try {
        const results = await Promise.all(
          ideaIds.map(async (ideaId) => {
            const res = await fetch(`/api/ideas/${ideaId}`, {
              signal: controller.signal,
            });

            if (!res.ok) {
              return null;
            }

            return res.json();
          })
        );

        if (active) {
          setIdeas(results.filter(Boolean));
        }
      } catch {
        if (active) {
          setIdeas([]);
        }
      } finally {
        if (active) {
          setDetailsLoading(false);
        }
      }
    }

    loadIdeaDetails();

    return () => {
      active = false;
      controller.abort();
    };
  }, [ideaIds]);

  if (!investorId) {
    return null;
  }

  return (
    <div className="dashboard-section">
      <div className="dashboard-section-header">
        <h2>Recommended Ideas</h2>
      </div>

      {loading || detailsLoading ? (
        <div className="loading-state">Finding your best matches...</div>
      ) : error ? (
        <div className="empty-card">
          <div className="empty-icon">Match</div>
          <h3>Recommendations unavailable</h3>
          <p>{error}</p>
        </div>
      ) : ideas.length > 0 ? (
        <div className="ideas-grid-dashboard">
          {ideas.map((idea, index) => (
            <div key={idea.id} style={{ position: 'relative' }}>
              <span
                className="badge badge-primary"
                style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)', zIndex: 1 }}
              >
                #{index + 1}
              </span>
              <IdeaCard idea={idea} />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-card">
          <div className="empty-icon">Match</div>
          <h3>No recommendations yet</h3>
          <p>Check back after the recommender service has more data.</p>
        </div>
      )}
    </div>
  );
}