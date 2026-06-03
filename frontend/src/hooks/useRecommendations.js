import { useEffect, useState } from 'react';

export default function useRecommendations(investorId) {
  const [ideaIds, setIdeaIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!investorId || investorId <= 0) {
      setIdeaIds([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    async function loadRecommendations() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`/recommend/${investorId}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error('Unable to load recommendations');
        }

        const data = await res.json();

        if (!active) {
          return;
        }

        setIdeaIds(Array.isArray(data.idea_ids) ? data.idea_ids : []);
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }

        if (active) {
          setIdeaIds([]);
          setError(err.message || 'Unable to load recommendations');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      active = false;
      controller.abort();
    };
  }, [investorId]);

  return { ideaIds, loading, error };
}