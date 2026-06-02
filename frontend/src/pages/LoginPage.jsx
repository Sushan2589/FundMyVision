import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate(`/${result.user.role}/dashboard`);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <Link to="/" className="auth-back-link">← Back to Home</Link>
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Log in to your FundMyVision account</p>
          </div>

          {error && (
            <div className="auth-error">
              <span>Warning:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="input-field"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">Sign up for free</Link>
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-right-content">
          <div className="auth-right-icon">Ideas</div>
          <h2>Turn Ideas Into Reality</h2>
          <p>Connect with investors who believe in your vision, or discover the next breakthrough idea to fund.</p>
        </div>
      </div>
    </div>
  );
}
