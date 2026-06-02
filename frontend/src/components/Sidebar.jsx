import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const ideatorLinks = [
  { to: '/ideator/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/ideator/ideas', label: 'My Ideas', icon: '💡' },
  { to: '/ideator/create-idea', label: 'Post New Idea', icon: '✏️' },
  { to: '/ideator/profile', label: 'My Profile', icon: '👤' },
];

const investorLinks = [
  { to: '/investor/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/investor/browse', label: 'Browse Ideas', icon: '🔍' },
  { to: '/investor/interests', label: 'My Interests', icon: '❤️' },
];

export default function Sidebar({ role }) {
  const location = useLocation();
  const links = role === 'ideator' ? ideatorLinks : investorLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-role-badge">
          {role === 'ideator' ? '💡 Ideator' : '💰 Investor'}
        </span>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-link ${location.pathname === link.to ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">{link.icon}</span>
            <span className="sidebar-link-label">{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-help-card">
          <p className="sidebar-help-title">Need Help?</p>
          <p className="sidebar-help-text">Contact our support team for assistance.</p>
        </div>
      </div>
    </aside>
  );
}
