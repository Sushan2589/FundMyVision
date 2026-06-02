import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ideator');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signup(email, username, password, role);

    if (result.success) {
      navigate('/login?signup=success');
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
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Join FundMyVision and start your journey</p>
          </div>

          {error && (
            <div className="auth-error">
              <span>Warning:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>I want to be a...</label>
              <div className="role-selector">
                <div
                  className={`role-option ${role === 'ideator' ? 'selected' : ''}`}
                  onClick={() => setRole('ideator')}
                >
                  <span className="role-option-icon">Idea</span>
                  <span className="role-option-label">Ideator</span>
                  <span className="role-option-desc">I have ideas to share</span>
                </div>
                <div
                  className={`role-option ${role === 'investor' ? 'selected' : ''}`}
                  onClick={() => setRole('investor')}
                >
                  <span className="role-option-icon">Fund</span>
                  <span className="role-option-label">Investor</span>
                  <span className="role-option-desc">I want to fund ideas</span>
                </div>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="signup-username">Username</label>
              <input
                id="signup-username"
                type="text"
                className="input-field"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                className="input-field"
                placeholder="Create a secure password"
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Log in</Link>
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-right-content">
          <div className="auth-right-icon">Start</div>
          <h2>Start Your Journey</h2>
          <p>Whether you're an innovator with a bold idea or an investor looking for the next opportunity — you're in the right place.</p>
        </div>
      </div>
    </div>
  );
}
