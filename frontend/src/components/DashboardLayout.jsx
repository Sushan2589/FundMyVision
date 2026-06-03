import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.css';

export default function DashboardLayout({ role, children }) {
  const { user } = useAuth();
  const activeRole = role || user?.role;

  return (
    <div className="dashboard-layout">
      <Navbar />
      <Sidebar role={activeRole} />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
