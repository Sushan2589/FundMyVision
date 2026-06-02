import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

export default function DashboardLayout({ role, children }) {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <Sidebar role={role} />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
