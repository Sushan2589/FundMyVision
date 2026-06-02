import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isLanding = location.pathname === '/';

  return (
    <nav className={`navbar ${isLanding ? 'navbar-transparent' : ''}`}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <svg className="navbar-logo-icon" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="2"/>
            <path d="M10 22V14h3v8h-3zm5 0V10h3v12h-3zm5 0V16h3v6h-3z" fill="currentColor"/>
            <path d="M8 18l8-10 8 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="navbar-brand-text">Fund<span className="navbar-brand-accent">My</span>Vision</span>
        </Link>

        <div className="navbar-links">
          {!user && (
            <>
              <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
              <a href="#how-it-works" className="navbar-link">How It Works</a>
              <a href="#featured" className="navbar-link">Browse Ideas</a>
            </>
          )}
          {user && user.role === 'ideator' && (
            <>
              <Link to="/ideator/dashboard" className={`navbar-link ${location.pathname === '/ideator/dashboard' ? 'active' : ''}`}>Dashboard</Link>
              <Link to="/ideator/ideas" className={`navbar-link ${location.pathname === '/ideator/ideas' ? 'active' : ''}`}>My Ideas</Link>
              <Link to="/ideator/create-idea" className={`navbar-link ${location.pathname === '/ideator/create-idea' ? 'active' : ''}`}>Post Idea</Link>
              <Link to="/ideator/profile" className={`navbar-link ${location.pathname === '/ideator/profile' ? 'active' : ''}`}>Profile</Link>
            </>
          )}
          {user && user.role === 'investor' && (
            <>
              <Link to="/investor/dashboard" className={`navbar-link ${location.pathname === '/investor/dashboard' ? 'active' : ''}`}>Dashboard</Link>
              <Link to="/investor/browse" className={`navbar-link ${location.pathname === '/investor/browse' ? 'active' : ''}`}>Browse Ideas</Link>
              <Link to="/investor/interests" className={`navbar-link ${location.pathname === '/investor/interests' ? 'active' : ''}`}>My Interests</Link>
            </>
          )}
        </div>

        <div className="navbar-actions">
          {!user ? (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          ) : (
            <div className="navbar-user-menu">
              <div className="navbar-user-pill">
                <div className="navbar-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="navbar-username">{user.username}</span>
              </div>
              <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
