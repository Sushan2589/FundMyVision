import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const ideatorLinks = [
  { to: '/ideator/dashboard', label: 'Dashboard' },
  { to: '/ideator/ideas', label: 'My Ideas' },
  { to: '/ideator/create-idea', label: 'Post New Idea' },
  { to: '/ideator/interests', label: 'Interests Received' },
  { to: '/chat', label: 'Messages / Chat' },
  { to: '/ideator/profile', label: 'My Profile' },
];

const investorLinks = [
  { to: '/investor/dashboard', label: 'Dashboard' },
  { to: '/investor/browse', label: 'Browse Ideas' },
  { to: '/investor/interests', label: 'My Interests' },
  { to: '/chat', label: 'Messages / Chat' },
  { to: '/investor/profile', label: 'Investor Profile' },
  { to: '/investor/kyc', label: 'KYC Verification' },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/kyc', label: 'KYC Management' },
  { to: '/admin/users', label: 'User Directory' },
];

export default function Sidebar({ role }) {
  const location = useLocation();
  
  let links = [];
  let roleLabel = '';
  if (role === 'ideator') {
    links = ideatorLinks;
    roleLabel = 'Ideator';
  } else if (role === 'investor') {
    links = investorLinks;
    roleLabel = 'Investor';
  } else if (role === 'admin') {
    links = adminLinks;
    roleLabel = 'Admin';
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-role-badge">{roleLabel}</span>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-link ${location.pathname === link.to ? 'active' : ''}`}
          >
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
